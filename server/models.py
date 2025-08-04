"""Pydantic models for API requests and responses."""

from pydantic import BaseModel
from typing import Optional, Any


class DatabaseRequest(BaseModel):
    uri: str


class QueryRequest(BaseModel):
    query: str
    thread_id: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None
    # New field for confirmation
    confirm_execution: Optional[bool] = None


class DatabaseResponse(BaseModel):
    message: str
    dialect: str
    schema: dict[str, list[str]]


class QueryResponse(BaseModel):
    result: list[dict[str, Any]]
    thread_id: str


class ChatResponse(BaseModel):
    response: str
    thread_id: str
    # New fields for query confirmation
    requires_confirmation: bool = False
    pending_query: Optional[str] = None
