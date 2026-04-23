# FastAPI Task Manager API

Task management REST API built with FastAPI, SQLAlchemy, Alembic, JWT access and refresh tokens, API key authentication, RBAC, logging middleware, rate limiting, and pytest coverage.

## Setup

1. Create and activate a virtual environment.
2. Install dependencies with `pip install -r requirements.txt`.
3. Copy `.env.example` to `.env` and update the values.
4. Run migrations with `alembic upgrade head`.
5. Start the server with `uvicorn main:app --reload`.

Swagger UI is available at `/docs` and ReDoc at `/redoc`.

## Environment Variables

- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `DATABASE_URL`
- `CORS_ORIGINS`

SQLite is used locally by default. Switching to PostgreSQL only requires changing `DATABASE_URL`.

## Authentication

- JWT bearer tokens for login, refresh, logout, and admin workflows
- API keys via `X-API-Key` for routes that accept either auth method
- Admin-only routes for user management, stats, and tag deletion

## Main Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/api-keys`
- `GET /auth/api-keys`
- `DELETE /auth/api-keys/{key_id}`
- `GET /users`
- `GET /users/{user_id}`
- `PUT /users/{user_id}`
- `PATCH /users/{user_id}/role`
- `DELETE /users/{user_id}`
- `GET /projects`
- `POST /projects`
- `GET /projects/{project_id}`
- `PUT /projects/{project_id}`
- `PATCH /projects/{project_id}`
- `DELETE /projects/{project_id}`
- `GET /projects/{project_id}/tasks`
- `POST /projects/{project_id}/tasks`
- `GET /tasks/{task_id}`
- `PUT /tasks/{task_id}`
- `PATCH /tasks/{task_id}`
- `PATCH /tasks/{task_id}/status`
- `DELETE /tasks/{task_id}`
- `POST /tasks/{task_id}/tags/{tag_id}`
- `DELETE /tasks/{task_id}/tags/{tag_id}`
- `GET /tasks/{task_id}/comments`
- `POST /tasks/{task_id}/comments`
- `PUT /comments/{comment_id}`
- `DELETE /comments/{comment_id}`
- `GET /tags`
- `POST /tags`
- `DELETE /tags/{tag_id}`
- `GET /health`
- `GET /stats`

## Tests

Run the suite with:

```bash
python -m pytest -q
```

The tests use an in-memory SQLite database and cover auth flows, project ownership, RBAC, task updates, comments, tags, and unauthenticated access handling.
