import json
import re
from urllib.parse import quote_plus

import requests
import yt_dlp
from pydantic import BaseModel, Field
from langchain_core.tools import tool


class CurriculumBuilder:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        })

    def generate_roadmap_data(self, topic: str, max_items: int = 30):
        print(f"📡 Scanning YouTube for best '{topic}' curriculum...")

        search_query = quote_plus(topic)
        search_url = f"https://www.youtube.com/results?search_query={search_query}&sp=EgIQAw%253D%253D"

        try:
            response = self.session.get(search_url, timeout=10)
            response.raise_for_status()

            playlist_id = self._extract_first_playlist_id(response.text)

            if not playlist_id:
                return {"error": "No playlists found for this topic."}

            playlist_url = f"https://www.youtube.com/playlist?list={playlist_id}"
            print(f"🔗 Found Playlist URL: {playlist_url}")

            return self._extract_syllabus(playlist_url, max_items=max_items)

        except Exception as e:
            return {"error": f"Curriculum search failed: {str(e)}"}

    def _extract_first_playlist_id(self, html: str):
        try:
            pattern = r"var ytInitialData = ({.*?});"
            match = re.search(pattern, html, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
                contents = (
                    data.get("contents", {})
                    .get("twoColumnSearchResultsRenderer", {})
                    .get("primaryContents", {})
                    .get("sectionListRenderer", {})
                    .get("contents", [])[0]
                    .get("itemSectionRenderer", {})
                    .get("contents", [])
                )

                for item in contents:
                    if "playlistRenderer" in item:
                        return item["playlistRenderer"]["playlistId"]

            ids = re.findall(r"\"playlistId\":\"([A-Za-z0-9_-]+)\"", html)
            for pid in ids:
                if len(pid) > 2:
                    return pid

        except Exception:
            pass
        return None

    def _extract_syllabus(self, url: str, max_items: int = 30):
        print("📖 Extracting syllabus chapters...")

        ydl_opts = {
            "quiet": True,
            "extract_flat": True,
            "ignoreerrors": True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            if not info or "entries" not in info:
                return {"error": "Could not parse playlist content."}

            syllabus = [
                entry["title"]
                for entry in info["entries"]
                if entry and entry.get("title")
            ]

            return {
                "course_title": info.get("title", "Custom Curriculum"),
                "url": url,
                "total_items": len(syllabus),
                "syllabus": syllabus[:max_items],
            }


class YouTubePlaylistCurriculumInput(BaseModel):
    topic: str = Field(...)
    max_items: int = Field(30, ge=1, le=100)


@tool("youtube_playlist_curriculum_search", args_schema=YouTubePlaylistCurriculumInput)
def youtube_playlist_curriculum_search(topic: str, max_items: int = 30) -> str:
    """Search YouTube for playlists related to a topic and extract curriculum data.
    
    Args:
        topic: The topic to search for educational playlists
        max_items: Maximum number of items to extract from the playlist (1-100)
        
    Returns:
        JSON string containing course title, URL, total items, and syllabus list
    """
    builder = CurriculumBuilder()
    data = builder.generate_roadmap_data(topic, max_items=max_items)
    return json.dumps(data)
