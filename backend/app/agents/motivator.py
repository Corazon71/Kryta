from .base import BaseAgent

class MotivatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(role="motivator")

    def distribute_rewards(self, task_title: str, estimated_time: int, quality_score: int, current_streak: int) -> dict:
        context = {
            "task": task_title,
            "difficulty_minutes": estimated_time,
            "quality_score": quality_score,
            "current_streak": current_streak
        }
        
        # We assume the user deserves a reward if this is called
        return self.run(
            user_input="Task completed successfully. Calculate rewards.", 
            context=context
        )