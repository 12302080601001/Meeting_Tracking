# 🎙️ AI Meeting Tracker & Executive Assistant

An intelligent, full-stack meeting management platform powered by **Google Gemini 2.5 Flash** (`google-genai` SDK with strict Pydantic `response_schema` extraction). 

Transform raw meeting text transcripts or audio recordings into structured meeting summaries, key decisions, and trackable action items with automated ownership assignment and priority tracking.

---

## ✨ Key Features

- **🔐 Simple, Secure Authentication**: Built-in JWT authentication with passlib/bcrypt password hashing for protected API access and session persistence.
- **🎙️ Multimodal Audio Upload & Auto-Transcription**: Upload raw audio files (`.mp3`, `.wav`, `.m4a`, `.webm`, `.ogg`) for direct Gemini transcription and insight extraction in a single step.
- **📄 Structured Meeting Analysis**: Automatically extracts core purpose, discussion points, major outcomes, concerns/blockers, next steps, key decisions, and action items using strict Pydantic schemas.
- **💬 Ask AI About This Meeting**: Interactive contextual chat assistant embedded in every meeting view. Ask real-time questions about decisions, budgets, or specific transcript details.
- **📋 Central Action Tracker Tab**: Unified task management workspace with sorting, filtering (by priority, owner, status, keyword search), and dynamic inline status updates persisted instantly to SQLite.
- **🔍 Live Search & Filter**: Instant search across meeting titles, participants, and action items with debounced query optimization.
- **📤 Export & Share**: Copy formatted plaintext meeting outcomes to clipboard or print/export clean PDF reports directly from the UI.
- **🌗 Dark & Light Mode Theme Toggle**: Seamless persistence of user theme preference (dark slate palette / crisp light palette) across page refreshes.
- **📊 Real-time Dashboard Analytics**: Visual stat cards for Total Meetings, Total Action Items, Open Tasks, and Priority distribution charts with clean empty state fallbacks.

---

## 🛠️ Technology Stack

### **Backend**
- **Framework**: Python 3.11+ / FastAPI
- **Database**: SQLite with SQLAlchemy ORM
- **AI Integration**: Google GenAI SDK (`google-genai` with `gemini-2.5-flash`)
- **Authentication**: OAuth2 Password Bearer with JWT (`python-jose`) and `passlib`/`bcrypt`

### **Frontend**
- **Core**: React 19, Vite
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **HTTP Client**: Native Fetch API with standard Auth Bearer headers

---

## 📁 Repository Structure

```
ai_meeting_tracker/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry point & CORS configuration
│   │   ├── models.py          # SQLAlchemy DB models (User, Meeting, ActionItem)
│   │   ├── schemas.py         # Pydantic schemas for AI extraction & API payloads
│   │   ├── auth.py            # JWT token & password hashing utilities
│   │   ├── ai_service.py      # Gemini SDK integration (text, audio & chat)
│   │   ├── database.py        # SQLite engine & SessionLocal setup
│   │   └── routes/            # API Route Handlers (auth, meetings, action_items, dashboard, seed)
│   ├── tests/                 # API integration tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components (Navbar, Badges, Modals)
│   │   ├── pages/             # Main view pages (Dashboard, Meetings, ActionItems, Auth)
│   │   ├── api/client.js      # Centralized API fetch wrapper
│   │   ├── App.jsx            # Main App layout & theme manager
│   │   └── index.css          # Tailwind CSS v4 entry & Light/Dark mode rules
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started & Installation

### Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** installed
- A **Google Gemini API Key** ([Get your API key here](https://aistudio.google.com/))

---

### 1. Environment Setup

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
SECRET_KEY=super-secret-jwt-key
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend server will run at `http://127.0.0.1:8000`. API documentation is available at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

Run backend integration tests:

```bash
cd backend
source venv/bin/activate
pytest tests/
```

---

## 📜 License

This project is licensed under the MIT License.
