import os
import json
import re
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
from sqlmodel import Session, select
from ..db.database import engine # Import engine to query DB
from ..db.models import AppSettings

load_dotenv()

class BaseAgent:
    def __init__(self, role: str):
        self.role = role
        self.api_key = self._get_api_key()
        
        # Guard clause: If no key, we can't initialize the LLM yet
        if self.api_key:
            self.llm = ChatGroq(
                temperature=0, 
                model_name="openai/gpt-oss-120b", # Using versatile for better availability
                api_key=self.api_key
            )
        else:
            self.llm = None

    def _get_api_key(self) -> str:
        """
        Priority:
        1. Database (User provided setting)
        2. Environment Variable (.env file)
        """
        try:
            with Session(engine) as session:
                setting = session.get(AppSettings, "groq_api_key")
                if setting and setting.value:
                    return setting.value
        except Exception:
            pass # DB might not be ready
            
        return os.getenv("GROQ_API_KEY")

    def _load_prompt(self, prompt_name: str) -> str:
        import sys
        if getattr(sys, 'frozen', False):
            base_path = os.path.join(sys._MEIPASS, "prompts")
        else:
            base_path = os.path.join(os.path.dirname(__file__), "../prompts")
            
        path = os.path.join(base_path, f"{prompt_name}.md")
        with open(path, "r") as f:
            return f.read()

    def _clean_json_text(self, text: str) -> str:
        if "```" in text:
            pattern = r"```(?:json)?\s*(\{.*?\})\s*```"
            match = re.search(pattern, text, re.DOTALL)
            if match: return match.group(1)
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1: return text[start : end + 1]
        return text

    def run(self, user_input: str, context: dict = None) -> dict:
        if not self.llm:
            return {"error": "API Key Missing. Please go to Settings."}

        system_prompt = self._load_prompt(f"{self.role}_system")
        full_prompt = f"{system_prompt}\n\nCONTEXT: {json.dumps(context) if context else '{}'}"

        messages = [
            SystemMessage(content=full_prompt),
            HumanMessage(content=user_input)
        ]

        try:
            response = self.llm.invoke(messages)
            content = response.content
            cleaned_content = self._clean_json_text(content)
            return json.loads(cleaned_content)
        except Exception as e:
            return {"error": str(e)}