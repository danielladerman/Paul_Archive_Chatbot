from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.chatbot import PaulChatbot


app = FastAPI(title="Paul Project API")

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


@app.post("/chat")
def chat_endpoint(payload: ChatQuery):
    result = chatbot_instance.get_response_with_sources(payload.question)
    return result


def launch_api():
    import uvicorn
    import os

    port = int(os.getenv("PORT", "7860"))
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    launch_api()


