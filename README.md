# YouTube Transcript AI Chat

A full-stack project that lets users load a YouTube video, build a transcript-aware retrieval index, and chat with an AI assistant about the video content.

## Overview

This repository contains:

- A FastAPI backend that:
  - Fetches YouTube transcripts
  - Splits transcript text into chunks
  - Builds a FAISS vector store with Hugging Face embeddings
  - Uses a LangChain chat pipeline with conversation history
- A frontend folder with:
  - A production-style static chat UI (`index.html` + `app.js` + `style.css`) that is already wired to backend endpoints
  - A React + Vite starter app in `src/` (currently scaffold/demo, not integrated with backend API)

## Current Status

- Backend API: implemented and working
- Static frontend chat UI: implemented and connected to backend
- React frontend (`Frontend/src`): starter template (not yet connected to API)

## Key Features

- Load any YouTube video by URL
- Extract transcript using `youtube-transcript-api`
- Build semantic search index using FAISS
- Ask follow-up questions with conversation context
- Simple chat UI with loading states and status feedback

## Tech Stack

### Backend

- Python
- FastAPI
- LangChain
- FAISS
- Hugging Face sentence-transformer embeddings
- youtube-transcript-api

### Frontend

- HTML/CSS/JavaScript (primary integrated UI)
- React + Vite (starter scaffolding)

## Project Structure

```text
youtubeTranscirbe/
|- Backend/
|  |- api.py
|  |- model.py
|  |- notebook/
|     |- notebook.ipynb
|- Frontend/
|  |- index.html
|  |- app.js
|  |- style.css
|  |- src/                # React starter app (not yet API-integrated)
|  |- package.json
|- README.md
```

## How It Works

1. User sends a YouTube URL to `/load_video`.
2. Backend extracts the video ID and fetches transcript text.
3. Transcript is chunked and embedded.
4. Embeddings are stored in a FAISS vector store.
5. User sends questions to `/chat`.
6. Retriever gets relevant chunks and the LLM generates an answer using:
   - Transcript context
   - Conversation history

## API Reference

### `POST /load_video`

Load a YouTube video transcript and initialize chat chain.

Request body:

```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

Success response:

```json
{
  "message": "Video processed successfully"
}
```

Common errors:

- `400`: `Video URL is required`
- `400`: `Transcript not available`

### `POST /chat`

Ask a question about the loaded video.

Request body:

```json
{
  "question": "Summarize the key points from this video"
}
```

Success response:

```json
{
  "answer": "..."
}
```

Common errors:

- `400`: `Please load a video first`
- `400`: `Question is required`

## Local Development

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd youtubeTranscirbe
```

### 2. Backend Setup

```bash
cd Backend
python -m venv .venv
```

Activate virtual environment:

- Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

- macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install fastapi uvicorn pydantic youtube-transcript-api langchain langchain-core langchain-community langchain-text-splitters langchain-huggingface sentence-transformers faiss-cpu
```

Run backend:

```bash
uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

### 3. Frontend Setup (Integrated Static UI)

From the `Frontend` directory, serve files with any static server.

Example (Python):

```bash
cd Frontend
python -m http.server 5500
```

Open:

```text
http://127.0.0.1:5500
```

### 4. React Frontend (Optional Starter)

If you want to run the React scaffold:

```bash
cd Frontend
npm install
npm run dev
```

Note: the React app in `Frontend/src` is not yet wired to `/load_video` and `/chat`.

## Configuration

- Backend model configuration is defined in `Backend/model.py`.
- Frontend API base URL is defined in `Frontend/app.js`:

```js
const API_BASE_URL = "http://127.0.0.1:8000";
```

If your backend runs on a different host/port, update this value.

## Known Limitations

- Chat state is stored in memory (`chat_history`, `chat_chain`) and resets on server restart.
- CORS is currently open to all origins (`allow_origins=["*"]`), which is not production-hardened.
- No authentication or rate limiting.
- No persistent vector database yet.

## Troubleshooting

- `Transcript not available`:
  - The video may not have captions/transcripts.
  - Try another video with subtitles enabled.
- `Please load a video first` on chat:
  - Call `/load_video` successfully before `/chat`.
- Frontend cannot reach backend:
  - Confirm backend is running on `127.0.0.1:8000`.
  - Confirm `API_BASE_URL` in `Frontend/app.js` matches backend URL.
- Embedding/model import issues:
  - Recheck package installation in the same virtual environment used to run FastAPI.

## Roadmap

- Connect React UI to backend API
- Add persistent conversation and vector storage
- Add authentication and per-user sessions
- Add Docker support for one-command startup
- Add tests (unit + integration)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## License

No license file is included yet. Add a `LICENSE` file to define usage terms.
