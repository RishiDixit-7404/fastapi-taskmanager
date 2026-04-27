(function () {
    const SESSION_KEYS = {
        accessToken: "taskmanager.accessToken",
        refreshToken: "taskmanager.refreshToken",
        currentUser: "taskmanager.currentUser",
    };

    const SETTINGS_KEYS = {
        baseUrl: "taskmanager.baseUrl",
    };

    let toastTimer = null;

    function setBaseUrl(baseUrl) {
        localStorage.setItem(SETTINGS_KEYS.baseUrl, sanitizeBaseUrl(baseUrl));
    }

    function getBaseUrl() {
        return sanitizeBaseUrl(localStorage.getItem(SETTINGS_KEYS.baseUrl) || "http://127.0.0.1:8000");
    }

    function sanitizeBaseUrl(value) {
        return String(value || "").trim().replace(/\/+$/, "");
    }

    function setSession(tokens) {
        if (tokens.access_token) {
            sessionStorage.setItem(SESSION_KEYS.accessToken, tokens.access_token);
        }
        if (tokens.refresh_token) {
            sessionStorage.setItem(SESSION_KEYS.refreshToken, tokens.refresh_token);
        }
    }

    function clearSession() {
        sessionStorage.removeItem(SESSION_KEYS.accessToken);
        sessionStorage.removeItem(SESSION_KEYS.refreshToken);
        sessionStorage.removeItem(SESSION_KEYS.currentUser);
    }

    function getAccessToken() {
        return sessionStorage.getItem(SESSION_KEYS.accessToken) || "";
    }

    function getRefreshToken() {
        return sessionStorage.getItem(SESSION_KEYS.refreshToken) || "";
    }

    function redirectToLogin() {
        window.location.href = "index.html";
    }

    function showToast(message, type = "info") {
        const toast = document.getElementById("toast");
        if (!toast) {
            return;
        }
        toast.className = `app-toast toast-${type}`;
        toast.textContent = message;
        toast.classList.remove("d-none");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toast.classList.add("d-none");
        }, 3500);
    }

    async function rawFetch(path, options = {}) {
        const headers = { Accept: "application/json", ...(options.headers || {}) };
        if (!(options.body instanceof URLSearchParams) && !headers["Content-Type"] && options.body !== undefined) {
            headers["Content-Type"] = "application/json";
        }

        const response = await fetch(`${getBaseUrl()}${path}`, {
            method: options.method || "GET",
            headers,
            body: options.body,
        });

        const text = await response.text();
        const data = text ? safeJsonParse(text) : { status: response.status, message: "No content" };

        if (!response.ok) {
            throw {
                status: response.status,
                data,
                message: extractErrorMessage(data) || `Request failed with status ${response.status}`,
            };
        }

        if (response.status === 204) {
            return { status: 204, message: "No content" };
        }

        return data;
    }

    async function refreshSession() {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            throw new Error("No refresh token stored.");
        }
        const payload = await rawFetch("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        setSession(payload);
        return payload;
    }

    async function apiFetch(path, options = {}, allowRefresh = true) {
        const accessToken = getAccessToken();
        if (!accessToken) {
            clearSession();
            redirectToLogin();
            throw new Error("Not authenticated.");
        }

        try {
            return await rawFetch(path, {
                ...options,
                headers: {
                    ...(options.headers || {}),
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        } catch (error) {
            if (error.status === 401 && allowRefresh && getRefreshToken()) {
                try {
                    await refreshSession();
                    return await apiFetch(path, options, false);
                } catch (_refreshError) {
                    clearSession();
                    redirectToLogin();
                    throw _refreshError;
                }
            }
            if (error.status === 401) {
                clearSession();
                redirectToLogin();
            }
            throw error;
        }
    }

    async function getCurrentUser(force = false) {
        if (!force) {
            const cached = sessionStorage.getItem(SESSION_KEYS.currentUser);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        const user = await apiFetch("/auth/me");
        sessionStorage.setItem(SESSION_KEYS.currentUser, JSON.stringify(user));
        return user;
    }

    async function logout() {
        const refreshToken = getRefreshToken();
        const accessToken = getAccessToken();
        if (refreshToken && accessToken) {
            try {
                await rawFetch("/auth/logout", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${accessToken}` },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });
            } catch (_error) {
                // Clear client session even if the backend token is already invalid.
            }
        }
        clearSession();
        redirectToLogin();
    }

    function hasAccessToken() {
        return Boolean(getAccessToken());
    }

    function ensureAuthenticated(redirect = true) {
        if (!getAccessToken()) {
            if (redirect) {
                redirectToLogin();
            }
            return false;
        }
        return true;
    }

    async function initAppShell(activePage) {
        if (!ensureAuthenticated()) {
            return null;
        }

        const user = await getCurrentUser();
        const nav = document.getElementById("app-nav");
        if (nav) {
            const isAdmin = user.role === "admin";
            nav.innerHTML = `
                <div class="navbar navbar-expand-lg navbar-dark sticky-top">
                    <div class="container">
                        <a class="navbar-brand" href="dashboard.html">Task Manager</a>
                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        <div class="collapse navbar-collapse" id="mainNav">
                            <ul class="navbar-nav nav-pills gap-2 ms-lg-4 me-auto mb-3 mb-lg-0">
                                <li class="nav-item"><a class="nav-link ${activePage === "dashboard" ? "active" : ""}" href="dashboard.html">Dashboard</a></li>
                                <li class="nav-item"><a class="nav-link ${activePage === "projects" ? "active" : ""}" href="projects.html">Projects</a></li>
                                <li class="nav-item ${isAdmin ? "" : "d-none"}"><a class="nav-link ${activePage === "admin" ? "active" : ""}" href="admin.html">Admin</a></li>
                            </ul>
                            <div class="d-flex align-items-center gap-3 text-white">
                                <div class="small text-end">
                                    <div class="fw-semibold">${escapeHtml(user.full_name)}</div>
                                    <div class="text-white-50">${escapeHtml(user.role)}</div>
                                </div>
                                <button id="logout-btn" class="btn btn-outline-light btn-sm" type="button">Logout</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            const logoutButton = document.getElementById("logout-btn");
            if (logoutButton) {
                logoutButton.addEventListener("click", logout);
            }
        }

        return user;
    }

    function badgeForStatus(value, kind = "task") {
        const map = kind === "project"
            ? {
                active: "text-bg-primary",
                on_hold: "text-bg-warning text-dark",
                completed: "text-bg-success",
                archived: "text-bg-secondary",
            }
            : {
                todo: "text-bg-secondary",
                in_progress: "text-bg-warning text-dark",
                done: "text-bg-success",
                blocked: "text-bg-danger",
            };
        return `<span class="badge rounded-pill ${map[value] || "text-bg-secondary"}">${escapeHtml(value || "-")}</span>`;
    }

    function badgeForPriority(value) {
        const map = {
            low: "text-bg-info",
            medium: "text-bg-secondary",
            high: "text-bg-warning text-dark",
            critical: "text-bg-danger",
        };
        return `<span class="badge rounded-pill ${map[value] || "text-bg-secondary"}">${escapeHtml(value || "-")}</span>`;
    }

    function formatDate(value) {
        if (!value) {
            return "-";
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }
        return date.toLocaleString();
    }

    function formatShortDate(value) {
        if (!value) {
            return "-";
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }
        return date.toLocaleDateString();
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getQueryId() {
        const value = new URLSearchParams(window.location.search).get("id");
        return value ? Number(value) : null;
    }

    function extractErrorMessage(errorData) {
        if (!errorData) {
            return "";
        }
        if (typeof errorData === "string") {
            return errorData;
        }
        if (errorData.detail) {
            return typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail);
        }
        if (errorData.error) {
            return errorData.error;
        }
        if (errorData.message) {
            return errorData.message;
        }
        return "";
    }

    function safeJsonParse(value) {
        try {
            return JSON.parse(value);
        } catch (_error) {
            return { raw: value };
        }
    }

    window.TaskApp = {
        apiFetch,
        badgeForPriority,
        badgeForStatus,
        clearSession,
        ensureAuthenticated,
        escapeHtml,
        extractErrorMessage,
        formatDate,
        formatShortDate,
        getBaseUrl,
        getCurrentUser,
        getQueryId,
        hasAccessToken,
        initAppShell,
        logout,
        rawFetch,
        setBaseUrl,
        setSession,
        showToast,
    };
})();
