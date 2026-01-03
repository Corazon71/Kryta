
***

# 👁️ KRYTA
> **"Run in the Background. Execute in Reality."**

**KRYTA** is not a to-do list. It is an AI-powered **Productivity Operating System** designed to gamify your life and enforce discipline. It uses LLM Agents to plan your day, Vision AI to verify your work, and a tactical HUD to track your consistency.

![KRYTA Interface](https://via.placeholder.com/1200x600?text=KRYTA+Command+Center+v3.0)

## ⚡ Core Systems (v3.0)

### 🧠 1. Strategic Planner (The Architect)
*   **Context-Aware Scheduling:** The AI knows your work hours (e.g., 9-5) and will automatically schedule personal tasks around them.
*   **Collision Detection:** Prevents double-booking and ensures 10-minute buffers between missions.
*   **Smart Overflow:** If your day is full, low-priority tasks are pushed to "Tomorrow."

### 👁️ 2. Vision Verification (The Eye)
*   **Proof of Work:** Drag & drop visual evidence (screenshots, photos) to complete a mission.
*   **AI Analysis:** The Verifier Agent (Llama-3.2-Vision) analyzes the image pixels.
    *   *Good Proof:* "Mission Passed + XP."
    *   *Bad Proof:* "Correction Needed. Image too blurry."
*   **Break Glass Protocol:** Fails 3 verifications in a row? The system locks down for 10 minutes.

### 📊 3. Tactical Analytics (The Reflector)
*   **Trust Score:** A calculated metric (0-100%) of your honesty with the system.
*   **Consistency Heatmap:** A GitHub-style grid tracking your daily momentum over 28 days.
*   **Tactical Debrief:** Generate an AI-written report on your weekly performance patterns.

### 🔊 4. Neural Ambience (The Pulse)
*   **Voice Feedback:** The system speaks to you ("System Online," "Mission Accomplished").
*   **SFX:** Mechanical UI sounds for a tactile, cyberpunk experience.
*   **Native Notifications:** Desktop alerts when a scheduled mission begins.

---

## 🛠 Tech Stack

**Frontend (The Interface)**
*   **Framework:** React + Vite + Electron
*   **Styling:** Tailwind CSS (Custom "Void Black" Palette)
*   **Motion:** Framer Motion (Glassmorphism & Physics)
*   **Charts:** Recharts
*   **Audio:** Web Speech API + use-sound

**Backend (The Intelligence)**
*   **Core:** Python 3.10+, FastAPI
*   **AI Engine:** LangChain + Groq (Llama-3-70b & Llama-3.2-Vision)
*   **Database:** SQLModel (SQLite) with persistent user profiles.
*   **Packaging:** PyInstaller (Self-contained executable).

---

## 🚀 Installation (Development Mode)

Follow these steps to run the source code locally.

### 1. Prerequisites
*   Node.js & npm
*   Python 3.10+
*   A **Groq API Key** (Get it free at [console.groq.com](https://console.groq.com))

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate it (Windows)
.venv\Scripts\activate
# Activate it (Mac/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the Server
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend

# Install Node modules
npm install

# Run the Electron App
npm start
```

---

## 📦 How to Build (Production .exe)

To create a shareable installer that works without Python/Node installed:

### Step 1: Compile Backend
This freezes the Python environment into a standalone executable (`api.exe`).
```bash
cd backend
pyinstaller --clean --noconfirm --onedir --console --name "api" --add-data "app/prompts;prompts" --add-data "app;app" run_server.py
```

### Step 2: Compile Frontend
This builds the React code into static assets.
```bash
cd frontend
npm run build
```

### Step 3: Package Application
This bundles the `api.exe` and React assets into a Windows Installer.
```bash
npm exec electron-builder
```

*The final installer will be in `frontend/dist-electron/`.*

---

## 🎮 Usage Guide (The First Run)

1.  **System Offline:** On first launch, the app is locked.
2.  **Neural Link:** Click the **Settings (Gear)** icon. Enter your Groq API Key. The system will ping the server. If successful: **"NEURAL LINK ESTABLISHED."**
3.  **Identity Initialization:** The app will interview you.
    *   *Identity:* Your Name.
    *   *Restricted Zones:* Your Work/School hours (e.g., "9-5").
    *   *Maintenance:* Sleep/Eat times.
4.  **Command Line:** Type your goal (e.g., "Learn React") into the bottom input bar.
5.  **Execution:** Follow the Timeline. Click the card to start the timer. Upload proof to finish.

---

## 📂 Project Structure

```
KRYTA/
├── backend/
│   ├── app/
│   │   ├── agents/      # Planner, Verifier, Reflector Logic
│   │   ├── db/          # Database Models & Connection
│   │   ├── prompts/     # System Prompts (.md)
│   │   └── main.py      # API Endpoints
│   ├── run_server.py    # PyInstaller Entry Point
│   └── requirements.txt
├── frontend/
│   ├── public/sounds/   # SFX Assets
│   ├── src/
│   │   ├── components/  # Timeline, Settings, Onboarding
│   │   ├── hooks/       # Audio & API Hooks
│   │   └── App.jsx      # Main Logic Controller
│   ├── electron/
│   │   └── main.cjs     # Electron Main Process
│   └── package.json
└── README.md
```
