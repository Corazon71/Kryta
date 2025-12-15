from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # <-- IMPORT THIS
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, time # <--- Add this

# Internal imports
from .db.database import get_session, init_db
from .db.models import Task, User
from .agents.planner import PlannerAgent
from .agents.verifier import VerifierAgent
from .agents.motivator import MotivatorAgent

app = FastAPI()

# --- NEW: Enable CORS ---
# This allows the React Frontend (port 5173) to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (Safe for local Electron app)
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"],
)
# ------------------------

# --- Input Models ---
class PlanRequest(BaseModel):
    goal: str
    available_time: int

class ProofRequest(BaseModel):
    task_id: str
    proof_content: str
    proof_image: Optional[str] = None # Base64 string

# --- Lifecycle ---
@app.on_event("startup")
def on_startup():
    init_db()

# --- Endpoints ---

@app.get("/dashboard")
def get_dashboard(session: Session = Depends(get_session)):
    # 1. Get User (Create if not exists)
    user = session.exec(select(User)).first()
    if not user:
        user = User(name="AlphaUser", xp=0, streak=0)
        session.add(user)
        session.commit()
        session.refresh(user)

    # 2. Get Tasks for TODAY only
    # We define "today" as starting from midnight server time
    today_start = datetime.combine(date.today(), time.min)
    
    tasks = session.exec(
        select(Task)
        .where(Task.user_id == user.id)
        .where(Task.created_at >= today_start)
    ).all()

    return {
        "user": user,
        "tasks": [t.model_dump() for t in tasks]
    }

@app.post("/plan")
def generate_plan(request: PlanRequest, session: Session = Depends(get_session)):
    planner = PlannerAgent()
    result = planner.create_plan(request.goal, request.available_time)
    
    saved_tasks = []
    if "tasks" in result and len(result["tasks"]) > 0:
        user = session.exec(select(User)).first()
        if not user:
            user = User(name="AlphaUser")
            session.add(user)
            session.commit()
            session.refresh(user)

        for task_data in result["tasks"]:
            task = Task(
                user_id=user.id,
                title=task_data.get("title", "Untitled Task"),
                estimated_time=task_data.get("estimated_time", 10),
                success_criteria=task_data.get("success_criteria", "Complete the task"),
                minimum_viable_done=task_data.get("minimum_viable_done", "Do it"),
                status="pending"
            )
            session.add(task)
            saved_tasks.append(task)
        
        session.commit()
        
        for t in saved_tasks:
            session.refresh(t)

        return {
            "status": "success", 
            "tasks": [t.model_dump() for t in saved_tasks] 
        }
    
    return {"status": "error", "message": "No tasks generated", "debug": result}

@app.post("/verify")
def verify_proof(request: ProofRequest, session: Session = Depends(get_session)):
    task = session.get(Task, request.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    user = session.exec(select(User)).first()
    if not user:
        user = User(name="AlphaUser", xp=0, streak=0)
        session.add(user)
        session.commit()
        session.refresh(user)

    verifier = VerifierAgent()
    verification_result = verifier.verify_task(
        task_title=task.title,
        success_criteria=task.success_criteria,
        user_proof=request.proof_content,
        image_data=request.proof_image  # <--- PASS THE IMAGE HERE
    )

    verdict = verification_result.get("verdict", "retry").lower()
    quality_score = verification_result.get("quality_score", 0)
    reward_data = {}

    if verdict == "pass":
        task.status = "completed"
        motivator = MotivatorAgent()
        reward_data = motivator.distribute_rewards(
            task_title=task.title,
            estimated_time=task.estimated_time,
            quality_score=quality_score,
            current_streak=user.streak
        )
        user.xp += reward_data.get("xp_awarded", 0)
        user.streak += 1
        session.add(user)
        
    elif verdict == "partial":
        task.status = "partial"
    else:
        task.status = "retry"

    session.add(task)
    session.commit()
    session.refresh(task)
    session.refresh(user)

    return {
        "status": "processed",
        "task_status": task.status,
        "verification": verification_result,
        "reward": {
            "xp_gained": reward_data.get("xp_awarded", 0),
            "message": reward_data.get("message"),
            "total_user_xp": user.xp
        },
        "task": task.model_dump()
    }