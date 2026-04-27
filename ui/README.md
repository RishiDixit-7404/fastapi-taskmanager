# Task Manager UI

This frontend is a standalone static app that talks to the existing FastAPI backend over HTTP. It does not require `node`, `npm`, or backend changes.

## Run

Start the backend first, for example:

```cmd
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8010
```

Then serve the frontend from the `ui` folder:

```cmd
cd /d C:\Users\Rishi.Dixit\Projects\fastapi_taskmanager\fastapi_taskmanager\ui
python -m http.server 8080
```

Open:

`http://127.0.0.1:8080`

Set the backend URL on the login screen to match your running API, for example:

`http://127.0.0.1:8010`

## Screens

- `index.html` login
- `register.html` account creation
- `dashboard.html` summary, health, and API keys
- `projects.html` projects list and project creation
- `project.html?id=...` single project and task creation
- `task.html?id=...` single task, comments, and tags
- `admin.html` admin-only users, stats, and tag deletion

## Auth Model

- Tokens are stored in `sessionStorage`
- The frontend sends `Authorization: Bearer ...` on protected requests
- On `401`, the shared API wrapper clears the session and sends the user back to login
- Closing the browser tab clears the session

## Backend Compatibility Rules

- No backend code is modified
- No `/ui/*` backend routes are required
- Non-admin users do not get an assignee dropdown during task creation
- Admin users can load assignees from `GET /users`
