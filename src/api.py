from fastapi import FastAPI, Header, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from sqlalchemy.orm import Session
from typing import List

from src.chatbot import PaulChatbot
from src import config
from src.database import get_db, init_db, ChatHistory

# --- Security ---
API_SECRET_KEY = os.getenv("API_SECRET_KEY")

async def verify_api_key(x_api_key: str = Header(...)):
    if not API_SECRET_KEY:
        # If the key is not set on the server, deny all requests for security.
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
    """
    Event handler for application startup.
    Initializes the database if the DATABASE_URL is set.
    """
    if config.DATABASE_URL:
        init_db()

# Allow calls from browser frontends (adjust origins in prod)
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
    
    # Save to database if configured
    if config.DATABASE_URL:
        db_record = ChatHistory(
            question=payload.question,
            answer=result["answer"],
            sources=result["sources"]
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        
        # Prepare the response object from the database record
        response = ChatHistoryResponse(
            id=db_record.id,
            question=db_record.question,
            answer=db_record.answer,
            sources=db_record.sources or [],
            created_at=db_record.created_at.isoformat()
        )
        return response

    # Fallback for when no database is configured
    return ChatHistoryResponse(
        id=0, # Placeholder ID
        question=payload.question,
        answer=result["answer"],
        sources=result["sources"],
        created_at="N/A"
    )

@app.get("/chat_history", response_model=List[ChatHistoryResponse])
def get_chat_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieves the most recent chat history from the database.
    """
    if not config.DATABASE_URL:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Database is not configured for this service.",
        )
    
    history_records = db.query(ChatHistory).order_by(ChatHistory.created_at.desc()).offset(skip).limit(limit).all()
    
    # Manually format the response to match the Pydantic model
    response = [
        ChatHistoryResponse(
            id=rec.id,
            question=rec.question,
            answer=rec.answer,
            sources=rec.sources or [],
            created_at=rec.created_at.isoformat()
        )
        for rec in history_records
    ]
    return response


def launch_api():
    import uvicorn
    import os

    port = int(os.getenv("PORT", "7860"))
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    launch_api()


