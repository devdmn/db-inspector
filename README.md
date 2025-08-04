# DB Inspector

**DB Inspector** is a lightweight web-based SQL client that connects to any database using a connection URL. It allows users to run raw SQL queries and view the results in a structured table format.

In addition to direct querying, the app features a basic AI assistant that can understand natural language questions, generate the corresponding SQL, and ask for your confirmation before executing the query. The assistant then shows the results and provides a plain English answer based on the output.

## Features

- Connect to a database using a connection string
- Write and execute custom SQL queries
- View results in a tabular format
- Chat with an AI agent to generate SQL from natural language
- Review and approve AI-generated queries before they are run

## Tech Stack

- **Frontend**: React, TanStack Router
- **Backend**: Python, FastAPI
- **AI Integration**: Langchain, Langgraph, Ollama (for local), Groq (in deployment)

## Status

This project is a work in progress. Some features may still be under development or refinement. Feedback and suggestions are welcome.
