import os
import re
import json
import logging
from typing import Optional, Tuple
from google import genai
from google.genai import types
from app.schemas import ExtractedMeetingData, SummaryDetail, ExtractedActionItem
from app.config import settings

logger = logging.getLogger("ai_service")
logging.basicConfig(level=logging.INFO)

SYSTEM_PROMPT = """You are an expert AI Executive Assistant.
Your task is to analyze meeting transcripts and extract accurate, structured meeting information into JSON format.

Extraction Guidelines:
1. Summary:
   - Purpose: Clear, concise breakdown of the meeting's objective.
   - Discussion Points: 3-5 bullet points covering main conversation topics.
   - Major Outcomes: key conclusions or decisions reached.
   - Concerns: any risks, dependencies, blockers, or budget/timeline issues raised.
   - Next Steps: general high-level next steps.
2. Key Decisions: Explicit choices or agreements made during the discussion.
3. Action Items:
   - task: Specific action required.
   - owner: Person assigned. Default to "Unassigned" if not explicitly specified.
   - due_date: ISO date (e.g. YYYY-MM-DD) if mentioned or descriptive timeframe (e.g. "Next Friday", "End of Sprint"). Default to "Not specified".
   - priority: "High", "Medium", or "Low" based on urgency. Default to "Medium".
   - status: Default to "Open" unless explicitly completed/in progress.
"""

AUDIO_SYSTEM_PROMPT = """You are an expert AI Executive Assistant.
You will be given an audio recording of a meeting.

Your task:
1. First, carefully transcribe all speech in the audio.
2. Then analyze the transcription and extract accurate, structured meeting information into JSON.

Extraction Guidelines:
1. Summary:
   - Purpose: Clear, concise breakdown of the meeting's objective.
   - Discussion Points: 3-5 bullet points covering main conversation topics.
   - Major Outcomes: key conclusions or decisions reached.
   - Concerns: any risks, dependencies, blockers, or budget/timeline issues raised.
   - Next Steps: general high-level next steps.
2. Key Decisions: Explicit choices or agreements made during the discussion.
3. Action Items:
   - task: Specific action required.
   - owner: Person assigned. Default to "Unassigned" if not explicitly specified.
   - due_date: ISO date (e.g. YYYY-MM-DD) if mentioned or descriptive timeframe. Default to "Not specified".
   - priority: "High", "Medium", or "Low" based on urgency. Default to "Medium".
   - status: Default to "Open" unless explicitly completed/in progress.
"""

CHAT_SYSTEM_PROMPT = """You are an expert AI Executive Assistant embedded inside an AI Meeting Tracker application.
You are given the transcript of a specific meeting. The user will ask questions about this meeting.
You must answer their questions accurately and concisely based ONLY on the provided meeting transcript.
If the transcript does not contain the answer, say "I cannot find the answer to that in the meeting transcript."
"""

# ── Schema for audio pipeline (includes transcript field) ──────────
from pydantic import BaseModel, Field
from typing import List

class AudioExtractedMeetingData(BaseModel):
    """Schema for Gemini multimodal audio extraction, includes the transcript."""
    transcript: str = Field(description="Full verbatim transcription of the audio recording.")
    summary: SummaryDetail = Field(description="Structured summary breakdown of the meeting.")
    key_decisions: List[str] = Field(default_factory=list, description="Specific decisions agreed upon.")
    action_items: List[ExtractedActionItem] = Field(default_factory=list, description="Concrete action items extracted.")


def extract_meeting_insights(transcript: str) -> ExtractedMeetingData:
    """
    Extract structured meeting details using google-genai SDK with strict response_schema.
    Reads GEMINI_API_KEY dynamically from the environment (.env file).
    """
    # Re-read from environment dynamically
    api_key = os.getenv("GEMINI_API_KEY", "").strip() or settings.GEMINI_API_KEY.strip()
    
    if api_key and api_key != "your_actual_key_here":
        try:
            client = genai.Client(api_key=api_key)
            model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
            
            logger.info(f"Calling Gemini ({model_name}) via google-genai SDK with response_schema...")
            
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    SYSTEM_PROMPT,
                    f"Here is the raw meeting transcript:\n\n{transcript}"
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ExtractedMeetingData,
                    temperature=0.2,
                ),
            )
            
            if response.text:
                logger.info("Successfully received Gemini response_schema structured JSON")
                extracted = ExtractedMeetingData.model_validate_json(response.text)
                return extracted
        except Exception as e:
            logger.error(f"Gemini API call error: {str(e)}. Falling back to dynamic parser.")
    else:
        logger.info("GEMINI_API_KEY not configured or placeholder detected in .env. Operating in dynamic parser mode.")

    return _fallback_heuristic_extraction(transcript)


