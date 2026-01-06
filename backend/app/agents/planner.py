# backend/app/agents/planner.py
from .base import BaseAgent
from datetime import datetime

class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__(role="planner")

    # Update the method signature
    def create_plan(self, user_goal: str, available_time: int, user_profile: dict = None, existing_schedule: str = "None") -> dict:
        
        now = datetime.now()
        current_time = now.strftime("%H:%M")
        today_date = now.strftime("%Y-%m-%d") # <--- NEW CONTEXT
        day_of_week = now.strftime("%A")
        
        # 2. Build Rich Context (Updated with Schedule)
        profile_context = "User Profile: Unknown"
        if user_profile:
            profile_context = f"""
            USER IDENTITY:
            - Name: {user_profile.get('name', 'Operator')}
            - Work Hours: {user_profile.get('work_hours', 'Not specified')}
            """
        context = {
            "current_time": current_time,
            "today_date": today_date, # <--- PASS TO PROMPT
            "current_day": day_of_week,
            "available_minutes": available_time,
            "user_context": profile_context,
            "existing_schedule": existing_schedule,
            "rules": [
                "Max task size: 20 minutes",
                "Must define minimum_viable_done",
                "CRITICAL: Avoid double-booking.",
                f"The User already has tasks scheduled at: {existing_schedule}",
                "MANDATORY: Add a 10-minute buffer/break between every task.", 
                "Output 'scheduled_time' in 24hr format (HH:MM)."
                "Handle Recurrence: Expand 'daily' or 'weekly' requests into individual task objects with correct 'target_date'.",
                "Format 'target_date' strictly as YYYY-MM-DD."
            ]
        }
        
        return self.run(user_goal, context)