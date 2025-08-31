"""Service layer for database operations and AI pipeline."""

from langgraph.checkpoint.memory import MemorySaver
from langchain_core.runnables.config import RunnableConfig
from database import set_database, get_database
import json
import uuid

# Memory
memory = MemorySaver()


def generate_thread_id() -> str:
    """Generate a new unique thread ID."""
    return str(uuid.uuid4())


def ensure_thread_id(thread_id: str = None) -> str:
    """Ensure we have a valid thread ID, generate one if needed."""
    if thread_id is None or thread_id.strip() == "":
        return generate_thread_id()
    return thread_id


def get_config(thread_id: str) -> RunnableConfig:
    """Get configuration for a specific thread."""
    return RunnableConfig(
        configurable={"thread_id": thread_id},
    )


def set_db_uri(uri: str, thread_id: str) -> tuple[dict[str, list[str]], str]:
    """Set the database URI for a specific thread."""
    db = set_database(uri, thread_id)

    dialect = db.dialect
    tables = db._inspector.get_table_names()

    schema = {}

    for table_name in tables:
        columns = db._inspector.get_columns(table_name)
        schema[table_name] = [col["name"] for col in columns]

    return (schema, dialect)


def query_db(query: str, thread_id: str = None):
    """Execute a query against the database for a specific thread."""
    db = get_database(thread_id)
    result = db._execute(query)

    # Import here to avoid circular imports
    from sql_pipeline import get_agent

    agent = get_agent()
    config = get_config(thread_id)

    # Update agent state with query result
    agent.update_state(
        config=config,
        values={
            "messages": [
                {
                    "role": "user",
                    "content": f"Query: {query}\nResult:\n{json.dumps(result, indent=2)}",
                }
            ],
            "thread_id": thread_id,
        },
    )
    return result


def run_pipeline(message: str, thread_id: str = None, confirm_execution: bool = None):
    """Run the SQL pipeline with the provided message."""
    from sql_pipeline import get_agent, remove_think, get_pending_query

    agent = get_agent()
    config = get_config(thread_id)

    try:
        if confirm_execution is True:
            # User confirmed, continue execution
            answer = agent.invoke(None, config=config)
            return {
                "response": remove_think(answer["messages"][-1].content),
                "requires_confirmation": False,
                "pending_query": None,
                "thread_id": thread_id,
            }
        elif confirm_execution is False:
            # User rejected, stop execution
            agent.update_state(
                config=config,
                values={
                    "messages": [
                        {
                            "role": "user",
                            "content": "Execution cancelled by user.",
                        }
                    ]
                },
            )
            return {
                "response": "Query execution cancelled by user.",
                "requires_confirmation": False,
                "pending_query": None,
                "thread_id": thread_id,
            }
        else:
            # Normal execution or continuation
            if message:
                answer = agent.invoke(
                    {
                        "messages": [{"role": "user", "content": message}],
                        "thread_id": thread_id,
                    },
                    config=config,
                )
            else:
                # Continue from interrupt - ensure thread_id is in state
                current_state = agent.get_state(config)
                if "thread_id" not in current_state.values:
                    agent.update_state(config=config, values={"thread_id": thread_id})
                answer = agent.invoke(None, config=config)

            # Check if we're interrupted and need confirmation
            state = agent.get_state(config)
            if state.next and "execute" in state.next:
                pending_query = get_pending_query(thread_id)
                return {
                    "response": f"I've generated the following SQL query. Do you want me to execute it?\n\n```sql\n{pending_query}\n```",
                    "requires_confirmation": True,
                    "pending_query": pending_query,
                    "thread_id": thread_id,
                }

            return {
                "response": remove_think(answer["messages"][-1].content),
                "requires_confirmation": False,
                "pending_query": None,
                "thread_id": thread_id,
            }
    except Exception as e:
        raise ValueError(f"Pipeline execution failed: {str(e)}")


def update_state(state_values: dict, thread_id: str = None):
    """Update the state of the pipeline with new messages."""
    from sql_pipeline import get_agent

    agent = get_agent()
    config = get_config(thread_id)

    try:
        agent.update_state(config=config, values=state_values)
    except Exception as e:
        raise ValueError(f"Failed to update state: {str(e)}")

    return {
        "state": agent.get_state(config=config),
        "message": "Updated state successfully.",
    }
