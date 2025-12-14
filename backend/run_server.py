import uvicorn
import os
import sys

# --- THE CHEAT CODE ---
# We explicitly import these so PyInstaller grabs them.
# We don't use them here, but just importing them fixes the "ModuleNotFound" errors.
import fastapi
import fastapi.middleware.cors
import starlette.middleware.cors
import sqlmodel
import pydantic
import langchain_groq
import langchain_core
import requests
# ----------------------

# Setup path to find the 'app' folder
base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(base_dir)

# Import the app
from app.main import app

if __name__ == "__main__":
    # Run Uvicorn
    # reload=False is critical for frozen apps
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)