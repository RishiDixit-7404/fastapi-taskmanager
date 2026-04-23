const storageKeys = {
    baseUrl: "taskManager.baseUrl",
    accessToken: "taskManager.accessToken",
    refreshToken: "taskManager.refreshToken",
};

const state = {
    baseUrl: localStorage.getItem(storageKeys.baseUrl) || "http://127.0.0.1:8000",
    accessToken: localStorage.getItem(storageKeys.accessToken) || "",
    refreshToken: localStorage.getItem(storageKeys.refreshToken) || "",
};

const elements = {
    authScreen: document.getElementById("auth-screen"),
    appScreen: document.getElementById("app-screen"),
    baseUrlInput: document.getElementById("base-url"),
    sessionBaseUrl: document.getElementById("session-base-url"),
    sessionTokenState: document.getElementById("session-token-state"),
    authOutput: document.getElementById("auth-output"),
    meOutput: document.getElementById("me-output"),
    healthOutput: document.getElementById("health-output"),
    projectsOutput: document.getElementById("projects-output"),
    tasksOutput: document.getElementById("tasks-output"),
    commentsOutput: document.getElementById("comments-output"),
    tagsOutput: document.getElementById("tags-output"),
    apiKeysOutput: document.getElementById("api-keys-output"),
    usersOutput: document.getElementById("users-output"),
};

document.addEventListener("DOMContentLoaded", () => {
    elements.baseUrlInput.value = state.baseUrl;
    syncSessionView();
    bindForms();
    bindButtons();
    toggleScreens(Boolean(state.accessToken));
    if (state.accessToken) {
        loadMe();
    }
});

function bindForms() {
    document.getElementById("settings-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        state.baseUrl = sanitizeBaseUrl(formData.get("baseUrl"));
        localStorage.setItem(storageKeys.baseUrl, state.baseUrl);
        syncSessionView();
        writeOutput(elements.authOutput, { message: "Backend URL saved", baseUrl: state.baseUrl });
    });

    document.getElementById("login-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const body = new URLSearchParams();
        body.set("username", String(formData.get("email")));
        body.set("password", String(formData.get("password")));
        try {
            const response = await rawRequest("/auth/login", {
                method: "POST",
                body,
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            storeTokens(response);
            toggleScreens(true);
            syncSessionView();
            writeOutput(elements.authOutput, response);
            await loadMe();
        } catch (error) {
            writeOutput(elements.authOutput, error);
        }
    });

    document.getElementById("register-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        try {
            const response = await rawRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    full_name: formData.get("full_name"),
                    email: formData.get("email"),
                    password: formData.get("password"),
                }),
            });
            writeOutput(elements.authOutput, response);
        } catch (error) {
            writeOutput(elements.authOutput, error);
        }
    });

    document.getElementById("project-create-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await handleAuthenticated(elements.projectsOutput, "/projects", {
            method: "POST",
            body: JSON.stringify({
                title: formData.get("title"),
                description: formData.get("description") || null,
                status: formData.get("status"),
            }),
        });
    });

    document.getElementById("project-by-id-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitter = event.submitter;
        const formData = new FormData(event.currentTarget);
        const projectId = formData.get("project_id");
        const method = submitter.dataset.mode === "delete" ? "DELETE" : "GET";
        await handleAuthenticated(elements.projectsOutput, `/projects/${projectId}`, { method });
    });

    document.getElementById("project-update-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitter = event.submitter;
        const formData = new FormData(event.currentTarget);
        await handleJsonPayloadForm({
            output: elements.projectsOutput,
            endpoint: `/projects/${formData.get("project_id")}`,
            method: submitter.dataset.mode === "patch" ? "PATCH" : "PUT",
            payloadText: formData.get("payload"),
        });
    });

    document.getElementById("task-create-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await handleJsonPayloadForm({
            output: elements.tasksOutput,
            endpoint: `/projects/${formData.get("project_id")}/tasks`,
            method: "POST",
            payloadText: formData.get("payload"),
        });
    });

    document.getElementById("task-by-id-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitter = event.submitter;
        const formData = new FormData(event.currentTarget);
        const taskId = formData.get("task_id");
        const method = submitter.dataset.mode === "delete" ? "DELETE" : "GET";
        await handleAuthenticated(elements.tasksOutput, `/tasks/${taskId}`, { method });
    });

    document.getElementById("task-update-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitter = event.submitter;
        const formData = new FormData(event.currentTarget);
        await handleJsonPayloadForm({
            output: elements.tasksOutput,
            endpoint: `/tasks/${formData.get("task_id")}`,
            method: submitter.dataset.mode === "patch" ? "PATCH" : "PUT",
            payloadText: formData.get("payload"),
        });
    });

    document.getElementById("task-status-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await handleAuthenticated(elements.tasksOutput, `/tasks/${formData.get("task_id")}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: formData.get("status") }),
        });
    });

    document.getElementById("task-tag-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitter = event.submitter;
        const formData = new FormData(event.currentTarget);
        const mode = submitter.dataset.mode;
        const endpoint = `/tasks/${formData.get("task_id")}/tags/${formData.get("tag_id")}`;
        await handleAuthenticated(elements.tasksOutput, endpoint, { method: mode === "detach" ? "DELETE" : "POST" });
    });

    document.getElementById("comment-create-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await handleAuthenticated(elements.commentsOutput, `/tasks/${formData.get("task_id")}/comments`, {
            method: "POST",
            body: JSON.stringify({ body: formData.get("body") }),
        });
    });

    document.getElementById("comment-update-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await handleAuthenticated(elements.commentsOutput, `/comments/${formData.get("comment_id")}`, {
            method: "PUT",
            body: JSON.stringify({ body: formData.get("body") }),
        });
    });

    document.getElementById("comment-delete-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await handleAuthenticated(elements.commentsOutput, `/comments/${formData.get("comment_id")}`, { method: "DELETE" });
    });

    document.getElementById("tag-create-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await handleAuthenticated(elements.tagsOutput, "/tags", {
            method: "POST",
            body: JSON.stringify({
                name: formData.get("name"),
                colour: formData.get("colour"),
            }),
        });
    });

    document.getElementById("tag-delete-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await handleAuthenticated(elements.tagsOutput, `/tags/${formData.get("tag_id")}`, { method: "DELETE" });
    });

    document.getElementById("api-key-create-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await handleAuthenticated(elements.apiKeysOutput, "/auth/api-keys", {
            method: "POST",
            body: JSON.stringify({ name: formData.get("name") }),
        });
    });

    document.getElementById("api-key-delete-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await handleAuthenticated(elements.apiKeysOutput, `/auth/api-keys/${formData.get("key_id")}`, { method: "DELETE" });
    });

    document.getElementById("user-by-id-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitter = event.submitter;
        const formData = new FormData(event.currentTarget);
        const method = submitter.dataset.mode === "delete" ? "DELETE" : "GET";
        await handleAuthenticated(elements.usersOutput, `/users/${formData.get("user_id")}`, { method });
    });

    document.getElementById("user-update-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await handleJsonPayloadForm({
            output: elements.usersOutput,
            endpoint: `/users/${formData.get("user_id")}`,
            method: "PUT",
            payloadText: formData.get("payload"),
        });
    });

    document.getElementById("user-role-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await handleAuthenticated(elements.usersOutput, `/users/${formData.get("user_id")}/role`, {
            method: "PATCH",
            body: JSON.stringify({ role: formData.get("role") }),
        });
    });
}

