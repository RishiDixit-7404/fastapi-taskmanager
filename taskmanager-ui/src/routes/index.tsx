import { Navigate, createBrowserRouter } from "react-router-dom";

import { AdminPage } from "../pages/AdminPage";
import { ApiKeysPage } from "../pages/ApiKeysPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { RegisterPage } from "../pages/RegisterPage";
import { TagsPage } from "../pages/TagsPage";
import { TaskDetailPage } from "../pages/TaskDetailPage";
import { AdminRoute } from "./AdminRoute";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/projects", element: <ProjectsPage /> },
      { path: "/projects/:id", element: <ProjectDetailPage /> },
      { path: "/tasks/:id", element: <TaskDetailPage /> },
      { path: "/tags", element: <TagsPage /> },
      { path: "/api-keys", element: <ApiKeysPage /> },
      {
        element: <AdminRoute />,
        children: [{ path: "/admin", element: <AdminPage /> }],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
