import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("", response_model=schemas.DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    total_meetings = db.query(models.Meeting).count()
    all_action_items = db.query(models.ActionItem).all()

    total_action_items = len(all_action_items)
    open_tasks = sum(1 for i in all_action_items if i.status == "Open")
    in_progress_tasks = sum(1 for i in all_action_items if i.status == "In Progress")
    blocked_tasks = sum(1 for i in all_action_items if i.status == "Blocked")
    completed_tasks = sum(1 for i in all_action_items if i.status == "Completed")

    today_str = datetime.date.today().isoformat()
    overdue_tasks = 0
    for item in all_action_items:
        if item.status != "Completed":
            dd = item.due_date.strip()
            if len(dd) == 10 and dd.count("-") == 2:
                if dd < today_str:
                    overdue_tasks += 1

    priority_breakdown = {
        "High": sum(1 for i in all_action_items if i.priority == "High"),
        "Medium": sum(1 for i in all_action_items if i.priority == "Medium"),
        "Low": sum(1 for i in all_action_items if i.priority == "Low")
    }

    return schemas.DashboardMetrics(
        total_meetings=total_meetings,
        total_action_items=total_action_items,
        open_tasks=open_tasks,
        in_progress_tasks=in_progress_tasks,
        blocked_tasks=blocked_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_tasks,
        priority_breakdown=priority_breakdown
    )
