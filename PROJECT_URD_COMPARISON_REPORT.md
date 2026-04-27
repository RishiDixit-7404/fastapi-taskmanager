# FastAPI Task Manager Project Report and URD Comparison

## 1. Executive Summary

This repository is a FastAPI-based task management REST API with JWT authentication, refresh token rotation, API key authentication, role-based access control, SQLAlchemy ORM models, Alembic migrations, request logging, rate limiting, centralized exception handling, automated tests, and an additional standalone static frontend.

The project closely follows the supplied User Requirements Document (URD) titled "FastAPI Task Management API". The URD defines a backend-only learning project intended to demonstrate production-style REST API design using FastAPI, SQLAlchemy, JWT access tokens, refresh tokens, API keys, RBAC, middleware, migrations, and tests.

The implemented backend satisfies most of the core URD requirements. The main differences are:

- A static HTML/CSS/JavaScript frontend was added even though the URD explicitly lists frontend UI as out of scope.
- The API response schemas for tasks and comments are simpler than the URD description in a few places.
- The test suite has 30 passing tests, but the tests are not separated exactly into "20 unit tests and 10 E2E scenarios" as the URD requested.
- `requirements.txt` appears to be in `pip list` table format rather than standard installable pinned dependency format.
- Database enum-like fields are stored as strings in SQLAlchemy models and validated by Pydantic schemas rather than represented as database enum types.
- Azure deployment steps or files are not present, although the app is configurable for PostgreSQL through `DATABASE_URL`.

Current test status:

```text
.\.venv\Scripts\python.exe -m pytest -q
30 passed
```

The project is therefore best described as a mostly complete backend implementation of the URD, plus an extra static frontend layer.

## 2. URD Intent

The URD describes a one-week intern learning project. Its purpose is to force the developer to integrate the following backend concepts into one coherent FastAPI application:

- REST routing with all five HTTP methods: GET, POST, PUT, PATCH, DELETE.
- Correct semantic difference between PUT and PATCH.
- JWT access token authentication.
- Refresh token rotation.
- API key generation, hashing, authentication, and revocation.
- Role-based access control using admin and user roles.
- SQLAlchemy ORM models.
- Alembic migrations.
- Pydantic v2 request and response schemas.
- Custom middleware for request logging and rate limiting.
- Consistent exception responses.
- Pytest and HTTPX-based automated testing.
- SQLite for local development and PostgreSQL readiness through `DATABASE_URL`.

The URD explicitly says the project is backend-only. It expects users to interact through Swagger UI, ReDoc, curl, Postman, or tests.

## 3. Actual Project Overview

The actual project is a full backend REST API plus a static browser UI.

Backend:

- Framework: FastAPI.
- ORM: SQLAlchemy 2.x.
- Migrations: Alembic.
- Validation: Pydantic v2.
- Auth: JWT bearer tokens and API keys.
- Password hashing: Passlib bcrypt.
- Token signing: python-jose.
- Database: SQLite by default, configurable through `DATABASE_URL`.
- Middleware: request logging and in-memory per-IP rate limiting.
- Tests: pytest, pytest-asyncio, HTTPX ASGITransport.

Frontend:

- Static HTML files in `ui/`.
- Bootstrap loaded from CDN.
- Vanilla JavaScript.
- No Node.js or build step.
- Uses sessionStorage for access and refresh tokens.
- Talks to the backend over HTTP using a configurable backend base URL.

## 4. Repository Structure

Important backend folders and files:

```text
main.py                  FastAPI app creation, middleware, routers, handlers
config.py                Pydantic settings loaded from .env
database.py              SQLAlchemy engine, SessionLocal, Base, get_db
models/                  SQLAlchemy models
schemas/                 Pydantic request and response schemas
routers/                 API route modules
auth/                    Password, JWT, API key, and auth dependencies
middleware/              Request logging and rate limiting
utils/                   Exception and response helpers
tests/                   Automated tests
alembic/                 Migration setup and versions
README.md                Main project documentation
read_db.py               Local SQLite inspection script
taskmanager.db           Local SQLite database file
```

Frontend files:

