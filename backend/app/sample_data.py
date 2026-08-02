SAMPLE_MEETINGS = [
    {
        "title": "Q3 Platform Architecture & AI Integration Sync",
        "date": "2026-08-01",
        "participants": "Alex Rivera (Tech Lead), Sarah Chen (Product Manager), Marcus Vance (Senior Backend Lead), Elena Rostova (Frontend Lead)",
        "transcript": """
Sarah Chen: Welcome everyone. Today we are reviewing the Q3 platform architecture updates and finalizing our AI integration strategy.
Alex Rivera: Great. I've reviewed the design options. We decided to adopt Python FastAPI with SQLAlchemy and SQLite for local development, paired with Vite React on the frontend.
Marcus Vance: What about the AI extraction engine? We need reliable structured outputs.
Alex Rivera: We agreed to use the official google-genai SDK with Gemini 2.5 Flash. We will strictly enforce response_schema with Pydantic models so we get 100% valid JSON without string regex hacks.
Elena Rostova: Perfect. That eliminates parsing errors. For frontend components, we should build a central Action Tracker table with inline status updates (Open, In Progress, Blocked, Completed).
Sarah Chen: Sounds great. Let's cover key assignments:
Action: Marcus will write the FastAPI backend database models and route controllers by Wednesday. Priority: High.
Action: Elena will build the React frontend dashboard and inline status dropdowns by Friday. Priority: High.
Action: Alex will set up the Gemini GenAI SDK integration with Pydantic schema validation by Thursday. Priority: High.
Action: Sarah will draft the final Q3 release notes and document user flows by next Monday. Priority: Medium.
Marcus Vance: Are there any blockers?
Alex Rivera: The only risk is API rate limits during heavy loads, so we should implement standard fallback handlers.
Sarah Chen: Perfect. Decision confirmed: Gemini Flash 2.5 with response_schema is our standard AI pipeline. Meeting adjourned.
"""
    },
    {
        "title": "Weekly Product Roadmap & UX Design Review",
        "date": "2026-07-28",
        "participants": "Sarah Chen (Product Manager), Elena Rostova (Frontend Lead), David Kim (UX Designer)",
        "transcript": """
Sarah Chen: Let's review the user interface updates for our AI Meeting Tracker.
David Kim: I've created mockups for the Dashboard and Central Action Tracker. We decided on a dark-themed, modern palette with crisp status badges and metric counters.
Elena Rostova: The layout looks super clean. Can we support filtering action items by owner, priority, and status?
David Kim: Yes, the action table will feature live search by owner and filter buttons for priority and status.
Sarah Chen: Excellent. Key decision: We are adopting the dark glassmorphism layout for our primary UI.
Action: David will export final SVG icons and component color tokens by Tuesday. Priority: Medium. Assigned to David.
Action: Elena will integrate the filter bar into the Action Tracker table by Thursday. Priority: High. Assigned to Elena.
Action: Sarah will test the UI with 5 beta users and collect UX feedback before next week's sync. Priority: Low. Assigned to Sarah.
David Kim: No other concerns. We are on track for the sprint demo.
"""
    },
    {
        "title": "Security Audit & Performance Benchmarking",
        "date": "2026-07-25",
        "participants": "Alex Rivera (Tech Lead), Marcus Vance (Senior Backend Lead), Julia Zhang (Security Specialist)",
        "transcript": """
Julia Zhang: Thanks for joining. We conducted a security and performance check on our API routes and SQLite database.
Marcus Vance: How did the SQLite response time benchmark perform?
Julia Zhang: SQLite handled 10,000 queries per second effortlessly for local workloads. However, we agreed to ensure proper connection pooling and transaction scoping.
Alex Rivera: Decision: We will store encrypted API keys in environment variables or user session state rather than plain database logs.
Julia Zhang: Exactly.
Action: Julia will review CORS configurations and sanitize transcript input payloads by Thursday. Priority: High. Assigned to Julia.
Action: Marcus will implement WAL mode for SQLite to improve concurrent read performance by Wednesday. Priority: Medium. Assigned to Marcus.
Alex Rivera: Meeting concluded. Excellent job team.
"""
    }
]
