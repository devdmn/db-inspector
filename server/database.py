"""Database connection and management module."""

from langchain_community.utilities import SQLDatabase
from typing import Optional

# Global database instance
_db: Optional[SQLDatabase] = None


def set_database(uri: str) -> SQLDatabase:
    """Set the database URI and create a connection."""
    global _db
    if not uri:
        raise ValueError("URI is required.")

    _db = SQLDatabase.from_uri(uri)
    return _db


def get_database() -> SQLDatabase:
    """Get the current database connection."""
    if _db is None:
        raise ValueError("Database is not set. Please set the database URI first.")
    return _db


def is_database_set() -> bool:
    """Check if database is set."""
    return _db is not None
