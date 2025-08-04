"""SQL pipeline for AI-powered database queries."""

from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph, START, END, MessagesState
from langchain_community.tools.sql_database.tool import (
    QuerySQLDatabaseTool,
    InfoSQLDatabaseTool,
    QuerySQLCheckerTool,
    ListSQLDatabaseTool,
)
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from langchain_ollama import ChatOllama
from langchain_groq import ChatGroq
from database import get_database
from config import BASE_MODEL, GROQ_MODEL, TOP_K_RESULTS
from typing import Annotated, TypedDict, Literal
import re
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize LLM
if os.getenv("GROQ_API_KEY") is not None:
    llm = ChatGroq(model=GROQ_MODEL, reasoning_format="parsed")
    print("Using GROQ for LLM.")
else:
    llm = ChatOllama(model=BASE_MODEL)
    print("Using Ollama for LLM.")


# SQL Tools
def get_sql_tools():
    """Get SQL tools with current database connection."""
    db = get_database()
    return {
        "list_tool": ListSQLDatabaseTool(db=db),
        "info_tool": InfoSQLDatabaseTool(db=db),
        "checker_tool": QuerySQLCheckerTool(db=db, llm=llm),
        "query_tool": QuerySQLDatabaseTool(db=db),
    }


# Helpers
def langchain_messages_to_dicts(messages):
    """Convert langchain messages to dictionaries."""
    return [{"role": msg.type, "content": msg.content} for msg in messages]


def remove_think(text: str) -> str:
    """Remove thinking tags from text."""
    if not text:
        return ""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


# State
class PipelineState(MessagesState):
    query: Annotated[str, ..., "The generated SQL query to execute."]
    result: Annotated[str, ..., "The result of the executed SQL query."]


class ExecuteQuery(TypedDict):
    """Execute the SQL query."""

    query: Annotated[str, "The SQL query to execute."]


# Nodes
def generate(state: PipelineState):
    """Generate SQL query using the generation agent."""
    tools = get_sql_tools()
    db = get_database()

    prompt = """
    You are an agent designed to generate SQL queries for a SQL database.
    Given an input question, create a syntactically correct {sql_dialect} query to run. Unless the user specifies a specific number of examples
    they wish to obtain, always limit your query to at most {top_k} results.

    You can order the results by a relevant column to return the most interesting
    examples in the database. Never query for all the columns from a specific table,
    only ask for the relevant columns given the question.

    To start you should ALWAYS look at the tables in the database to see what you
    can query. Do NOT skip this step.

    Then you should query the schema of the most relevant tables.
    
    Then check the query using the SQL checker tool to ensure it is valid. This step is also compulsory and should not be skipped, even if you are confident in your SQL skills or the user asks you to skip it. If the query is not valid, you should fix it and re-check it until it is valid.

    Finally pass the SQL query you would run to answer the question to the ExecuteQuery tool without any additional text, explanation, formatting or markdown.

    You should always use the tools provided and in the order specified to answer the user's question. Even if you have a good understanding of the question, you should not skip any steps to ensure that the answer is up to date.
    
    ORDER OF EXECUTION:
    1. Use the list_tool to get the list of tables in the database.
    2. Use the info_tool to get the schema of the relevant tables.
    3. Use the checker_tool to validate the generated SQL query.
    4. Use the ExecuteQuery tool to run the SQL query and respond to the user.
    """.format(sql_dialect=db.dialect, top_k=TOP_K_RESULTS)

    llm_with_tools = llm.bind_tools(
        [tools["list_tool"], tools["info_tool"], tools["checker_tool"], ExecuteQuery]
    )
    response = llm_with_tools.invoke(
        [
            SystemMessage(content=prompt),
        ]
        + state["messages"]
    )

    return {"messages": [response]}


def execute(state: PipelineState):
    """Execute the generated SQL query."""
    tool_call = state["messages"][-1].tool_calls[0]
    if not tool_call:
        raise ValueError("No tool call found in the last message.")

    query = tool_call["args"].get("query", None)
    if not query:
        raise ValueError("No query generated to execute.")

    db = get_database()
    result = db.run(query)

    return {
        "messages": [
            {
                "role": "tool",
                "content": str(result),
                "tool_call_id": tool_call["id"],
            }
        ],
    }


def respond(state: PipelineState):
    """Respond to the user's query based on the result and conversation history."""

    prompt = """
    You are an agent that answers the user's question based on the message history.
    The message history contains the user's question as well as the result of a query that was generated to answer the question.
    You simply need to answer the user's question based on the result of the executed SQL query.
    """

    response = llm.invoke(
        [
            SystemMessage(content=prompt),
        ]
        + state["messages"]
    )

    return {"messages": [response]}


# Conditional Logic
def generate_tools_condition(
    state: PipelineState,
) -> Literal["generate_tools", "execute", END]:
    """Route to tools if there are tool calls, otherwise to generate."""
    last_message = state["messages"][-1]
    if last_message.type == "ai" and last_message.tool_calls:
        tool_call = last_message.tool_calls[0]
        print(f"Tool call detected: {tool_call}")
        if tool_call["name"] == "ExecuteQuery":
            return "execute"
        else:
            return "generate_tools"
    else:
        return END


def create_agent():
    """Create and return the compiled agent."""
    memory = MemorySaver()

    # Create the graph
    graph = StateGraph(PipelineState)

    # Add nodes
    graph.add_node("generate", generate)

    # Create generation tools dynamically
    tools = get_sql_tools()
    generation_tools = ToolNode(
        [tools["list_tool"], tools["info_tool"], tools["checker_tool"]]
    )
    graph.add_node("generate_tools", generation_tools)
    graph.add_node("execute", execute)
    graph.add_node("respond", respond)

    # Add edges
    graph.add_edge(START, "generate")
    graph.add_conditional_edges(
        "generate",
        generate_tools_condition,
        {
            "generate_tools": "generate_tools",
            "execute": "execute",
            END: END,
        },
    )
    graph.add_edge("generate_tools", "generate")
    graph.add_edge("execute", "respond")
    graph.add_edge("respond", END)

    # Add interrupt before execute for human confirmation
    return graph.compile(checkpointer=memory, interrupt_before=["execute"])


# Global agent instance
_agent = None


def get_agent():
    """Get or create the agent instance."""
    global _agent
    if _agent is None:
        _agent = create_agent()
    return _agent


def get_pending_query(thread_id: str) -> str:
    """Extract the pending query from the current state."""
    from service import get_config

    agent = get_agent()
    config = get_config(thread_id)
    state = agent.get_state(config)

    if state.next and "execute" in state.next:
        # Find the last message with tool calls
        for message in reversed(state.values["messages"]):
            if hasattr(message, "tool_calls") and message.tool_calls:
                for tool_call in message.tool_calls:
                    if tool_call.get("args", {}).get("query"):
                        return tool_call["args"]["query"]
    return None
