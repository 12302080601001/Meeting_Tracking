from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/action-items", tags=["Action Items"])

@router.get("", response_model=List[schemas.ActionItemResponse])
def list_action_items(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    owner: Optional[str] = Query(None),
    meeting_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.ActionItem)
    if status and status != "All":
        query = query.filter(models.ActionItem.status == status)
    if priority and priority != "All":
        query = query.filter(models.ActionItem.priority == priority)
    if owner and owner != "All":
        query = query.filter(models.ActionItem.owner.ilike(f"%{owner}%"))
    if meeting_id:
        query = query.filter(models.ActionItem.meeting_id == meeting_id)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (models.ActionItem.task.ilike(search_fmt)) |
            (models.ActionItem.owner.ilike(search_fmt))
        )

    items = query.order_by(models.ActionItem.created_at.desc()).all()
    response_list = []
    for item in items:
        meeting_title = item.meeting.title if item.meeting else "Standalone Task"
        response_list.append(schemas.ActionItemResponse(
            id=item.id, meeting_id=item.meeting_id, meeting_title=meeting_title,
            task=item.task, owner=item.owner, due_date=item.due_date,
            priority=item.priority, status=item.status,
            created_at=item.created_at, updated_at=item.updated_at
        ))
    return response_list

@router.post("", response_model=schemas.ActionItemResponse, status_code=201)
def create_action_item(
    payload: schemas.ActionItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    meeting_title = "Standalone Task"
    if payload.meeting_id:
        m = db.query(models.Meeting).filter(models.Meeting.id == payload.meeting_id).first()
        if m:
            meeting_title = m.title

    db_item = models.ActionItem(
        meeting_id=payload.meeting_id, task=payload.task,
        owner=payload.owner or "Unassigned", due_date=payload.due_date or "Not specified",
        priority=payload.priority or "Medium", status=payload.status or "Open"
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    return schemas.ActionItemResponse(
        id=db_item.id, meeting_id=db_item.meeting_id, meeting_title=meeting_title,
        task=db_item.task, owner=db_item.owner, due_date=db_item.due_date,
        priority=db_item.priority, status=db_item.status,
        created_at=db_item.created_at, updated_at=db_item.updated_at
    )

@router.patch("/{item_id}", response_model=schemas.ActionItemResponse)
def update_action_item(
    item_id: int,
    payload: schemas.ActionItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = db.query(models.ActionItem).filter(models.ActionItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    if payload.task is not None:
        item.task = payload.task
    if payload.owner is not None:
        item.owner = payload.owner
    if payload.due_date is not None:
        item.due_date = payload.due_date
    if payload.priority is not None and payload.priority in ["Low", "Medium", "High"]:
        item.priority = payload.priority
    if payload.status is not None and payload.status in ["Open", "In Progress", "Blocked", "Completed"]:
        item.status = payload.status

    db.commit()
    db.refresh(item)

    meeting_title = item.meeting.title if item.meeting else "Standalone Task"
    return schemas.ActionItemResponse(
        id=item.id, meeting_id=item.meeting_id, meeting_title=meeting_title,
        task=item.task, owner=item.owner, due_date=item.due_date,
        priority=item.priority, status=item.status,
        created_at=item.created_at, updated_at=item.updated_at
    )

@router.delete("/{item_id}", status_code=204)
def delete_action_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = db.query(models.ActionItem).filter(models.ActionItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")
    db.delete(item)
    db.commit()
    return None
