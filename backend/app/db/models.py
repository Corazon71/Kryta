from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
import uuid

class User(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(default="Operator")
    xp: int = Field(default=0)
    streak: int = Field(default=0)
    
    # --- NEW CONTEXT FIELDS ---
    work_hours: Optional[str] = None  # e.g. "9:00 AM - 5:00 PM"
    core_goals: Optional[str] = None  # e.g. "Learn GenAI, Get Fit"
    bad_habits: Optional[str] = None  # e.g. "Doomscrolling, Procrastination"

class Task(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    title: str
    description: Optional[str] = None
    status: str = Field(default="pending")
    estimated_time: int 
    
    # --- NEW FIELDS ---
    scheduled_time: Optional[str] = None # e.g. "18:30" or "Tomorrow 09:00"
    is_urgent: bool = Field(default=False)
    
    success_criteria: str
    minimum_viable_done: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AppSettings(SQLModel, table=True):
    key: str = Field(primary_key=True) # e.g., "groq_api_key"
    value: str