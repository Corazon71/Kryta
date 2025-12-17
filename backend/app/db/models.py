from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
import uuid

class User(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    xp: int = Field(default=0)
    streak: int = Field(default=0)

class Task(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    title: str
    description: Optional[str] = None
    status: str = Field(default="pending") # pending, completed, failed
    estimated_time: int # in minutes
    success_criteria: str
    minimum_viable_done: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AppSettings(SQLModel, table=True):
    key: str = Field(primary_key=True) # e.g., "groq_api_key"
    value: str