function bindButtons() {
    document.getElementById("load-me-btn").addEventListener("click", loadMe);
    document.getElementById("refresh-token-btn").addEventListener("click", refreshSession);
    document.getElementById("logout-btn").addEventListener("click", logout);

    document.querySelector('[data-action="health"]').addEventListener("click", () => {
        handlePublic(elements.healthOutput, "/health");
    });
    document.querySelector('[data-action="stats"]').addEventListener("click", () => {
        handleAuthenticated(elements.healthOutput, "/stats");
    });
    document.querySelector('[data-action="list-projects"]').addEventListener("click", () => {
        const projectId = window.prompt("Optional status filter for projects. Leave blank for all.", "");
        const query = projectId ? `?status=${encodeURIComponent(projectId)}` : "";
        handleAuthenticated(elements.projectsOutput, `/projects${query}`);
    });
    document.querySelector('[data-action="list-tasks"]').addEventListener("click", () => {
        const projectId = window.prompt("Project ID for task list", "");
        if (!projectId) {
            writeOutput(elements.tasksOutput, { error: "Project ID is required" });
            return;
        }
        handleAuthenticated(elements.tasksOutput, `/projects/${projectId}/tasks`);
    });
    document.querySelector('[data-action="list-comments"]').addEventListener("click", () => {
        const taskId = window.prompt("Task ID for comments", "");
        if (!taskId) {
            writeOutput(elements.commentsOutput, { error: "Task ID is required" });
            return;
        }
        handleAuthenticated(elements.commentsOutput, `/tasks/${taskId}/comments`);
    });
    document.querySelector('[data-action="list-tags"]').addEventListener("click", () => {
        const name = window.prompt("Optional name filter for tags. Leave blank for all.", "");
        const query = name ? `?name=${encodeURIComponent(name)}` : "";
        handleAuthenticated(elements.tagsOutput, `/tags${query}`);
    });
    document.querySelector('[data-action="list-api-keys"]').addEventListener("click", () => {
        handleAuthenticated(elements.apiKeysOutput, "/auth/api-keys");
    });
    document.querySelector('[data-action="list-users"]').addEventListener("click", () => {
        const role = window.prompt("Optional role filter for users. Leave blank for all.", "");
        const query = role ? `?role=${encodeURIComponent(role)}` : "";
        handleAuthenticated(elements.usersOutput, `/users${query}`);
    });
}

