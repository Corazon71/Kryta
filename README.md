
***

# 👁️ DAEMON (v2.0)
> **"Run in the Background. Execute in Reality."**

DAEMON is a local, AI-powered "Operating System" for productivity. Unlike standard to-do lists, it uses **LLM Agents** to plan your day, a **Vision Agent** to physically verify your work, and a **Gamified Economy** (XP, Streaks) to keep you addicted to progress.

## ⚡ Key Features (v2.0)

### 🧠 1. AI Planning (The Core)
*   Input vague goals ("Study physics", "Clean room").
*   **Planner Agent (Llama-3-70b)** breaks them down into executable micro-tasks (max 20 mins).
*   Strict "Minimum Viable Done" criteria for every task.

### 👁️ 2. Vision Verification (The Eye)
*   **Drag & Drop** photo proof of your work.
*   **Verifier Agent (Llama-3.2-Vision)** analyzes the pixels to confirm the task was actually done.
*   Rejects lazy work or partial attempts.

### 📊 3. Tactical Analytics (The Brain)
*   **XP Velocity Chart:** Visualizes productivity output over the last 7 days.
*   **Consistency Heatmap:** A GitHub-style, 28-day grid tracking your daily streak.
*   **Success Rates:** Tracks completion vs. failure ratios.

### 🖥️ 4. Command Center UI (The Skin)
*   **Cyberpunk/Stealth Aesthetic:** Deep void black, electric violet, and terminal green.
*   **Split HUD:** Real-time Chronometer, Status Corner, and Dock Navigation.
*   **Glassmorphism:** Framer Motion animations and reactive UI elements.

---

## 🛠 Tech Stack

**Frontend (The Face)**
*   React + Vite
*   Electron (Desktop Wrapper)
*   Tailwind CSS (Custom Palette)
*   Framer Motion (Animations)
*   Recharts (Data Visualization)

**Backend (The Intelligence)**
*   Python 3.10+
*   FastAPI + Uvicorn
*   LangChain + Groq API (Llama 3 Models)
*   SQLModel (SQLite Database)
*   PyInstaller (Compilation)

---

## 🚀 How to Run (Development Mode)

### 1. Prerequisites
*   Node.js & npm
*   Python 3.10 or higher
*   A **Groq API Key** (Get it free at console.groq.com)

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "GROQ_API_KEY=gsk_your_key_here" > .env
```

### 3. Frontend Setup
```bash
cd frontend

# Install Node modules
npm install

# Run the full stack (React + Electron + Python)
npm start
```

---

## 📦 How to Build (Create Installer)

To create a standalone `.exe` file that works without Python installed:

### Step 1: Build the Backend (Python)
This compiles the FastAPI server into a single executable.
```bash
cd backend
pyinstaller --clean --noconfirm --onedir --console --name "api" --add-data "app/prompts;prompts" --add-data "app;app" run_server.py
```

### Step 2: Build the Frontend (React)
This compiles the React code into static HTML/JS.
```bash
cd frontend
npm run build
```

### Step 3: Package with Electron
This bundles everything into an installer.
```bash
npm exec electron-builder
```

### ⚠️ IMPORTANT: Final Step
The builder **does not** include your API key for security. After building:
1.  Go to `frontend/dist-electron/win-unpacked/resources/api/`
2.  **Paste your `.env` file** into this folder.
3.  Run `Focus AI.exe`.

---

## 📂 Project Structure

```
DAEMON/
├── backend/
│   ├── app/
│   │   ├── agents/      # LLM Logic (Planner, Verifier)
│   │   ├── db/          # SQLModel Database
│   │   ├── prompts/     # System Prompts (.md)
│   │   └── main.py      # FastAPI Endpoints
│   ├── run_server.py    # PyInstaller Entry Point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main UI Controller
│   │   └── api.js       # Backend Connector
│   ├── electron/
│   │   └── main.cjs     # Electron Main Process
│   └── package.json
└── README.md
```