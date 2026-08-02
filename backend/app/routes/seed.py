from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.sample_data import SAMPLE_MEETINGS
from app.ai_service import extract_meeting_insights
import json

router = APIRouter(prefix="/api/seed", tags=["Seed & Demo"])

@router.post("", status_code=201)
def seed_sample_data(db: Session = Depends(get_db)):
    """
    Seed 3 rich sample meeting records with AI extracted summaries and action items.
    """
    seeded_meetings = []
    
    for sample in SAMPLE_MEETINGS:
        # Check if title already exists
        existing = db.query(models.Meeting).filter(models.Meeting.title == sample["title"]).first()
        if existing:
            continue

        extracted = extract_meeting_insights(transcript=sample["transcript"])

        db_meeting = models.Meeting(
            title=sample["title"],
            date=sample["date"],
            participants=sample["participants"],
            transcript=sample["transcript"],
            summary_json=extracted.summary.model_dump_json(),
            key_decisions_json=json.dumps(extracted.key_decisions)
        )
        db.add(db_meeting)
        db.commit()
        db.refresh(db_meeting)

        for item in extracted.action_items:
            db_action = models.ActionItem(
                meeting_id=db_meeting.id,
                task=item.task,
                owner=item.owner,
                due_date=item.due_date,
                priority=item.priority,
                status=item.status
            )
            db.add(db_action)
        db.commit()
        seeded_meetings.append(db_meeting.title)

    return {"message": f"Successfully seeded {len(seeded_meetings)} sample meetings.", "titles": seeded_meetings}

@router.delete("", status_code=200)
def reset_database(db: Session = Depends(get_db)):
    """
    Reset all database records.
    """
    db.query(models.ActionItem).delete()
    db.query(models.Meeting).delete()
    db.commit()
    return {"message": "Database reset completed successfully."}
