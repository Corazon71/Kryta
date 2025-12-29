from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
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
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AppSettings(SQLModel, table=True):
    key: str = Field(primary_key=True)
    value: str