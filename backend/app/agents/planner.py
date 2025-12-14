# backend/app/agents/planner.py
from .base import BaseAgent

class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__(role="planner")

    def create_plan(self, user_goal: str, available_time: int) -> dict:
        context = {
            "available_minutes": available_time,
            "rules": [
                "Max task size: 20 minutes",
                "Must define minimum_viable_done",
                "Break down abstract goals into executables"
            ]
        }
        
        # 1. Get raw result from LLM
        result = self.run(user_goal, context)

        # 2. Normalize Data Structure
        # Case A: LLM returned a list directly: [{"title":...}, {...}]
        if isinstance(result, list):
            return {"tasks": result}
            
        # Case B: LLM returned dict but with wrong key (e.g., "plan", "steps")
        if isinstance(result, dict):
            if "tasks" in result:
                return result
            
            # Look for any key that holds a list
            for key, value in result.items():
                if isinstance(value, list) and len(value) > 0:
                    return {"tasks": value}
        
        # Case C: Total failure or empty
        return {"tasks": []}