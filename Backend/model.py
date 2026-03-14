# model.py

import warnings
warnings.filterwarnings("ignore")

from operator import itemgetter

from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from langchain.chat_models import init_chat_model
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser


model = init_chat_model(
    "ollama:gemini-3-flash-preview:cloud",
    temperature=0.2
)


def get_transcript(video_id):

    try:
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.fetch(video_id)

        transcript = " ".join(chunk.text for chunk in transcript_list)

        return transcript

    except TranscriptsDisabled:
        return None


def create_vector_store(transcript):

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=200
    )

    chunks = splitter.create_documents([transcript])

    embedding = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vector_store = FAISS.from_documents(chunks, embedding)

    return vector_store


def build_chain(vector_store):

    retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 6, "fetch_k": 20}
    )

    prompt = PromptTemplate(
        template="""
You are a helpful assistant answering questions about a YouTube video.

Use the transcript context AND conversation history.

Conversation History:
{history}

Transcript Context:
{context}

Question:
{question}
""",
        input_variables=["history", "context", "question"]
    )

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    parallel_chain = RunnableParallel({
        "context": itemgetter("question") | retriever | RunnableLambda(format_docs),
        "question": itemgetter("question"),
        "history": itemgetter("history")
    })

    parser = StrOutputParser()

    chain = parallel_chain | prompt | model | parser

    return chain