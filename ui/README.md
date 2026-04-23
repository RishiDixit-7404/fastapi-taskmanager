# Task Manager UI

This is a standalone static UI for the FastAPI backend.

## Run

From the project root:

```powershell
cd ui
python -m http.server 8080
```

Then open:

`http://127.0.0.1:8080`

Set the backend URL in the login screen if your API is not running on `http://127.0.0.1:8000`.

## Notes

- Login uses `/auth/login`
- Register uses `/auth/register`
- The rest of the panels call the backend routes directly with `fetch()`
- Admin-only routes such as `/users` and `/stats` still require an admin user
