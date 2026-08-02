from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

# --- Gemini Extracted Pydantic Schemas ---

class SummaryDetail(BaseModel):
    purpose: str = Field(description="Concise statement of the meeting's primary objective or core topic.")
    discussion_points: List[str] = Field(default_factory=list, description="Key discussion topics covered during the meeting.")
    major_outcomes: List[str] = Field(default_factory=list, description="Major decisions, conclusions, or takeaways achieved.")
    concerns: List[str] = Field(default_factory=list, description="Risks, blockers, unanswered questions, or concerns raised.")
    next_steps: List[str] = Field(default_factory=list, description="General next steps or upcoming follow-up actions.")

class ExtractedActionItem(BaseModel):
    task: str = Field(description="Specific actionable task or to-do item assigned.")
    owner: str = Field(default="Unassigned", description="Name of person responsible. Use 'Unassigned' if missing.")
    due_date: str = Field(default="Not specified", description="Target completion date or ISO string (e.g. YYYY-MM-DD or descriptive like 'End of Sprint'). Default 'Not specified'.")
    priority: str = Field(default="Medium", description="Priority level: 'Low', 'Medium', or 'High'.")
    status: str = Field(default="Open", description="Status: 'Open', 'In Progress', 'Blocked', or 'Completed'. Default 'Open'.")

class ExtractedMeetingData(BaseModel):
    summary: SummaryDetail = Field(description="Structured summary breakdown of the meeting transcript.")
    key_decisions: List[str] = Field(default_factory=list, description="Array of specific decisions agreed upon in the meeting.")
    action_items: List[ExtractedActionItem] = Field(default_factory=list, description="Array of concrete action items extracted.")

# --- Auth Schemas ---

class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- FastAPI API Request/Response Schemas ---

class ActionItemBase(BaseModel):
    task: str
    owner: str = "Unassigned"
    due_date: str = "Not specified"
    priority: str = "Medium"
    status: str = "Open"

class ActionItemCreate(ActionItemBase):
    meeting_id: Optional[int] = None

class ActionItemUpdate(BaseModel):
    task: Optional[str] = None
    owner: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class ActionItemResponse(ActionItemBase):
    id: int
    meeting_id: Optional[int] = None
    meeting_title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MeetingCreate(BaseModel):
    title: str
    date: Optional[str] = None
    participants: Optional[str] = ""
    transcript: str

class MeetingResponse(BaseModel):
    id: int
    title: str
    date: str
    participants: str
    transcript: str
    summary: SummaryDetail
    key_decisions: List[str]
    action_items: List[ActionItemResponse]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MeetingListItem(BaseModel):
    id: int
    title: str
    date: str
    participants: str
    action_items_count: int
    open_action_items_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DashboardMetrics(BaseModel):
    total_meetings: int
    total_action_items: int
    open_tasks: int
    in_progress_tasks: int
    blocked_tasks: int
    completed_tasks: int
    overdue_tasks: int
    priority_breakdown: dict

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
