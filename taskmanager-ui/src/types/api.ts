export type UserRole = "admin" | "user";
export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface ApiErrorBody {
  detail?: string;
  status_code?: number;
  type?: string;
  message?: string;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export interface ApiKeyCreateRequest {
  name: string;
}

export interface ApiKeyResponse {
  id: number;
  name: string;
  key: string;
  is_active: boolean;
}

export interface ApiKeyListResponse {
  id: number;
  name: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface ProjectCreate {
  title: string;
  description?: string | null;
  status: ProjectStatus;
}

export interface ProjectUpdate extends ProjectCreate {}

export interface ProjectPatch {
  title?: string;
  description?: string | null;
  status?: ProjectStatus;
}

export interface ProjectResponse {
  id: number;
  title: string;
  description: string | null;
  status: ProjectStatus;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: number | null;
  due_date?: string | null;
}

export interface TaskUpdate extends TaskCreate {}

export interface TaskPatch {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: number | null;
  due_date?: string | null;
}

export interface TaskResponse {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: number;
  assignee_id: number | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentResponse {
  id: number;
  body: string;
  task_id: number;
  author_id: number;
  created_at: string;
}

export interface TagCreate {
  name: string;
  colour: string;
}

export interface TagResponse {
  id: number;
  name: string;
  colour: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
}

export interface StatsResponse {
  total_users: number;
  total_projects: number;
  total_tasks: number;
  tasks_by_status: Partial<Record<TaskStatus, number>>;
}
