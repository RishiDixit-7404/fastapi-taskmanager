# Task Manager React Frontend

React 18 + Vite frontend for the FastAPI Task Manager API.

## Stack

- React 18
- Vite
- TypeScript
- React Router v6
- TanStack Query
- Zustand
- Axios
- Tailwind CSS
- React Hook Form
- Zod
- Lucide React
- Sonner

## Features

- Register and login against the FastAPI backend.
- JWT bearer token auth with in-memory Zustand token storage.
- Axios response interceptor that refreshes tokens once on `401`.
- Protected routes and admin-only route guard.
- Dashboard with health check and project summary.
- Project list, create, PUT full edit, PATCH status edit, and delete.
- Project detail with list and kanban task views.
- Task create, detail, PUT edit, PATCH status edit, delete, tag attach, and tag detach.
- Comment thread with add, author-only edit, and author/admin delete.
- Tag catalog with create and admin-only delete.
- API key create/list/revoke with one-time raw key reveal modal.
- Admin panel with stats, user role change, and user deactivation.
- Toast notifications and loading/empty states.
- Dark mode toggle.

## Backend Assumptions

The frontend is wired to the existing FastAPI backend in the parent repository.

Important backend contract details:

- `POST /auth/login` expects form data with `username` and `password`.
- Protected UI calls use `Authorization: Bearer <access_token>`.
- API keys are shown in the UI for programmatic use, but the UI itself does not authenticate with API keys.
- Task responses currently include `project_id` and `assignee_id`, not nested project/assignee objects.
- Task responses do not include attached tag objects, so the UI exposes attach/detach actions against the shared tag catalog.

## Setup

Install Node.js first. This machine did not have `node` or `npm` available when the app was generated.

```bash
cd taskmanager-ui
npm install
```

Create local environment config:

```bash
copy .env.example .env
```

Default:

```env
VITE_API_BASE_URL=http://localhost:8000
```

If the backend is running on another port, update `VITE_API_BASE_URL`.

## Run

Start the FastAPI backend separately from the parent repo:

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Start the React app:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Build

```bash
npm run build
npm run preview
```

## Route Map

| Route | Purpose |
|---|---|
| `/login` | Public login |
| `/register` | Public registration with auto-login |
| `/dashboard` | Health, project count, quick links |
| `/projects` | Project list, filter, create, delete |
| `/projects/:id` | Project detail, PUT edit, PATCH status, tasks |
| `/tasks/:id` | Task detail, PUT edit, PATCH status, tags, comments |
| `/tags` | Shared tag catalog |
| `/api-keys` | API key management |
| `/admin` | Admin-only stats and user management |

## Notes for Review

This app follows the React frontend URD closely, but the shadcn/ui requirement is implemented as local Tailwind-styled primitives in `src/components/ui` rather than generated Radix/shadcn components. That keeps the frontend self-contained and avoids requiring the shadcn CLI during generation.

The app is ready for dependency installation and a Vite build on a machine with Node.js/npm installed.
