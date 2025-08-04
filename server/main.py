"""FastAPI application for DB Inspector."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from service import set_db_uri, query_db, run_pipeline, ensure_thread_id
from models import (
    DatabaseRequest,
    QueryRequest,
    ChatRequest,
    DatabaseResponse,
    QueryResponse,
    ChatResponse,
)

# FastAPI application
app = FastAPI(title="DB Inspector API", version="1.0.0")

# CORS middleware to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Consider restricting this in production
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.get("/")
async def root():
    return {"message": "DB Inspector API is running!"}


@app.post("/connect", response_model=DatabaseResponse)
async def connect(request: DatabaseRequest):
    try:
        (schema, dialect) = set_db_uri(request.uri)

        return DatabaseResponse(
            message="Database connection established successfully.",
            dialect=dialect,
            schema=schema,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    thread_id = ensure_thread_id(request.thread_id)

    try:
        result = query_db(request.query, thread_id)
        print(f"Thread ID: {thread_id}, Query Response Successful.")
        return QueryResponse(result=result, thread_id=thread_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    thread_id = ensure_thread_id(request.thread_id)

    try:
        result = run_pipeline(request.message, thread_id, request.confirm_execution)
        print(f"Thread ID: {thread_id}, Chat Response Successful.")
        return ChatResponse(
            response=result["response"],
            thread_id=thread_id,
            requires_confirmation=result["requires_confirmation"],
            pending_query=result["pending_query"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def main():
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
