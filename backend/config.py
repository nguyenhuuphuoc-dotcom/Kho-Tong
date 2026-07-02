"""
config.py — Cấu hình tập trung cho KhoUNICE Backend
Load từ file .env hoặc environment variables
"""
import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self):
        self.SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
        self.SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
        self.CLAUDE_API_KEY: str = os.getenv("CLAUDE_API_KEY", "")
        self.GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

        if not self.SUPABASE_URL:
            raise ValueError("Thiếu SUPABASE_URL trong .env")
        if not self.SUPABASE_KEY:
            raise ValueError("Thiếu SUPABASE_KEY trong .env")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
