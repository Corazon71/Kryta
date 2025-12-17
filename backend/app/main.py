from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # <-- IMPORT THIS
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, time, timedelta # <--- Add this

# Internal imports
from .db.database import get_session, init_db
from .db.models import Task, User, AppSettings
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
class KeyRequest(BaseModel):
    api_key: str

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

@app.get("/analytics")
def get_analytics(session: Session = Depends(get_session)):
    user = session.exec(select(User)).first()
    if not user:
        return {}
    
    # ... inside get_analytics ...

    # 1. Calculate Date Range (Last 28 Days for Heatmap)
    today = date.today()
    heatmap_start = today - timedelta(days=27) # 28 days total
    
    # 2. Fetch tasks
    tasks = session.exec(
        select(Task)
        .where(Task.user_id == user.id)
        .where(Task.created_at >= datetime.combine(heatmap_start, time.min))
    ).all()

    # 3. Process Heatmap Data (Map Date -> Count)
    activity_map = {}
    for t in tasks:
        if t.status == 'completed':
            d_str = t.created_at.strftime("%Y-%m-%d")
            activity_map[d_str] = activity_map.get(d_str, 0) + 1

    # 4. Generate Full List (Fill zeros for missing days)
    heatmap_data = []
    for i in range(28):
        current_date = heatmap_start + timedelta(days=i)
        d_str = current_date.strftime("%Y-%m-%d")
        count = activity_map.get(d_str, 0)
        
        # Determine intensity level (0-4) for coloring
        intensity = 0
        if count > 0: intensity = 1
        if count > 2: intensity = 2
        if count > 4: intensity = 3
        if count > 6: intensity = 4

        heatmap_data.append({
            "date": d_str,
            "day_name": current_date.strftime("%a")[0], # M, T, W...
            "count": count,
            "intensity": intensity
        })

    # [Rest of your existing Chart Data Logic for last 7 days goes here...]

    # 1. Calculate Date Range (Last 7 Days)
    today = date.today()
    start_date = today - timedelta(days=6)
    
    # 2. Fetch all tasks in this range
    tasks = session.exec(
        select(Task)
        .where(Task.user_id == user.id)
        .where(Task.created_at >= datetime.combine(start_date, time.min))
    ).all()

    # 3. Aggregate Data for Charts
    # Format: { "Mon": 50, "Tue": 120, ... }
    daily_xp = {}
    
    # Initialize with 0
    for i in range(7):
        day_str = (start_date + timedelta(days=i)).strftime("%a") # Mon, Tue...
        daily_xp[day_str] = 0

    total_completed = 0
    total_failed = 0

    for t in tasks:
        day_str = t.created_at.strftime("%a")
        if t.status == 'completed':
            # Simple heuristic: Completed task = 20 XP (approx) 
            # In a real app, store XP per task in DB. 
            # For now, we estimate based on count or if you added an xp column to tasks.
            # Let's assume 1 task = 1 unit of productivity for the chart
            daily_xp[day_str] += t.estimated_time 
            total_completed += 1
        elif t.status == 'retry':
            total_failed += 1

    chart_data = [{"day": k, "minutes": v} for k, v in daily_xp.items()]

    return {
        "chart_data": chart_data, # (Your existing 7-day data)
        "heatmap_data": heatmap_data, # <--- NEW
        "stats": {
            "total_completed": total_completed,
            "total_failed": total_failed,
            "completion_rate": int((total_completed / (total_completed + total_failed + 1)) * 100)
        }
    }


@app.post("/settings/key")
def save_api_key(request: KeyRequest, session: Session = Depends(get_session)):
    # 1. Validate the key works (Simple test)
    try:
        from langchain_groq import ChatGroq
        from langchain_core.messages import HumanMessage
        
        # Test connection
        test_llm = ChatGroq(api_key=request.api_key, model_name="llama3-8b-8192")
        test_llm.invoke([HumanMessage(content="Hello")])
    except Exception as e:
        return {"status": "error", "message": "Invalid API Key. Connection failed."}

    # 2. Save to DB
    setting = session.get(AppSettings, "groq_api_key")
    if not setting:
        setting = AppSettings(key="groq_api_key", value=request.api_key)
    else:
        setting.value = request.api_key
    
    session.add(setting)
    session.commit()
    
    return {"status": "success", "message": "Neural Link Established."}

@app.get("/settings/key")
def get_api_key_status(session: Session = Depends(get_session)):
    setting = session.get(AppSettings, "groq_api_key")
    # We never return the full key for security, just confirmation
    if setting and setting.value:
        masked = f"{setting.value[:4]}...{setting.value[-4:]}"
        return {"configured": True, "masked": masked}
    return {"configured": False, "masked": None}