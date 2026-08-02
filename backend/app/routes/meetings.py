import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.ai_service import extract_meeting_insights, extract_meeting_insights_from_audio, ask_meeting_question
from app.auth import get_current_user

router = APIRouter(prefix="/api/meetings", tags=["Meetings"])

@router.post("", response_model=schemas.MeetingResponse, status_code=201)
def create_meeting(
    payload: schemas.MeetingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Create a new meeting record, extract structured summary, key decisions,
    and action items using Gemini GenAI SDK (with Pydantic response_schema).
    """
    if not payload.transcript or not payload.transcript.strip():
        raise HTTPException(status_code=400, detail="Meeting transcript cannot be empty.")

    meeting_date = payload.date or datetime.date.today().isoformat()
    
    # Extract AI Insights
    extracted_data = extract_meeting_insights(
        transcript=payload.transcript
    )

    return _save_meeting(db, payload.title, meeting_date, payload.participants or "", payload.transcript, extracted_data)


@router.post("/audio", response_model=schemas.MeetingResponse, status_code=201)
def create_meeting_from_audio(
    audio: UploadFile = File(...),
    title: str = Form("Untitled Audio Meeting"),
    date: str = Form(None),
    participants: str = Form(""),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Upload an audio file (.mp3, .wav, .m4a, .webm, .ogg) and have Gemini
    transcribe + extract structured meeting data in one multimodal call.
    """
    allowed_types = {
        "audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4",
        "audio/x-m4a", "audio/webm", "audio/ogg",
        "video/webm",  # browsers sometimes label .webm audio as video/webm
    }
    allowed_extensions = {".mp3", ".wav", ".m4a", ".webm", ".ogg"}

    filename = (audio.filename or "").lower()
    ext = ""
    if "." in filename:
        ext = "." + filename.rsplit(".", 1)[-1]

    ct = (audio.content_type or "").lower()
    if ct not in allowed_types and ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported audio format: {ct}. Accepted: mp3, wav, m4a, webm, ogg.")

    audio_bytes = audio.file.read()
    if len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Audio file appears to be empty or too small.")

    meeting_date = date or datetime.date.today().isoformat()

    # Multimodal Gemini extraction
    extracted_data, transcript_text = extract_meeting_insights_from_audio(
        audio_bytes=audio_bytes,
        mime_type=ct or f"audio/{ext.lstrip('.')}",
    )

    return _save_meeting(db, title, meeting_date, participants, transcript_text, extracted_data)


def _save_meeting(db, title, meeting_date, participants, transcript, extracted_data):
    """
    Shared helper to persist a meeting and its action items.
    """
    db_meeting = models.Meeting(
        title=title,
        date=meeting_date,
        participants=participants,
        transcript=transcript,
        summary_json=extracted_data.summary.model_dump_json(),
        key_decisions_json=json.dumps(extracted_data.key_decisions)
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)

    action_item_responses = []
    for item in extracted_data.action_items:
        db_action = models.ActionItem(
            meeting_id=db_meeting.id,
            task=item.task,
            owner=item.owner or "Unassigned",
            due_date=item.due_date or "Not specified",
            priority=item.priority if item.priority in ["Low", "Medium", "High"] else "Medium",
            status=item.status if item.status in ["Open", "In Progress", "Blocked", "Completed"] else "Open"
        )
        db.add(db_action)
        db.commit()
        db.refresh(db_action)
        
        action_item_responses.append(
            schemas.ActionItemResponse(
                id=db_action.id,
                meeting_id=db_meeting.id,
                meeting_title=db_meeting.title,
                task=db_action.task,
                owner=db_action.owner,
                due_date=db_action.due_date,
                priority=db_action.priority,
                status=db_action.status,
                created_at=db_action.created_at,
                updated_at=db_action.updated_at
            )
        )

    return schemas.MeetingResponse(
        id=db_meeting.id,
        title=db_meeting.title,
        date=db_meeting.date,
        participants=db_meeting.participants,
        transcript=db_meeting.transcript,
        summary=extracted_data.summary,
        key_decisions=extracted_data.key_decisions,
        action_items=action_item_responses,
        created_at=db_meeting.created_at
    )


@router.get("", response_model=List[schemas.MeetingListItem])
def list_meetings(
    search: Optional[str] = Query(None, description="Search by title or participants"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Meeting)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (models.Meeting.title.ilike(search_fmt)) |
            (models.Meeting.participants.ilike(search_fmt))
        )
    
    meetings = query.order_by(models.Meeting.created_at.desc()).all()
    
    result = []
    for m in meetings:
        total_actions = len(m.action_items)
        open_actions = sum(1 for item in m.action_items if item.status != "Completed")
        result.append(schemas.MeetingListItem(
            id=m.id,
            title=m.title,
            date=m.date,
            participants=m.participants or "",
            action_items_count=total_actions,
            open_action_items_count=open_actions,
            created_at=m.created_at
        ))
    return result

@router.get("/{meeting_id}", response_model=schemas.MeetingResponse)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    m = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")

    summary_data = json.loads(m.summary_json) if m.summary_json else {}
    summary = schemas.SummaryDetail(
        purpose=summary_data.get("purpose", ""),
        discussion_points=summary_data.get("discussion_points", []),
        major_outcomes=summary_data.get("major_outcomes", []),
        concerns=summary_data.get("concerns", []),
        next_steps=summary_data.get("next_steps", [])
    )
    
    key_decisions = json.loads(m.key_decisions_json) if m.key_decisions_json else []
    
    action_item_responses = [
        schemas.ActionItemResponse(
            id=item.id,
            meeting_id=m.id,
            meeting_title=m.title,
            task=item.task,
            owner=item.owner,
            due_date=item.due_date,
            priority=item.priority,
            status=item.status,
            created_at=item.created_at,
            updated_at=item.updated_at
        )
        for item in m.action_items
    ]

    return schemas.MeetingResponse(
        id=m.id,
        title=m.title,
        date=m.date,
        participants=m.participants,
        transcript=m.transcript,
        summary=summary,
        key_decisions=key_decisions,
        action_items=action_item_responses,
        created_at=m.created_at
    )

@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    m = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db.delete(m)
    db.commit()
    return None

@router.post("/{meeting_id}/chat", response_model=schemas.ChatResponse)
def chat_with_meeting(
    meeting_id: int,
    payload: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    m = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    answer = ask_meeting_question(m.transcript, payload.query)
    return schemas.ChatResponse(answer=answer)
