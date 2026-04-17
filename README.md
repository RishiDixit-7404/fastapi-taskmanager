# FastAPI Task Manager API

A production-style backend project built with FastAPI for learning REST API design, JWT authentication, SQLAlchemy ORM, Alembic migrations, and testing.

## Day 1 Status

Day 1 focuses on environment setup and project scaffolding.

Completed so far:
- Python virtual environment setup
- dependency installation
- project folder structure
- `config.py` for environment-based settings
- `.env` and `.env.example`
- `database.py` with SQLAlchemy engine, session, and `Base`
- `main.py` with FastAPI app, CORS middleware, and `/health`
- Alembic initialization and basic configuration
- Swagger UI smoke test

## Tech Stack

- Python 3.11+
- FastAPI
- Uvicorn
- SQLAlchemy 2.0
- Alembic
- Pydantic v2
- JWT via `python-jose`
- Password hashing via `passlib` + `bcrypt`
- Pytest + HTTPX

## Project Structure

```text
fastapi_taskmanager/
  main.py
  config.py
  database.py
  models/
  schemas/
  routers/
  auth/
  middleware/
  utils/
  tests/
  alembic/
  .env
  .env.example
  requirements.txt
  README.md