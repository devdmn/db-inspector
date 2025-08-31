"""Database connection and management module."""

from langchain_community.utilities import SQLDatabase
from typing import Dict

# Global database instances dictionary
_dbs: Dict[str, SQLDatabase] = {}


def set_database(uri: str, thread_id: str) -> SQLDatabase:
    """Set the database URI and create a connection for a specific thread."""
    global _dbs
    if not uri:
        raise ValueError("URI is required.")
    if not thread_id:
        raise ValueError("thread_id is required.")

    db = SQLDatabase.from_uri(uri)
    _dbs[thread_id] = db
    print(f"Database connection set for thread_id {thread_id}.")
    return db


def get_database(thread_id: str) -> SQLDatabase:
    """Get the current database connection for a specific thread."""
    if thread_id not in _dbs:
        print(f"No DB connection found for thread_id {thread_id}.")
        raise ValueError(
            f"Database is not set for thread_id {thread_id}. Please set the database URI first."
        )
    print(f"Retrieved DB connection for thread_id {thread_id}.")
    return _dbs[thread_id]


def is_database_set(thread_id: str) -> bool:
    """Check if database is set for a specific thread."""
    return thread_id in _dbs
