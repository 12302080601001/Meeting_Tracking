import pytest
from app.schemas import ExtractedMeetingData, SummaryDetail, ExtractedActionItem
from app.ai_service import _fallback_heuristic_extraction

def test_pydantic_schema_validation():
    summary = SummaryDetail(
        purpose="Review sprint goals",
        discussion_points=["API endpoints", "UI mocks"],
        major_outcomes=["Approved design"],
        concerns=["Tight schedule"],
        next_steps=["Start coding"]
    )
    
    action = ExtractedActionItem(
        task="Implement FastAPI router",
        owner="Marcus",
        due_date="2026-08-05",
        priority="High",
        status="Open"
    )

    data = ExtractedMeetingData(
        summary=summary,
        key_decisions=["Use Gemini 2.5 Flash for extraction"],
        action_items=[action]
    )

    assert data.summary.purpose == "Review sprint goals"
    assert len(data.key_decisions) == 1
    assert data.action_items[0].owner == "Marcus"
    assert data.action_items[0].priority == "High"

def test_heuristic_fallback_extraction():
    transcript = """
    Alice: We need to finalize the database model.
    Decision: Use SQLite with SQLAlchemy.
    Action item: Bob will complete database migrations by Friday. Priority: High.
    """
    extracted = _fallback_heuristic_extraction(transcript)
    assert isinstance(extracted, ExtractedMeetingData)
    assert len(extracted.action_items) > 0
    assert any("SQLite" in d for d in extracted.key_decisions)
