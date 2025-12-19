from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import json

from src import config

# Check if a database URL is configured
if not config.DATABASE_URL:
    # This will prevent the application from starting without a database configuration,
    # making the dependency explicit.
    raise ValueError("DATABASE_URL is not set in the environment. Please configure it.")

engine = create_engine(
    config.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ChatHistory(Base):
    """
    SQLAlchemy model for storing chat history.
    """
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sources = Column(JSONB, nullable=True)  # Use JSONB for efficient storage of source objects
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ChatHistory(id={self.id}, question='{self.question[:50]}...')>"

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    date = Column(Date, nullable=False)
    category = Column(String(64), nullable=False)
    location = Column(String(255), nullable=True)
    significance = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class GalleryImage(Base):
    __tablename__ = "gallery_images"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(Text, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    date_taken = Column(Date, nullable=True)
    tags = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class GuestMemory(Base):
    """
    Stores guest-submitted memories and reflections about Paul.
    Backed by the guest_memories table in the Neon PostgreSQL database.
    """

    __tablename__ = "guest_memories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    relationship = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    memory = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    """
    Dependency for FastAPI routes to get a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initializes the database and creates tables if they don't exist.
    This should be called once at application startup.
    """
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    print("Database initialized.")