```text
ui/index.html            Login page
ui/register.html         Registration page
ui/dashboard.html        Summary, health, API keys
ui/projects.html         Project listing and creation
ui/project.html          Project detail and task management
ui/task.html             Task detail, comments, tags
ui/admin.html            Admin-only users, stats, tags
ui/js/api.js             Shared frontend API/session wrapper
ui/js/auth.js            Login and registration behavior
ui/js/dashboard.js       Dashboard behavior
ui/js/projects.js        Projects page behavior
ui/js/project.js         Project detail behavior
ui/js/task.js            Task detail behavior
ui/js/admin.js           Admin panel behavior
ui/css/custom.css        Custom UI styling
```

There is also a `text/` folder containing text-exported copies of many project files. This appears to be auxiliary documentation or generated reference material, not part of the runtime application.

## 5. Application Startup and Configuration

`main.py` creates the FastAPI app and configures:

- CORS middleware.
- Request logging middleware.
- Rate limiting middleware.
- Centralized exception handlers.
- Routers for auth, users, projects, tasks, comments, tags, and health.

It also calls:

```python
Base.metadata.create_all(bind=engine)
```

This means the app can auto-create tables locally without requiring Alembic first. That is convenient for SQLite development, but it is slightly different from a strict migration-first production setup.

`config.py` defines a `Settings` class using `pydantic-settings`. It loads:

- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `DATABASE_URL`
- `CORS_ORIGINS`

`database.py` creates the SQLAlchemy engine from `settings.DATABASE_URL`. SQLite receives `check_same_thread=False`; other databases do not.

## 6. Data Model

### User

The `User` model stores:

- `id`
- `email`
- `hashed_password`
- `full_name`
- `role`
- `is_active`
- `created_at`

Relationships:

- User owns many projects.
- User may be assigned many tasks.
- User authors many comments.
- User owns many refresh tokens.
- User owns many API keys.

### Project

The `Project` model stores:

- `id`
- `title`
- `description`
- `status`
- `owner_id`
- `created_at`
- `updated_at`

Relationships:

- Project belongs to one owner user.
- Project has many tasks.
- Project deletion cascades to its tasks.

### Task

The `Task` model stores:

- `id`
- `title`
- `description`
- `status`
- `priority`
- `project_id`
- `assignee_id`
- `due_date`
- `created_at`
- `updated_at`

Relationships:

- Task belongs to one project.
- Task may have one assignee user.
- Task has many comments.
- Task has many tags through the `task_tags` association table.
- Task deletion cascades to its comments.

### Comment

The `Comment` model stores:

- `id`
- `body`
- `task_id`
- `author_id`
- `created_at`

Relationships:

- Comment belongs to one task.
- Comment belongs to one author user.

### Tag and TaskTag

The `Tag` model stores:

- `id`
- `name`
- `colour`

`TaskTag` is the many-to-many association table between tasks and tags.

### RefreshToken

The `RefreshToken` model stores:

- `id`
- `token_hash`
- `user_id`
- `expires_at`
- `is_revoked`
- `created_at`

Only the hash of the refresh token is stored.

### APIKey

The `APIKey` model stores:

- `id`
- `key_hash`
- `name`
- `user_id`
- `is_active`
- `last_used_at`
- `created_at`

Only the hash of the raw API key is stored. The raw key is returned only once when created.

## 7. Authentication and Authorization

The project supports two authentication methods.

### JWT Bearer Tokens

JWT flow:

1. User registers through `POST /auth/register`.
2. User logs in through `POST /auth/login`.
3. Login returns an access token and refresh token.
4. Access token is sent as:

```http
Authorization: Bearer <access_token>
```

5. Refresh token is sent to `POST /auth/refresh` when a new access token is needed.
6. Refresh token rotation is enforced: the old refresh token is revoked and a new refresh token is stored.
7. Logout revokes the supplied refresh token.

Access token payload includes:

- `sub`
- `email`
- `exp`
- `type=access`
- `jti`

Refresh token payload includes:

- `sub`
- `email`
- `exp`
- `type=refresh`
- `jti`

### API Keys

API key flow:

1. Authenticated JWT user calls `POST /auth/api-keys`.
2. Server generates a random raw key.
3. Server stores only the SHA-256 hash.
4. Raw key is returned once.
5. Client sends future requests as:

```http
X-API-Key: <raw_api_key>
```

6. Server hashes the incoming key and looks up the stored hash.
7. If valid, `last_used_at` is updated.
8. Revocation sets `is_active=False`.

### Auth Dependencies

The implemented dependencies are:

