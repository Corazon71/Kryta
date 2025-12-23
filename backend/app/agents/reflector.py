from .base import BaseAgent

class ReflectorAgent(BaseAgent):
    def __init__(self):
        super().__init__(role="reflector")

    def generate_debrief(self, user_name: str, history_summary: str, trust_score: int) -> dict:
        context = {
            "user": user_name,
            "history": history_summary,
            "trust_score": trust_score,
            "rules": [
                "Be a Tactical Analyst. Concise, direct, military-style.",
                "Analyze the 'History' for patterns (e.g. failing at night, skipping hard tasks).",
                "Comment on the 'Trust Score'. If low, warn them. If high, praise discipline.",
                "Give 1 specific strategic recommendation for next week."
            ]
        }
        
        return self.run(f"Generate weekly tactical debrief for Operator {user_name}.", context)