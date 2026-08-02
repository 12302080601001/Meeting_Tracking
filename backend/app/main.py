from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import meetings, action_items, dashboard, seed, auth_routes

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Meeting Tracker API",
    description="High-value AI Meeting Tracker API powered by FastAPI, SQLite, and Google GenAI SDK (Gemini Pydantic response_schema)",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_routes.router)
app.include_router(meetings.router)
app.include_router(action_items.router)
app.include_router(dashboard.router)
app.include_router(seed.router)

@app.get("/")
def root():
    return {
        "status": "healthy",
        "app": "AI Meeting Tracker API",
        "docs_url": "/docs",
        "gemini_sdk": "google-genai",
        "structured_schema": "response_schema"
    }