- `get_current_user_jwt`: requires and validates a JWT bearer token.
- `get_current_user_api_key`: requires and validates an API key.
- `get_current_user`: tries JWT first, then API key.
- `require_admin`: calls `get_current_user` and checks `role == "admin"`.

Important consequence:

The URD endpoint tables sometimes say admin endpoints require `JWT + Admin`. In the implementation, admin endpoints use `require_admin`, which accepts either JWT or API key because it depends on `get_current_user`. Therefore, an admin API key can likely access admin routes. This is not necessarily insecure, but it is a behavior difference from the strict wording of some URD tables.

## 8. Main API Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/api-keys`
- `GET /auth/api-keys`
- `DELETE /auth/api-keys/{key_id}`

Note: `LoginRequest` exists in the schemas, but the login endpoint uses `OAuth2PasswordRequestForm`. This means login expects form data with `username` and `password`, not JSON with `email` and `password`.

### Users

Admin-only:

- `GET /users`
- `GET /users/{user_id}`
- `PUT /users/{user_id}`
- `PATCH /users/{user_id}/role`
- `DELETE /users/{user_id}`

Delete is a soft delete. It sets `is_active=False`.

### Projects

Owner-scoped:

- `GET /projects`
- `POST /projects`
- `GET /projects/{project_id}`
- `PUT /projects/{project_id}`
- `PATCH /projects/{project_id}`
- `DELETE /projects/{project_id}`

`owner_id` is set from the authenticated user, not from the request body.

### Tasks

Owner-scoped through the parent project:

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

Update is author-only. Delete is author-or-admin.

### Tags

- `GET /tags`
- `POST /tags`
- `DELETE /tags/{tag_id}`

Delete is admin-only.

### Health and Stats

- `GET /health`
- `GET /stats`

`/health` is public. `/stats` is admin-only.

## 9. Frontend Behavior

The frontend was added beyond the URD.

The frontend is static and can be served with:

```cmd
cd ui
python -m http.server 8080
```

The backend is expected to run separately, for example:

```cmd
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8010
```

The login page lets the user set the backend base URL. Tokens are stored in browser `sessionStorage`; the backend URL is stored in `localStorage`.

The shared `ui/js/api.js` wrapper:

- Sends `Authorization: Bearer ...` on protected requests.
- Automatically attempts refresh once on a 401 response.
- Clears session and redirects to login if refresh fails.
- Provides helpers for formatting dates, escaping HTML, badges, toast messages, and navigation shell setup.

The frontend supports:

- Registering and logging in.
- Viewing dashboard metrics.
- Viewing health status.
- Creating and revoking API keys.
- Creating, listing, opening, updating, and deleting projects.
- Creating, listing, opening, updating, status-changing, and deleting tasks.
- Adding, editing, and deleting comments.
- Creating and attaching/detaching tags through the available API flows.
- Admin-only user and stats screens.

One frontend limitation is caused by the backend response shape: task detail does not return attached tag objects, so the task page works against the shared tag catalog and offers attach/detach actions rather than showing authoritative attached-tag state.

## 10. Testing Status

The tests are located in:

```text
tests/conftest.py
tests/test_auth.py
tests/test_projects.py
tests/test_tasks.py
```

The test setup:

- Uses in-memory SQLite.
- Overrides FastAPI's `get_db` dependency.
- Uses HTTPX `AsyncClient` with `ASGITransport`.
- Creates test users and admins through fixtures.
- Drops and recreates tables for each test.

Observed test run:

```text
.\.venv\Scripts\python.exe -m pytest -q
30 passed
```

Warnings observed:

- `datetime.utcnow()` deprecation warnings under Python 3.14.
- Pytest cache write permission warning for `.pytest_cache`.

Covered behavior includes:

- User registration.
- Duplicate email rejection.
- Login success and invalid password failure.
- Refresh token rotation.
- Revoked refresh token rejection.
- Expired refresh token rejection.
- Logout revocation.
- `/auth/me` with JWT.
- `/auth/me` with API key.
- Expired access token rejection.
- Tampered JWT rejection.
- API key create/list/revoke.
- Project creation with owner assignment.
- PUT project full update.
- PATCH project partial update.
- Project delete with task cascade.
- Non-owner project delete rejection.
- Task status patch.
- Non-admin user list rejection.
- Admin user list success.
- API key project creation.
- Tag attach/detach.
- Comment author update.
- Public health endpoint.
- Missing token rejection.
- Admin stats.
- Non-admin tag delete rejection.
- Revoked API key rejection.
- Rate limiting after 101 requests.