async function loadMe() {
    await handleAuthenticated(elements.meOutput, "/auth/me");
}

async function refreshSession() {
    if (!state.refreshToken) {
        writeOutput(elements.meOutput, { error: "No refresh token stored" });
        return;
    }
    try {
        const response = await rawRequest("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refresh_token: state.refreshToken }),
        });
        storeTokens(response);
        syncSessionView();
        writeOutput(elements.meOutput, response);
    } catch (error) {
        writeOutput(elements.meOutput, error);
    }
}

async function logout() {
    if (state.refreshToken) {
        try {
            await authenticatedRequest("/auth/logout", {
                method: "POST",
                body: JSON.stringify({ refresh_token: state.refreshToken }),
            });
        } catch (error) {
            writeOutput(elements.meOutput, error);
        }
    }
    clearTokens();
    toggleScreens(false);
    syncSessionView();
    writeOutput(elements.authOutput, { message: "Logged out" });
}

async function handlePublic(output, endpoint, options = {}) {
    try {
        const response = await rawRequest(endpoint, options);
        writeOutput(output, response);
    } catch (error) {
        writeOutput(output, error);
    }
}

async function handleAuthenticated(output, endpoint, options = {}) {
    try {
        const response = await authenticatedRequest(endpoint, options);
        writeOutput(output, response);
        return response;
    } catch (error) {
        writeOutput(output, error);
        return null;
    }
}

async function handleJsonPayloadForm({ output, endpoint, method, payloadText }) {
    try {
        const payload = JSON.parse(payloadText);
        const response = await authenticatedRequest(endpoint, {
            method,
            body: JSON.stringify(payload),
        });
        writeOutput(output, response);
    } catch (error) {
        writeOutput(output, normalizeError(error));
    }
}

async function authenticatedRequest(endpoint, options = {}, allowRefresh = true) {
    if (!state.accessToken) {
        throw { error: "Please log in first" };
    }

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${state.accessToken}`,
    };

    try {
        return await rawRequest(endpoint, { ...options, headers });
    } catch (error) {
        const normalized = normalizeError(error);
        if (normalized.status === 401 && allowRefresh && state.refreshToken) {
            await refreshSession();
            return authenticatedRequest(endpoint, options, false);
        }
        throw normalized;
    }
}

async function rawRequest(endpoint, options = {}) {
    const headers = {
        Accept: "application/json",
        ...(options.body instanceof URLSearchParams ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
    };

    const response = await fetch(`${state.baseUrl}${endpoint}`, {
        method: options.method || "GET",
        headers,
        body: options.body,
    });

    const text = await response.text();
    const data = text ? safeParse(text) : { status: response.status, message: "No content" };

    if (!response.ok) {
        throw {
            status: response.status,
            endpoint,
            error: data,
        };
    }

    if (response.status === 204) {
        return { status: 204, message: "No content" };
    }

    return data;
}

function safeParse(value) {
    try {
        return JSON.parse(value);
    } catch (_error) {
        return { raw: value };
    }
}

function writeOutput(element, value) {
    element.textContent = JSON.stringify(value, null, 2);
}

function storeTokens(data) {
    state.accessToken = data.access_token || "";
    state.refreshToken = data.refresh_token || state.refreshToken;
    localStorage.setItem(storageKeys.accessToken, state.accessToken);
    localStorage.setItem(storageKeys.refreshToken, state.refreshToken);
}

function clearTokens() {
    state.accessToken = "";
    state.refreshToken = "";
    localStorage.removeItem(storageKeys.accessToken);
    localStorage.removeItem(storageKeys.refreshToken);
}

function toggleScreens(isLoggedIn) {
    elements.authScreen.classList.toggle("hidden", isLoggedIn);
    elements.appScreen.classList.toggle("hidden", !isLoggedIn);
}

function sanitizeBaseUrl(value) {
    return String(value || "").trim().replace(/\/+$/, "");
}

function syncSessionView() {
    elements.sessionBaseUrl.textContent = state.baseUrl;
    elements.sessionTokenState.textContent = state.accessToken ? "Loaded" : "Missing";
}

function normalizeError(error) {
    if (error instanceof Error) {
        return { error: error.message };
    }
    return error;
}
