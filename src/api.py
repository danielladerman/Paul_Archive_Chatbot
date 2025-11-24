from fastapi import FastAPI, Header, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import re
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from sqlalchemy import delete

from src.chatbot import PaulChatbot
from src import config
from src.database import get_db, init_db, ChatHistory, TimelineEvent as DBTimelineEvent, GalleryImage as DBGalleryImage
from fastapi import Query
from src.data_processing import load_documents

# --- Security ---
API_SECRET_KEY = os.getenv("API_SECRET_KEY") or os.getenv("X_API_KEY")

async def verify_api_key(x_api_key: str = Header(...)):
    if not API_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API key not configured on the server.",
        )
    if x_api_key != API_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key.",
        )

app = FastAPI(title="Paul Project API")

@app.on_event("startup")
def on_startup():
    if config.DATABASE_URL:
        init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatQuery(BaseModel):
    question: str

class ChatHistoryResponse(BaseModel):
    id: int
    question: str
    answer: str
    sources: List[dict] = []
    created_at: str
    class Config:
        orm_mode = True

# Initialize once at startup
chatbot_instance = PaulChatbot()

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "Paul Project API",
        "docs": "/docs",
        "chat": {"method": "POST", "path": "/chat", "body": {"question": "string"}},
    }

@app.get("/suggestions", response_model=List[str])
def get_suggestions():
    """
    Returns a list of dynamically generated question suggestions.
    """
    try:
        suggestions = chatbot_instance.generate_suggestions()
        return suggestions
    except Exception as e:
        print(f"Failed to get suggestions: {e}")
        # Return a default list of suggestions on error
        return [
            "Tell me about Paul's early life",
            "What were some of his core beliefs?",
            "What was his profession?",
            "Tell me about his family"
        ]

