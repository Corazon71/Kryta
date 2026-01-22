from __future__ import annotations

import json
import re
from typing import Any, Dict, Optional

from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.messages import HumanMessage, SystemMessage

from ..tools.youtube import youtube_playlist_curriculum_search
from .base import BaseAgent


class StrategistAgent(BaseAgent):
    def __init__(self):
        super().__init__(role="strategist")
        self.search_tool = DuckDuckGoSearchRun()
        self.tools = [youtube_playlist_curriculum_search]

    def _run_youtube_curriculum(self, user_goal: str) -> Dict[str, Any]:
        try:
            raw = youtube_playlist_curriculum_search(topic=user_goal)
            if isinstance(raw, dict):
                return raw
            return json.loads(str(raw))
        except Exception as e:
            return {"error": str(e)}

    def _run_search(self, query: str) -> str:
        try:
            return self.search_tool.run(query)
        except Exception:
            try:
                return self.search_tool.invoke(query)
            except Exception as e:
                return f"Search failed for query '{query}': {e}"

    def _parse_json_robust(self, text: str) -> Dict[str, Any]:
        cleaned = self._clean_json_text(text)
        try:
            return json.loads(cleaned)
        except Exception:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
            raise

    def generate_campaign_plan(self, user_goal: str, user_profile: Optional[dict]) -> dict:
        if not self.llm:
            return {"error": "API Key Missing. Please go to Settings."}

        user_profile = user_profile or {}

        youtube_curriculum = self._run_youtube_curriculum(user_goal)
        syllabus = youtube_curriculum.get("syllabus") if isinstance(youtube_curriculum, dict) else None

        research_blocks = []
        if isinstance(syllabus, list) and len(syllabus) > 0:
            research_blocks.append(
                {
                    "source": "youtube_playlist_curriculum_search",
                    "raw": youtube_curriculum,
                }
            )
        else:
            queries = [
                f"curriculum for {user_goal}",
                f"how to {user_goal} roadmap",
            ]
            for q in queries:
                research_blocks.append(
                    {
                        "source": "duckduckgo",
                        "query": q,
                        "results": self._run_search(q),
                    }
                )

            ddg_results = [b.get("results") for b in research_blocks]
            ddg_failed = all((not r) or str(r).lower().startswith("search failed") for r in ddg_results)
            if ddg_failed:
                return {
                    "error": "I couldn't find a good curriculum for that goal. Please make the topic more specific (e.g., 'Python for data analysis', 'React basics', 'Guitar blues basics')."
                }

        strategist_system_prompt = (
            "You are a Grand Strategist. Your job is to turn a vague goal into a structured campaign plan.\n"
            "You must output valid JSON only (no markdown, no code fences, no commentary).\n\n"
            "Return a JSON object with EXACTLY these top-level keys:\n"
            "- campaign_title: string\n"
            "- recurrence_schedule: string (example: 'Mon-Fri @ 19:00', pick a time that fits user availability)\n"
            "- milestones: array\n\n"
            "Each milestone must be an object with:\n"
            "- title: string\n"
            "- description: string\n"
            "- suggested_tasks: array of strings\n\n"
            "Rules:\n"
            "- Use the research results as grounding, but do not include citations or URLs in the output.\n"
            "- If a YouTube syllabus list is provided, you MUST group it into milestones (example: 'Videos 1-5 = Week 1').\n"
            "- Adapt the schedule and workload to the user's work hours, habits, and availability.\n"
            "- Milestones should be week/phases, ordered, realistic, and actionable.\n"
            "- If the goal is too vague and research is empty, ask for a more specific topic using an error JSON with key 'error'.\n"
        )

        user_context = {
            "user_goal": user_goal,
            "user_profile": {
                "name": user_profile.get("name"),
                "work_hours": user_profile.get("work_hours"),
                "habits": user_profile.get("habits"),
                "availability": user_profile.get("availability"),
                "timezone": user_profile.get("timezone"),
            },
            "research": research_blocks,
        }

        strategist_user_prompt = (
            "Synthesize a campaign plan from the following user context and research.\n"
            "Output JSON only.\n\n"
            f"CONTEXT: {json.dumps(user_context, ensure_ascii=False)}"
        )

        messages = [
            SystemMessage(content=strategist_system_prompt),
            HumanMessage(content=strategist_user_prompt),
        ]

        try:
            response = self.llm.invoke(messages)
            raw_content = str(response.content)
            return self._parse_json_robust(raw_content)
        except Exception:
            repair_messages = [
                SystemMessage(
                    content=(
                        "You are a JSON repair tool. Convert the input into valid JSON only. "
                        "Output JSON only with keys: campaign_title, recurrence_schedule, milestones."
                    )
                ),
                HumanMessage(
                    content=(
                        "Repair the following into valid JSON only.\n\n"
                        "INPUT:\n"
                        f"{locals().get('raw_content', '')}"
                    )
                ),
            ]
            try:
                response = self.llm.invoke(repair_messages)
                return self._parse_json_robust(str(response.content))
            except Exception as e:
                return {"error": str(e)}
