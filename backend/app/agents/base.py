import os
import sys
import json
import re
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

load_dotenv()

class BaseAgent:
    def __init__(self, role: str):
        self.llm = ChatGroq(
            temperature=0, 
            model_name="openai/gpt-oss-120b", 
            api_key=os.getenv("GROQ_API_KEY")
        )
        self.role = role

    def _load_prompt(self, prompt_name: str) -> str:
        # Check if running as compiled executable
        if getattr(sys, 'frozen', False):
            # If compiled, prompts are in the temp folder's 'prompts' dir
            base_path = os.path.join(sys._MEIPASS, "prompts")
        else:
            # If running normally (dev mode)
            base_path = os.path.join(os.path.dirname(__file__), "../prompts")
            
        path = os.path.join(base_path, f"{prompt_name}.md")
        try:
            with open(path, "r") as f:
                return f.read()
        except FileNotFoundError:
            return f"Error: Prompt {prompt_name} not found at {path}"

    def _clean_json_text(self, text: str) -> str:
        """
        Aggressively attempts to extract just the JSON object from a string.
        """
        # 1. Try to find markdown code blocks first
        if "```" in text:
            pattern = r"```(?:json)?\s*(\{.*?\})\s*```"
            match = re.search(pattern, text, re.DOTALL)
            if match:
                return match.group(1)

        # 2. Fallback: Find the first '{' and the last '}'
        start = text.find("{")
        end = text.rfind("}")
        
        if start != -1 and end != -1:
            return text[start : end + 1]
            
        return text

    def run(self, user_input: str, context: dict = None) -> dict:
        system_prompt = self._load_prompt(f"{self.role}_system")
        full_prompt = f"{system_prompt}\n\nCONTEXT: {json.dumps(context) if context else '{}'}"

        messages = [
            SystemMessage(content=full_prompt),
            HumanMessage(content=user_input)
        ]

        response = self.llm.invoke(messages)
        content = response.content

        # --- NEW ROBUST PARSING LOGIC ---
        cleaned_content = self._clean_json_text(content)
        
        try:
            return json.loads(cleaned_content)
        except json.JSONDecodeError as e:
            # Specific fix for "Extra data": 
            # If valid JSON is followed by garbage, e.pos tells us where JSON ended.
            if e.msg.startswith("Extra data"):
                try:
                    return json.loads(cleaned_content[:e.pos])
                except:
                    pass
            
            print(f"JSON Parse Error: {e}")
            print(f"Raw Content: {content}")
            return {"error": "Failed to parse JSON", "raw": content}