@app.get("/content", response_model=List[str])
def get_content_topics(mode: str = Query("curated")):
    """
    Returns content topics.
    - mode=curated (default): curated list / JSON file fallback
    - mode=titles: derive topics from document titles only (no year)
    - mode=overrides: return titles exactly as defined in data/title_overrides.json
    """
    # Strictly return the override titles as-is
    if mode == "overrides":
        try:
            overrides_path = os.path.join(config.DATA_PATH, "title_overrides.json")
            if os.path.exists(overrides_path):
                with open(overrides_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, dict):
                    # Preserve insertion order of JSON mapping values (Python 3.7+ preserves order)
                    return [str(v) for v in data.values() if v is not None]
        except Exception as e:
            print(f"Failed to load override titles: {e}")
        # Fallback to titles mode on error
        mode = "titles"

    if mode == "titles":
        try:
            docs = load_documents() or []
            # Optional: allow overriding titles by source filename via JSON mapping
            overrides = {}
            try:
                overrides_path = os.path.join(config.DATA_PATH, "title_overrides.json")
                if os.path.exists(overrides_path):
                    with open(overrides_path, "r", encoding="utf-8") as f:
                        raw = json.load(f)
                        if isinstance(raw, dict):
                            overrides = {str(k): str(v) for k, v in raw.items() if v is not None}
            except Exception as e:
                print(f"Failed to load title overrides: {e}")
            items: List[str] = []
            for d in docs:
                meta = d.metadata or {}
                # Prefer explicit override by source filename when available
                src = meta.get("source")
                src_base = os.path.basename(src) if isinstance(src, str) else ""
                override_title = overrides.get(src_base)
                title = override_title or meta.get("title") or "Untitled Document"
                items.append(title)
            # de-duplicate while preserving order
            seen = set()
            items = [t for t in items if not (t in seen or seen.add(t))]
            return items
        except Exception as e:
            print(f"Failed to build titles content: {e}")
            # fall through to curated

    # curated mode (existing behavior)
    curated_topics = [
        "Tell me about Paul's childhood in Denver.",
        "What was Paul's family ancestry and origin?",
        "Describe Paul's early rabbinic career in the USA.",
        "What was Paul's role as a USAF Chaplain?",
        "Tell me about Paul's travels in Europe in 1948-1949.",
        "What did Paul write about the Yom Hashoah Interfaith journal?",
        "What are Paul's reflections on Halachah and homosexuality?",
        "Explain the correspondence between Paul and Lamm on homosexuality.",
        "What was Paul's involvement with the Open Hillel at Berkeley in 1971?",
        "What was the 'Is Israel Phony?' article from 1972?",
        "Describe Paul's work with community centers in 1983.",
        "What was the significance of the Tamra Community Center?",
        "Tell me about Paul's work with Ethiopian Jewry.",
        "What did Paul write about the Intifada in 1989?",
        "What were Paul's thoughts on a West Bank Compromise in 1988?",
        "What was the 'Humanitarian Cooperation' article about?",
        "Tell me about the eulogy Paul gave for Benjy.",
        "What did Paul write in his tribute to Reuven Hammer?",
        "Describe the Kaddish journey and tribute to his son.",
        "What are Paul's thoughts on 'Netilat Yadaim' (washing of hands)?",
        "Explain Paul's drasha on Passover in 1971.",
        "What is the connection between Song of Songs and Passover according to Paul?",
        "Tell me about the Tu BiShvat Seder.",
        "What did Paul write about Rosh Hashana?",
        "Describe the Pidyon Ha-Ben service Paul wrote about.",
        "What were the condolence letters from Siskel and Nowick?",
        "Tell me about the story of the lost pocket knife.",
        "What was Paul's educational project in 1967?",
        "Describe Paul's certificate from Mercaz HaRav Kook Yeshiva.",
        "What was 'Children's Paradise'?",
        "Tell me about the visit from the German sisters Kanaan in 2003.",
        "What did Paul's 1976 letter to his parents say?",
        "What were Paul's reflections on returning to America?",
        "How did Paul view Judaism through the lens of Israel?",
        "What was his role in directing 105 community centers in 1981?",
        "What was the memorial service for Manuel in 1989 about?",
        "What did Paul write about Purim in 1989?",
        "Tell me about his thoughts on Israel and religious movements in 1988.",
        "What was Paul's summary of his life for the Azkara?",
        "What was his work with Aliyah and Israel?",
        "Describe his years in Israel as a Rabbi and educator.",
        "What recognition did he receive for Youth Education Guidance?",
        "Tell me about Paul's interfaith and peace advocacy.",
        "What were the wedding ceremonies he performed like?",
        "What were his early life and family like?",
        "Summarize Paul's rabbinic leadership in the US.",
        "Tell me about his time living in Israel.",
        "What did he write about the community center in 1986?",
        "Living in a Jewish State.",
        "What are the highlights of Paul's master career timeline?"
    ]

    # Try to load from JSON file if available
    try:
        topics_path = os.path.join(config.DATA_PATH, "content_topics.json")
        if os.path.exists(topics_path):
            with open(topics_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                return [str(item) for item in data if item is not None]
    except Exception as e:
        print(f"Failed to load content topics JSON: {e}")

    return curated_topics


@app.get("/people")
def get_people():
    """
    Returns a structured list of people and communities derived from data/people.md.
    Each entry has:
    - name: the bolded name
    - description: the text after the dash
    - category: the nearest preceding '##' heading
    """
    people_path = os.path.join(config.DATA_PATH, "people.md")
    if not os.path.exists(people_path):
        return []

    entries: List[dict] = []
    current_category: Optional[str] = None

    try:
        with open(people_path, "r", encoding="utf-8") as f:
            for raw_line in f:
                stripped = raw_line.rstrip("\n").strip()

                if stripped.startswith("## "):
                    current_category = stripped[3:].strip()
                    continue

                if stripped.startswith("- **"):
                    # Robust parse of "- **Name** – description" with any dash / spacing variations.
                    # 1) grab the name between the first pair of ** **.
                    try:
                        start = stripped.index("**") + 2
                        end = stripped.index("**", start)
                    except ValueError:
                        continue
                    name = stripped[start:end].strip()
                    # 2) everything after the closing ** is treated as description; trim leading dashes.
                    remainder = stripped[end + 2 :].lstrip()
                    # remove leading dash/en‑dash/em‑dash plus spaces if present
                    remainder = re.sub(r"^[\-–—]\s*", "", remainder)
                    description = remainder.strip()
                    # Strip any inline Markdown bold markers like **Name** inside the description
                    description = re.sub(r"\*\*(.+?)\*\*", r"\1", description)
                    entries.append(
                        {
                            "name": name,
                            "description": description,
                            "category": current_category or "",
                        }
                    )
    except Exception as e:
        print(f"Failed to parse people.md: {e}")
        return []

    return entries

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.post("/chat", response_model=ChatHistoryResponse)
def chat_endpoint(payload: ChatQuery, _: bool = Depends(verify_api_key), db: Session = Depends(get_db)):
    result = chatbot_instance.get_response_with_sources(payload.question)
    if config.DATABASE_URL:
        db_record = DBTimelineEvent  # dummy ref to appease linters
        db_record = ChatHistory(
            question=payload.question,
            answer=result["answer"],
            sources=result["sources"],
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return ChatHistoryResponse(
            id=db_record.id,
            question=db_record.question,
            answer=db_record.answer,
            sources=db_record.sources or [],
            created_at=db_record.created_at.isoformat(),
        )
    return ChatHistoryResponse(
        id=0,
        question=payload.question,
        answer=result["answer"],
        sources=result["sources"],
        created_at="N/A",
    )

@app.get("/chat_history", response_model=List[ChatHistoryResponse])
def get_chat_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    if not config.DATABASE_URL:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Database is not configured for this service.")
    history_records = db.query(ChatHistory).order_by(ChatHistory.created_at.desc()).offset(skip).limit(limit).all()
    return [
        ChatHistoryResponse(
            id=rec.id,
            question=rec.question,
            answer=rec.answer,
            sources=rec.sources or [],
            created_at=rec.created_at.isoformat(),
        )
        for rec in history_records
    ]

# ---- Timeline endpoints ----
class TimelineEventIn(BaseModel):
    title: str
    description: str
    date: date
    category: str
    location: Optional[str] = None
    significance: Optional[str] = None

class TimelineEventOut(TimelineEventIn):
    id: int
    created_at: str

@app.get("/timeline", response_model=List[TimelineEventOut])
def list_timeline(db: Session = Depends(get_db)):
    if not config.DATABASE_URL:
        return []
    rows = db.query(DBTimelineEvent).order_by(DBTimelineEvent.date.asc()).all()
    return [
        TimelineEventOut(
            id=r.id,
            title=r.title,
            description=r.description,
            date=r.date,
            category=r.category,
            location=r.location,
            significance=r.significance,
            created_at=r.created_at.isoformat(),
        )
        for r in rows
    ]

@app.post("/timeline", response_model=TimelineEventOut)
def create_timeline(ev: TimelineEventIn, _: bool = Depends(verify_api_key), db: Session = Depends(get_db)):
    if not config.DATABASE_URL:
        raise HTTPException(status_code=501, detail="Database not configured")
    row = DBTimelineEvent(**ev.dict())
    db.add(row)
    db.commit()
    db.refresh(row)
    return TimelineEventOut(
        id=row.id,
        title=row.title,
        description=row.description,
        date=row.date,
        category=row.category,
        location=row.location,
        significance=row.significance,
        created_at=row.created_at.isoformat(),
    )

@app.delete("/timeline/{event_id}")
def delete_timeline_event(event_id: int, _: bool = Depends(verify_api_key), db: Session = Depends(get_db)):
    if not config.DATABASE_URL:
        raise HTTPException(status_code=501, detail="Database not configured")
    row = db.query(DBTimelineEvent).get(event_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(row)
    db.commit()
    return {"status": "ok", "deleted_id": event_id}

@app.delete("/admin/timeline/clear")
def admin_clear_timeline(_: bool = Depends(verify_api_key), db: Session = Depends(get_db)):
    if not config.DATABASE_URL:
        raise HTTPException(status_code=501, detail="Database not configured")
    n = db.query(DBTimelineEvent).delete()
    db.commit()
    return {"status": "ok", "deleted": n}

# ---- Gallery endpoints ----
class GalleryImageIn(BaseModel):
    image_url: str
    title: str
    description: Optional[str] = None
    date_taken: Optional[date] = None
    tags: Optional[List[str]] = None

class GalleryImageOut(GalleryImageIn):
    id: int
    created_at: str

@app.get("/gallery", response_model=List[GalleryImageOut])
def list_gallery(db: Session = Depends(get_db)):
    if not config.DATABASE_URL:
        return []
    rows = db.query(DBGalleryImage).order_by(DBGalleryImage.created_at.desc()).all()
    return [
        GalleryImageOut(
            id=r.id,
            image_url=r.image_url,
            title=r.title,
            description=r.description,
            date_taken=r.date_taken,
            tags=r.tags or [],
            created_at=r.created_at.isoformat(),
        )
        for r in rows
    ]

@app.post("/gallery", response_model=GalleryImageOut)
def create_gallery(img: GalleryImageIn, _: bool = Depends(verify_api_key), db: Session = Depends(get_db)):
    if not config.DATABASE_URL:
        raise HTTPException(status_code=501, detail="Database not configured")
    row = DBGalleryImage(**img.dict())
    db.add(row)
    db.commit()
    db.refresh(row)
    return GalleryImageOut(
        id=row.id,
        image_url=row.image_url,
        title=row.title,
        description=row.description,
        date_taken=row.date_taken,
        tags=row.tags or [],
        created_at=row.created_at.isoformat(),
    )

@app.delete("/admin/gallery/clear")
def admin_clear_gallery(_: bool = Depends(verify_api_key), db: Session = Depends(get_db)):
    if not config.DATABASE_URL:
        raise HTTPException(status_code=501, detail="Database not configured")
    n = db.query(DBGalleryImage).delete()
    db.commit()
    return {"status": "ok", "deleted": n}

@app.post("/admin/init_db")
def admin_init_db(_: bool = Depends(verify_api_key)):
    if not config.DATABASE_URL:
        raise HTTPException(status_code=501, detail="Database not configured")
    init_db()
    return {"status": "ok", "message": "Database initialized."}


def launch_api():
    import uvicorn
    import os

    port = int(os.getenv("PORT", "7860"))
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    launch_api()


