from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import re

from model import get_transcript, create_vector_store, build_chain
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (change to specific domains in production)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

chat_chain = None
chat_history = []


class VideoRequest(BaseModel):
    url: str


class ChatRequest(BaseModel):
    question: str


def extract_video_id(url: str):
    pattern = r"(?:v=|\/)([0-9A-Za-z_-]{11}).*"
    match = re.search(pattern, url)

    if match:
        return match.group(1)

    return url


@app.post("/load_video")
def load_video(data: VideoRequest):

    global chat_chain, chat_history

    chat_history = []

    if not data.url.strip():
        raise HTTPException(status_code=400, detail="Video URL is required")

    video_id = extract_video_id(data.url)

    transcript = get_transcript(video_id)

    if transcript is None:
        raise HTTPException(status_code=400, detail="Transcript not available")

    vector_store = create_vector_store(transcript)

    chat_chain = build_chain(vector_store)

    return {"message": "Video processed successfully"}


@app.post("/chat")
def chat(data: ChatRequest):

    global chat_chain, chat_history

    if chat_chain is None:
        raise HTTPException(status_code=400, detail="Please load a video first")

    question = data.question

    if not question.strip():
        raise HTTPException(status_code=400, detail="Question is required")

    history_text = "\n".join(chat_history)

    answer = chat_chain.invoke({
        "question": question,
        "history": history_text
    })

    chat_history.append(f"User: {question}")
    chat_history.append(f"Assistant: {answer}")

    return {"answer": answer}