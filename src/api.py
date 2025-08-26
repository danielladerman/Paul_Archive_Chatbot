from fastapi import FastAPI, Header, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

from src.chatbot import PaulChatbot
from src import config

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
def chat_endpoint(payload: ChatQuery, _: bool = Depends(verify_api_key)):
    result = chatbot_instance.get_response_with_sources(payload.question)
    return result


def launch_api():
    import uvicorn
    import os

    port = int(os.getenv("PORT", "7860"))
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    launch_api()