## 11. Where the Project Matches the URD

The project matches the URD in the following major areas:

- FastAPI application exists and starts with all seven router modules.
- Router modules match the URD: auth, users, projects, tasks, comments, tags, health.
- SQLAlchemy models exist for all required entities.
- Pydantic schemas exist for all major resources.
- JWT access tokens and refresh tokens are implemented.
- Refresh token rotation is implemented.
- Refresh tokens are hashed in the database.
- API keys are implemented.
- API keys are hashed in the database.
- API key revocation is implemented.
- Passwords are hashed with bcrypt.
- Role-based access control exists.
- Admin-only endpoints are implemented.
- Ownership enforcement exists for projects and project-scoped tasks.
- PUT and PATCH are both represented and behave differently.
- PATCH handlers use `model_dump(exclude_unset=True)` for partial updates.
- Request logging middleware exists.
- Rate limiting middleware exists.
- Centralized exception handlers exist.
- Alembic migration setup exists.
- Local SQLite development works.
- PostgreSQL can be targeted by changing `DATABASE_URL`.
- Automated tests are present and passing.
- README explains setup, backend usage, UI usage, endpoint list, auth model, and tests.

## 12. Key Differences From the URD

### Difference 1: Frontend UI Added Despite Being Out of Scope

URD:

- Frontend UI is explicitly out of scope.
- All interaction should be through Swagger UI, pytest, curl, Postman, or other API clients.

Project:

- Adds a complete static frontend under `ui/`.
- README documents how to serve and use it.

Impact:

- This is an enhancement beyond scope.
- It does not appear to require backend route changes.
- It may be useful for demo purposes.
- It should be clearly presented as an extra deliverable, not part of the original backend-only requirement.

### Difference 2: `requirements.txt` Format Is Likely Wrong

URD:

- Requires pinned dependencies in `requirements.txt`.

Project:

- `requirements.txt` appears to contain output similar to `pip list`, with columns:

```text
Package           Version
----------------- ---------
alembic           1.18.4
...
```

Expected installable format would be more like:

```text
alembic==1.18.4
fastapi==0.135.3
...
```

Impact:

- `pip install -r requirements.txt` may fail.
- This is one of the most important cleanup items because README setup depends on it.

### Difference 3: Task Detail Response Is Not as Rich as the URD Describes

URD:

- `GET /tasks/{task_id}` should return a task with nested project and assignee info.

Project:

- `TaskResponse` returns scalar fields including `project_id` and `assignee_id`.
- It does not include nested project or assignee objects.
- It does not include attached tags or comments.

Impact:

- Backend is functionally usable.
- Swagger response is simpler than URD wording.
- Frontend has to make extra calls to fetch project details.
- Frontend cannot reliably display attached tags because task responses do not include tag objects.

### Difference 4: Comment Response Is Simpler Than the URD Describes

URD:

- Comment responses should include author info.

Project:

- `CommentResponse` includes `author_id`, but not a nested author object.

Impact:

- Comment ownership still works.
- UI displays authors as `Author #id`.
- The response is less user-friendly than the URD expects.

### Difference 5: Test Suite Count Matches Numerically but Not Structurally

URD:

- Requires 20 unit tests.
- Requires 10 end-to-end scenarios.
- Each E2E scenario should use HTTPX AsyncClient against an in-memory DB.

Project:

- Has 30 passing tests.
- Tests are spread across auth, projects, and tasks.
- They are not explicitly separated into "unit" and "E2E" groups.
- Some scenario-level URD workflows are partially covered but not as full workflows.

Examples:

- Rate limiting is tested.
- API key flow is tested.
- RBAC is tested.
- Ownership is tested.
- Cascade delete is tested for project and tasks, but not clearly for comments in the cascade scenario.
- Full post-logout access-token stateless behavior is not clearly covered.
- Full admin workflow as one scenario is not clearly covered.

Impact:

- Quality signal is good because all tests pass.
- Formal URD acceptance could still request clearer mapping to MT-01 through MT-20 and E2E-01 through E2E-10.

### Difference 6: Database Enums Are Implemented as Strings

URD:

- Describes `role`, `status`, and `priority` as enums.

Project:

- SQLAlchemy models use `String` columns.
- Pydantic schemas enforce allowed values using regex patterns.

Impact:

- API inputs are validated correctly.
- Direct database writes could still insert invalid values.
- If strict DB-level enforcement is required, SQLAlchemy Enum or check constraints should be added.

### Difference 7: Admin Routes Accept API Keys Through Shared Dependency

URD:

- Some endpoint tables say admin routes require `JWT + Admin`.

Project:

- `require_admin` depends on `get_current_user`.
- `get_current_user` accepts JWT or API key.
- Therefore, admin API keys can likely access admin-only endpoints.

Impact:

- This may be acceptable if "admin identity" is what matters.
- It differs from a strict reading of "JWT + Admin".
- If the reviewer expects JWT-only admin routes, `require_admin` should depend on `get_current_user_jwt` instead.

### Difference 8: Success Response Wrapper Exists but Is Mostly Unused

URD:

- Mentions standardized success response wrapper:

```json
{ "success": true, "data": "...", "message": "..." }
```

Project:

- `utils/responses.py` defines `success_response`.
- Routers generally return direct Pydantic models or dictionaries.

Impact:

- FastAPI-native response schemas are cleaner and common in REST APIs.
- But this is different from the exact utility expectation in the URD.

### Difference 9: Alembic Exists, But Startup Also Creates Tables

URD:

- Alembic should manage all database schema changes.

Project:

- Alembic is configured.
- Initial migration exists.
- `main.py` also calls `Base.metadata.create_all(bind=engine)`.

Impact:

- Local SQLite setup is forgiving.
- Production should rely on Alembic migrations rather than auto-creating tables.
- This is not fatal, but it is a design difference.

### Difference 10: Azure Deployment Not Implemented or Documented

URD:

- Deployment target is local SQLite to Azure App Service with PostgreSQL.
- Acceptance criteria say Azure deployment or documented deployment steps are nice to have.

Project:

- No Azure deployment files or detailed Azure deployment steps were found.
- App can switch database by `DATABASE_URL`.

Impact:

- Core local project is complete enough for backend learning.
- Azure readiness is only partial.

## 13. Acceptance Criteria Status Estimate

This is an estimated status based on repository inspection and test execution.

| ID | URD Requirement | Status | Notes |
|---|---|---|---|
| AC-01 | FastAPI starts with routers and docs | Likely met | Routers are registered in `main.py`. |
| AC-02 | Register/login and hashed passwords | Met | Tests cover hashing and login. |
| AC-03 | JWT accepted and invalid tokens rejected | Met | Tests cover valid, expired, and tampered JWTs. |
| AC-04 | Refresh rotation | Met | Tests verify old token revoked. |
| AC-05 | API key auth and revoked key rejection | Met | Tests cover create, use, revoke, reject. |
| AC-06 | All five HTTP methods demonstrated | Met | GET, POST, PUT, PATCH, DELETE all exist. |
| AC-07 | PUT vs PATCH semantics | Mostly met | Implemented and tested for projects/tasks. |
| AC-08 | Admin-only returns 403 for non-admin | Met | Tests cover `/users` and tag delete. |
| AC-09 | 20 unit tests pass | Mostly met | 30 tests pass, but not explicitly grouped as 20 unit tests. |
| AC-10 | 10 E2E scenarios pass | Partially met | Many flows are covered, but not clearly as the 10 named scenarios. |
| AC-11 | Alembic migration creates tables | Likely met | Initial migration exists; not separately verified during this report. |
| AC-12 | No hardcoded secrets | Mostly met | Settings load from `.env`; actual `.env` exists locally and should not be committed. |
| AC-13 | Logging middleware | Met | Logs method, path, status, duration. |
| AC-14 | Rate limiting | Met | Test confirms 429 after 101 requests. |
| AC-15 | Consistent error JSON | Mostly met | Exception handlers exist; some responses are native FastAPI-style through handlers. |
| AC-16 | Swagger schemas | Likely met | Pydantic schemas are used. |
| AC-17 | Azure deploy/docs | Not met or not found | No clear Azure deployment docs. |
| AC-18 | README sufficient | Mostly met | Good README, but `requirements.txt` format undermines setup. |

## 14. Recommended Cleanup Before Final Submission

Highest priority:

1. Convert `requirements.txt` to valid pinned requirement lines.
2. Decide whether the frontend should be presented as an extra or removed from the formal backend-only submission.
3. Add or revise tests to explicitly map to the URD's 20 MT tests and 10 E2E scenarios.
4. Add nested response schemas if strict URD compliance is required:
   - Task response with project and assignee info.
   - Comment response with author info.
   - Possibly task response with tags.
