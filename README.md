
# 🧠 Focus AI - Anti-Procrastination Desktop App

A local desktop app that acts as an AI Coach. It plans your day, breaks down tasks, and forces you to verify work before rewarding you with XP.

## 🛠 Tech Stack
- **Backend:** Python, FastAPI, SQLModel, LangChain (Groq/Llama3)
- **Frontend:** React, TailwindCSS, Framer Motion
- **Desktop:** Electron
- **Packaging:** PyInstaller + Electron Builder

## 🚀 How to Run (Dev Mode)

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
# Create a .env file with GROQ_API_KEY=...
uvicorn app.main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 📦 How to Build (.exe)

1. **Build Backend:**
   ```bash
   cd backend
   pyinstaller --clean --noconfirm --onedir --console --name "api" --add-data "app/prompts;prompts" --add-data "app;app" run_server.py
   ```

2. **Build Frontend & Package:**
   ```bash
   cd frontend
   npm run build
   npm exec electron-builder
   ```
   