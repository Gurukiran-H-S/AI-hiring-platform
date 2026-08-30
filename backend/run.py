"""
AI Hiring Platform - Backend Server Runner
Run directly with: python run.py
"""
import sys
import os

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn
from app.config import settings

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Starting HireAI FastAPI backend server on http://0.0.0.0:{port} ...")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.DEBUG,
        workers=1,
    )
