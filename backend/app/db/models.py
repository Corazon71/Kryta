from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, date
import uuid

class User(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(default="Operator")
    xp: int = Field(default=0)
    streak: int = Field(default=0)
    
    # Context
    work_hours: Optional[str] = None
    core_goals: Optional[str] = None
    bad_habits: Optional[str] = None
    
    # Safety Protocol (New)
    failure_streak: int = Field(default=0) # Tracks consecutive failures
    lockout_until: Optional[datetime] = None # Stores timestamp when ban ends

class Task(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    milestone_id: Optional[str] = Field(default=None, foreign_key="milestone.id")
    title: str
    status: str = Field(default="pending")
    estimated_time: int 
    
    # Scheduling
    priority: str = Field(default="medium") # new field
    scheduled_time: Optional[str] = None 
    is_urgent: bool = Field(default=False)
    
    # Clarity & Trust (New)
    success_criteria: str
    proof_instruction: Optional[str] = None # e.g. "Upload screenshot of terminal"
    minimum_viable_done: str
    last_failure_reason: Optional[str] = None # Stores why it was rejected

    target_date: date = Field(default_factory=date.today) # YYYY-MM-DD
    routine_id: Optional[str] = None # UUID to group recurring tasks (e.g. "Gym" everyday shares this ID)
    group_id: Optional[str] = None
    group_title: Optional[str] = None
    step_order: int = Field(default=1)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Campaign(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    title: str
    description: Optional[str] = None
    status: str = Field(default="active")
    total_weeks: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Milestone(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    campaign_id: str = Field(foreign_key="campaign.id")
    title: str
    description: Optional[str] = None
    week_number: int
    is_active: bool = Field(default=True)

class AppSettings(SQLModel, table=True):
    key: str = Field(primary_key=True)
    value: str