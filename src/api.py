from fastapi import FastAPI, Header, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from sqlalchemy import delete

from src.chatbot import PaulChatbot
from src import config
from src.database import get_db, init_db, ChatHistory, TimelineEvent as DBTimelineEvent, GalleryImage as DBGalleryImage

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