def extract_meeting_insights_from_audio(
    audio_bytes: bytes,
    mime_type: str,
) -> Tuple[ExtractedMeetingData, str]:
    """
    Use Gemini multimodal to transcribe audio and extract meeting data in one call.
    Returns (ExtractedMeetingData, transcript_text).
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip() or settings.GEMINI_API_KEY.strip()

    if not api_key or api_key == "your_actual_key_here":
        raise ValueError("GEMINI_API_KEY is required for audio transcription.")

    client = genai.Client(api_key=api_key)
    model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"

    logger.info(f"Calling Gemini ({model_name}) multimodal audio → structured JSON...")

    # Build multimodal parts: system prompt + inline audio bytes
    audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)

    response = client.models.generate_content(
        model=model_name,
        contents=[
            AUDIO_SYSTEM_PROMPT,
            audio_part,
            "Transcribe the audio above, then extract the structured meeting data."
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=AudioExtractedMeetingData,
            temperature=0.2,
        ),
    )

    if not response.text:
        raise ValueError("Gemini returned an empty response for the audio file.")

    logger.info("Successfully received multimodal audio structured JSON")
    audio_data = AudioExtractedMeetingData.model_validate_json(response.text)

    # Convert to standard ExtractedMeetingData
    extracted = ExtractedMeetingData(
        summary=audio_data.summary,
        key_decisions=audio_data.key_decisions,
        action_items=audio_data.action_items,
    )

    return extracted, audio_data.transcript

def ask_meeting_question(transcript: str, query: str) -> str:
    """
    Ask a specific question about a meeting transcript using Gemini.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip() or settings.GEMINI_API_KEY.strip()
    
    if not api_key or api_key == "your_actual_key_here":
        return "Gemini API key is not configured. Please add it to the .env file to use the Chat feature."

    client = genai.Client(api_key=api_key)
    model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"

    logger.info(f"Calling Gemini ({model_name}) to answer a question about the meeting...")

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=[
                CHAT_SYSTEM_PROMPT,
                f"--- MEETING TRANSCRIPT ---\n{transcript}\n--- END TRANSCRIPT ---\n\nUser Question: {query}"
            ],
            config=types.GenerateContentConfig(
                temperature=0.4,
            ),
        )
        return response.text or "No answer generated by Gemini."
    except Exception as e:
        logger.error(f"Gemini API chat error: {str(e)}")
        return f"Sorry, I encountered an error answering your question: {str(e)}"


def _fallback_heuristic_extraction(transcript: str) -> ExtractedMeetingData:
    """
    Dynamic transcript parser when Gemini API Key is waiting to be filled in .env.
    Extracts actual tasks, owners, and decisions directly from the transcript text.
    """
    lines = [line.strip() for line in transcript.split("\n") if line.strip()]
    
    purpose = "Discuss project goals, requirements, technical strategy, and action items."
    if lines:
        purpose = f"Meeting discussion regarding: {lines[0]}"

    discussion_points = []
    major_outcomes = []
    concerns = []
    next_steps = []
    key_decisions = []
    action_items = []

    for line in lines:
        lower_line = line.lower()
        
        # Decision detection
        if any(w in lower_line for w in ["decided", "agreed", "decision:", "will use", "approved"]):
            clean_decision = re.sub(r'^(decision:|-|\*|\d+\.)', '', line, flags=re.IGNORECASE).strip()
            if clean_decision:
                key_decisions.append(clean_decision)
                major_outcomes.append(clean_decision)

        # Action item detection
        elif any(w in lower_line for w in ["action:", "todo:", "will", "assigned", "needs to", "must"]):
            task_text = line
            owner = "Unassigned"
            priority = "Medium"
            due_date = "Not specified"

            owner_match = re.search(r'([A-Z][a-z]+)\s*(?:will|should|to|assigned|\:)', line)
            if owner_match:
                owner = owner_match.group(1)

            if "urgent" in lower_line or "asap" in lower_line or "high priority" in lower_line:
                priority = "High"
            elif "low priority" in lower_line:
                priority = "Low"

            date_match = re.search(r'(by|due|before)\s+([A-Za-z0-9\s,-]+)', lower_line)
            if date_match:
                due_date = date_match.group(2).strip()

            clean_task = re.sub(r'^(action item:|[A-Z][a-z]+:|todo:|-|\*|\d+\.)', '', task_text, flags=re.IGNORECASE).strip()
            
            action_items.append(ExtractedActionItem(
                task=clean_task or line,
                owner=owner,
                due_date=due_date,
                priority=priority,
                status="Open"
            ))
            
        elif any(w in lower_line for w in ["risk", "concern", "blocker", "delay", "issue"]):
            concerns.append(line)
        else:
            if len(discussion_points) < 5 and len(line) > 15:
                discussion_points.append(line)

    if not discussion_points:
        discussion_points = ["Reviewed core project deliverables", "Aligned team dependencies and timelines"]

    if not major_outcomes:
        major_outcomes = ["Finalized action items and task ownership"]

    if not concerns:
        concerns = ["Track timeline carefully to prevent release delays"]

    if not next_steps:
        next_steps = ["Execute assigned action items", "Re-convene for progress review"]

    if not key_decisions:
        key_decisions = ["Proceed with current implementation strategy"]

    if not action_items:
        action_items = [
            ExtractedActionItem(
                task="Follow up on meeting discussion items",
                owner="Team",
                due_date="End of week",
                priority="Medium",
                status="Open"
            )
        ]

    summary = SummaryDetail(
        purpose=purpose,
        discussion_points=discussion_points,
        major_outcomes=major_outcomes,
        concerns=concerns,
        next_steps=next_steps
    )

    return ExtractedMeetingData(
        summary=summary,
        key_decisions=key_decisions,
        action_items=action_items
    )
