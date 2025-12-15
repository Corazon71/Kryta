from .base import BaseAgent
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq
import os
import json

class VerifierAgent(BaseAgent):
    def __init__(self):
        super().__init__(role="verifier")
        # Specialized Vision Model
        self.vision_llm = ChatGroq(
            temperature=0, 
            model_name="meta-llama/llama-4-scout-17b-16e-instruct", 
            api_key=os.getenv("GROQ_API_KEY")
        )

    def verify_task(self, task_title: str, success_criteria: str, user_proof: str, image_data: str = None) -> dict:
        
        # 1. Text-Only Verification (The Old Way)
        if not image_data:
            context = {
                "task_title": task_title,
                "required_criteria": success_criteria,
                "user_provided_proof": user_proof
            }
            return self.run(f"Verify this work: {user_proof}", context)

        # 2. Vision Verification (The New Way)
        # We manually construct the multimodal message for Llama Vision
        print("DEBUG: Engaged Vision Model")
        
        system_prompt = self._load_prompt("verifier_system")
        prompt_text = f"""
        TASK: {task_title}
        CRITERIA: {success_criteria}
        USER NOTE: {user_proof}
        
        Analyze the image provided. Does it provide evidence that the task is completed according to the criteria?
        If the image is irrelevant to the task, reject it.
        
        Output valid JSON only.
        """

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=[
                {"type": "text", "text": prompt_text},
                {
                    "type": "image_url", 
                    "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
                }
            ])
        ]

        try:
            response = self.vision_llm.invoke(messages)
            content = response.content
            
            # Clean json (reuse the logic from BaseAgent manually or via helper)
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "{" in content:
                start = content.find("{")
                end = content.rfind("}") + 1
                content = content[start:end]
            
            return json.loads(content)
        except Exception as e:
            print(f"Vision Error: {e}")
            return {
                "verdict": "retry", 
                "reason": "Vision analysis failed. Please provide more text detail.", 
                "quality_score": 0
            }