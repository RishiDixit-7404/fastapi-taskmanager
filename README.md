# FastAPI Task Manager

Task management API built with FastAPI, SQLAlchemy, JWT auth, refresh token rotation, API keys, role-based access control, request logging, rate limiting, and a standalone static UI.

## What This Project Includes

- FastAPI backend in `main.py`
- SQLAlchemy models for users, projects, tasks, comments, tags, refresh tokens, and API keys
- JWT login with access and refresh tokens
- API key authentication for supported routes
- Admin-only user management and stats endpoints
- Alembic migration setup
- Pytest coverage for auth, projects, and tasks
- Static frontend in `ui/` built with HTML, Bootstrap CDN, and vanilla JavaScript

## Tech Stack

- Python
- FastAPI
- SQLAlchemy
- Alembic
- Pydantic
- SQLite by default
- PostgreSQL-ready through `DATABASE_URL`
- Passlib for password hashing
- Python-JOSE for JWT handling
- Pytest + HTTPX for tests

## Project Structure

```text
fastapi_taskmanager/
├── auth/          # JWT, password, API key, and auth dependencies
├── middleware/    # request logging and rate limiting
├── models/        # SQLAlchemy models
├── routers/       # API route modules
├── schemas/       # Pydantic request/response schemas
├── tests/         # automated tests
├── ui/            # standalone static frontend
├── utils/         # exception and response helpers
├── alembic/       # migrations
├── config.py      # environment-driven settings
├── database.py    # engine, session, Base, get_db
├── main.py        # FastAPI app entry point
└── taskmanager.db # local SQLite database
```

## Backend Features

### Authentication

- `POST /auth/register` creates a user
- `POST /auth/login` returns an `access_token` and `refresh_token`
- `POST /auth/refresh` rotates refresh tokens and returns fresh tokens
- `POST /auth/logout` revokes a refresh token
- `GET /auth/me` returns the current user

### API Keys

- `POST /auth/api-keys` creates a new API key
- `GET /auth/api-keys` lists the current user’s keys
- `DELETE /auth/api-keys/{key_id}` revokes a key

### Projects and Tasks

- project CRUD
- project-scoped task creation and listing
- task CRUD
- partial task status updates
- tag attach/detach on tasks
- task comments

### Admin and Platform

- admin-only user management
- admin-only stats
- health endpoint
- request logging middleware
- rate limiting middleware
- centralized exception handling

## Authentication Model

This backend supports **two auth methods**:

### 1. JWT bearer tokens

Used for normal user login and frontend sessions.

- Login returns:
  - `access_token`
  - `refresh_token`
- Protected routes accept:

```http
Authorization: Bearer <access_token>
```

### 2. API keys

Used for scripts or direct API access on routes that support flexible auth.

- API keys are created only after JWT login
- Requests send:

```http
X-API-Key: <raw_api_key>
```

### Security notes

- Passwords are hashed with Passlib
- Refresh tokens are stored hashed in the database
- API keys are stored hashed in the database
- Refresh token rotation is implemented
- Admin checks are enforced through dependencies

## Database

The default local database is SQLite:

```env
DATABASE_URL=sqlite:///./taskmanager.db
```

SQLAlchemy is the ORM layer used to talk to the database.

PostgreSQL can be used instead by changing `DATABASE_URL`.

## Environment Variables

Create a `.env` file based on `.env.example`.

Main settings:

- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `DATABASE_URL`
- `CORS_ORIGINS`

## Setup

### 1. Create and activate a virtual environment

Windows Command Prompt:

```cmd
python -m venv .venv
.venv\Scripts\activate
```

### 2. Install dependencies

```cmd
pip install -r requirements.txt
```

### 3. Configure environment variables

Create `.env` and set at least:

```env
SECRET_KEY=change-this-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=sqlite:///./taskmanager.db
CORS_ORIGINS=["*"]
```

### 4. Apply migrations

```cmd
alembic upgrade head
```

Note: `main.py` also calls `Base.metadata.create_all(bind=engine)` on startup, so local SQLite setup is forgiving even if migrations have not been run yet.

### 5. Start the backend

```cmd
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8010
```

Swagger and ReDoc:

- `http://127.0.0.1:8010/docs`
- `http://127.0.0.1:8010/redoc`

## Running the Static UI

The frontend in `ui/` is separate from the backend and does not require Node.js or npm.

### 1. Start the backend

Example:

```cmd
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8010
```

### 2. Serve the frontend

```cmd
cd /d C:\Users\Rishi.Dixit\Projects\fastapi_taskmanager\fastapi_taskmanager\ui
python -m http.server 8080
```

### 3. Open the frontend

Open:

`http://127.0.0.1:8080`

On the login screen, set the backend URL to match your API, for example:

`http://127.0.0.1:8010`

## UI Pages

- `ui/index.html` - login
- `ui/register.html` - register
- `ui/dashboard.html` - dashboard, health, API keys
- `ui/projects.html` - list and create projects
- `ui/project.html?id=...` - project detail and task creation
- `ui/task.html?id=...` - task detail, comments, tags
- `ui/admin.html` - admin-only panel

## Main API Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/api-keys`
- `GET /auth/api-keys`
- `DELETE /auth/api-keys/{key_id}`

### Users

- `GET /users`
- `GET /users/{user_id}`
- `PUT /users/{user_id}`
- `PATCH /users/{user_id}/role`
- `DELETE /users/{user_id}`

### Projects

- `GET /projects`
- `POST /projects`
- `GET /projects/{project_id}`
- `PUT /projects/{project_id}`
- `PATCH /projects/{project_id}`
- `DELETE /projects/{project_id}`

### Tasks

- `GET /projects/{project_id}/tasks`
- `POST /projects/{project_id}/tasks`
- `GET /tasks/{task_id}`
- `PUT /tasks/{task_id}`
- `PATCH /tasks/{task_id}`
- `PATCH /tasks/{task_id}/status`
- `DELETE /tasks/{task_id}`
- `POST /tasks/{task_id}/tags/{tag_id}`
- `DELETE /tasks/{task_id}/tags/{tag_id}`

### Comments

- `GET /tasks/{task_id}/comments`
- `POST /tasks/{task_id}/comments`
- `PUT /comments/{comment_id}`
- `DELETE /comments/{comment_id}`

### Tags and Health

- `GET /tags`
- `POST /tags`
- `DELETE /tags/{tag_id}`
- `GET /health`
- `GET /stats`

## Authorization Rules

- normal users can manage only their own projects and project-scoped tasks
- comment updates are author-only
- comment deletion is allowed for the author or an admin
- tag deletion is admin-only
- `/users` and `/stats` are admin-only
- many business routes accept either JWT or API key through shared auth dependencies

## Tests

Run the test suite with:

```cmd
python -m pytest -q
```

The tests use an in-memory SQLite database and cover:

- auth and token flows
- API key behavior
- project ownership rules
- task updates and status changes
- comments and tags
- admin/user access control
- health and rate limiting behavior

## Useful Local Commands

Run backend:

```cmd
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8010
```

Run tests:

```cmd
python -m pytest -q
```

Inspect the local SQLite database:

```cmd
python read_db.py
```

## Notes

- This project currently runs happily on SQLite for local development
- The static UI was added without modifying backend routes
- If port `8000` is blocked on your machine, use another port like `8010`
- If the UI cannot log in, first confirm the frontend backend URL matches the running API port