5. Decide whether admin endpoints should be JWT-only or JWT/API-key admin identity.

Medium priority:

6. Replace `datetime.utcnow()` defaults with timezone-aware UTC values where practical.
7. Consider database-level enum/check constraints for `role`, `project.status`, `task.status`, and `task.priority`.
8. Remove `Base.metadata.create_all(bind=engine)` for production-style migration discipline, or document why it remains for local development.
9. Add Azure deployment documentation.
10. Add a formal acceptance criteria checklist to README.

Lower priority:

11. Use or remove `utils/responses.py`.
12. Improve frontend tag display by returning attached tags from task detail/list endpoints.
13. Show author names in comment responses and UI rather than only author IDs.

## 15. Suggested Reviewer Narrative

This project implements the URD's intended backend learning objectives: FastAPI routing, SQLAlchemy models, Pydantic schemas, JWT authentication, refresh token rotation, API key authentication, RBAC, middleware, migrations, and tests. The implementation is not merely skeletal; it has working route logic, ownership enforcement, hashed secrets, revocation flows, admin protections, and a passing automated test suite.

The main scope expansion is the static UI, which was not required by the URD. This should be framed as an additional demonstration layer that consumes the REST API without requiring backend template routes or a JavaScript build system.

The main compliance gaps are around exact packaging and formal acceptance mapping rather than core backend behavior. The most concrete technical issue is `requirements.txt`, which should be converted into valid pinned dependency syntax. The most visible API-design difference is that task and comment responses return IDs instead of nested related objects, even though the URD describes richer responses.

If the goal is practical functionality, the project is strong. If the goal is strict URD conformance, the above gaps should be closed or explicitly documented as intentional deviations.

## 16. Compact Context Packet for Another AI Model

Use the following summary if sending this project context to another model:

```text
This is a FastAPI Task Manager API built from a URD for an intern backend project. It implements JWT auth with access and refresh tokens, refresh token rotation, API key auth using SHA-256 hashed keys, RBAC with admin/user roles, SQLAlchemy models, Alembic migrations, custom request logging, per-IP rate limiting, centralized exception responses, and pytest/HTTPX tests.

Main backend files:
- main.py registers middleware, exception handlers, and routers.
- config.py loads settings from .env using pydantic-settings.
- database.py defines SQLAlchemy engine/session/Base/get_db.
- models define User, Project, Task, Comment, Tag/TaskTag, RefreshToken, APIKey.
- schemas define Pydantic models for auth/users/projects/tasks/comments/tags.
- routers define auth, users, projects, tasks, comments, tags, health/stats.
- auth contains password hashing, JWT handling, API key handling, dependencies.
- middleware contains logging and rate limiting.
- tests use in-memory SQLite and HTTPX ASGITransport.

Core endpoints:
- /auth/register, /auth/login, /auth/refresh, /auth/logout, /auth/me
- /auth/api-keys create/list/revoke
- /users admin CRUD/role/deactivate
- /projects owner CRUD
- /projects/{project_id}/tasks create/list
- /tasks/{task_id} get/update/patch/delete
- /tasks/{task_id}/status
- /tasks/{task_id}/tags/{tag_id}
- /tasks/{task_id}/comments
- /comments/{comment_id}
- /tags
- /health
- /stats

Compared with the URD, the backend mostly matches. Key differences:
1. A static UI was added under ui/, although the URD said frontend is out of scope.
2. TaskResponse returns project_id and assignee_id, not nested project/assignee info.
3. CommentResponse returns author_id, not nested author info.
4. requirements.txt appears to be pip-list table output, not package==version lines.
5. Tests pass, 30 total, but are not explicitly organized as 20 unit tests and 10 E2E scenarios.
6. Enum-like fields are SQLAlchemy strings validated by Pydantic regex, not DB enum columns.
7. require_admin accepts get_current_user, so admin API keys may access admin endpoints, while URD wording sometimes says JWT + Admin.
8. success_response helper exists but routes mostly return raw Pydantic models.
9. Alembic exists, but main.py also calls Base.metadata.create_all.
10. Azure deployment docs/files are not present.

Current test command:
.\.venv\Scripts\python.exe -m pytest -q

Observed result:
30 passed.
```
