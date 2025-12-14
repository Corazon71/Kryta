from .base import BaseAgent

class VerifierAgent(BaseAgent):
    def __init__(self):
        # We use the versatile 70b model, but for images later 
        # you would switch to "llama-3.2-11b-vision-preview"
        super().__init__(role="verifier")

    def verify_task(self, task_title: str, success_criteria: str, user_proof: str) -> dict:
        context = {
            "task_title": task_title,
            "required_criteria": success_criteria,
            "user_provided_proof": user_proof
        }
        
        # We send this structured context to the LLM
        return self.run(
            user_input=f"Verify this work: {user_proof}", 
            context=context
        )