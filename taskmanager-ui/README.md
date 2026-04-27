# Task Manager React Frontend

React 18 + Vite frontend for the FastAPI Task Manager API.

This is a client-side single-page application that consumes the existing FastAPI backend from the parent repository. It does not modify backend routes and does not use the older static `ui/` folder.

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
- date-fns

## Folder Structure

```text
taskmanager-ui/
  src/
    api/          Axios client and endpoint-specific API modules
    components/   Layout, feature components, and local shadcn-style UI primitives
    hooks/        TanStack Query hooks and auth selector hook
    pages/        Route-level pages
    routes/       React Router route config, ProtectedRoute, AdminRoute
    store/        Zustand auth store
    types/        TypeScript API contracts matching the FastAPI schemas
    utils/        Formatting and class-name helpers
    App.tsx       QueryClientProvider, RouterProvider, Toaster
    main.tsx      Vite entry point
  public/
    favicon.svg
  .env.example
  package.json
  tailwind.config.ts
  vite.config.ts
```

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
- Inline error alerts for failed data loads and auth failures.
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

On macOS/Linux:

```bash
cp .env.example .env
```

Default:

```env
VITE_API_BASE_URL=http://localhost:8000
```

If the backend is running on another port, update `VITE_API_BASE_URL`.

All API base URL usage flows through `src/api/client.ts`.

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

## Auth Notes

- Access and refresh tokens are stored only in the Zustand auth store.
- Tokens are not written to `localStorage` or `sessionStorage`.
- A full browser refresh clears the in-memory auth state and sends the user back to `/login`.
- Axios injects `Authorization: Bearer <accessToken>` on API calls when a token exists.
- On a `401`, Axios attempts one refresh request using `/auth/refresh`, retries the original request once, and redirects to `/login` if refresh fails.
- API keys are displayed for programmatic use only; the React UI itself always authenticates with JWT bearer tokens.

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

## First Tests After npm Is Available

```bash
cd taskmanager-ui
npm install
npm run build
npm run dev
```

Then manually verify:

- Register, auto-login, logout, and login.
- Token refresh after an expired access token.
- Project create, PUT edit, PATCH status, and delete.
- Task create, PUT edit, PATCH status, tag attach/detach, and delete.
- Comment add, edit as author, delete as author/admin.
- API key create, copy, list, and revoke.
- Admin stats, user role change, and deactivate.
- Non-admin redirect away from `/admin`.
- Mobile viewport layout.
