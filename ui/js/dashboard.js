document.addEventListener("DOMContentLoaded", async () => {
    try {
        const user = await TaskApp.initAppShell("dashboard");
        if (!user) {
            return;
        }
        document.getElementById("dashboard-base-url").textContent = TaskApp.getBaseUrl();
        bindDashboardEvents();
        await Promise.all([loadDashboardStats(), loadHealth(), loadApiKeys()]);
    } catch (error) {
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Failed to load dashboard.", "error");
    }
});

function bindDashboardEvents() {
    document.getElementById("refresh-health-btn").addEventListener("click", loadHealth);
    document.getElementById("refresh-api-keys-btn").addEventListener("click", loadApiKeys);
    document.getElementById("api-key-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        try {
            const response = await TaskApp.apiFetch("/auth/api-keys", {
                method: "POST",
                body: JSON.stringify({ name: formData.get("name") }),
            });
            const panel = document.getElementById("new-api-key-panel");
            panel.classList.remove("d-none");
            panel.innerHTML = `
                <div class="small text-secondary mb-1">Copy this now. It will not be shown again.</div>
                <div class="fw-semibold">${TaskApp.escapeHtml(response.name)}</div>
                <code class="text-break">${TaskApp.escapeHtml(response.key)}</code>
            `;
            form.reset();
            await loadApiKeys();
            TaskApp.showToast("API key created.", "success");
        } catch (error) {
            TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not create API key.", "error");
        }
    });
}

async function loadDashboardStats() {
    const projects = await TaskApp.apiFetch("/projects");
    const taskLists = await Promise.all(projects.map((project) =>
        TaskApp.apiFetch(`/projects/${project.id}/tasks`).catch(() => [])
    ));

    const tasks = taskLists.flat().map((task) => {
        const project = projects.find((item) => item.id === task.project_id);
        return { ...task, project_title: project ? project.title : `Project ${task.project_id}` };
    });

    document.getElementById("metric-projects").textContent = String(projects.length);
    document.getElementById("metric-tasks").textContent = String(tasks.length);
    document.getElementById("metric-progress").textContent = String(tasks.filter((task) => task.status === "in_progress").length);
    document.getElementById("metric-done").textContent = String(tasks.filter((task) => task.status === "done").length);

    const tbody = document.getElementById("recent-task-body");
    const empty = document.getElementById("recent-task-empty");
    tbody.innerHTML = "";

    const recentTasks = tasks
        .slice()
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 5);

    if (!recentTasks.length) {
        empty.classList.remove("d-none");
        return;
    }

    empty.classList.add("d-none");
    recentTasks.forEach((task) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><a href="task.html?id=${task.id}" class="fw-semibold text-decoration-none">${TaskApp.escapeHtml(task.title)}</a></td>
            <td>${TaskApp.escapeHtml(task.project_title)}</td>
            <td>${TaskApp.badgeForStatus(task.status)}</td>
            <td>${TaskApp.badgeForPriority(task.priority)}</td>
            <td>${TaskApp.formatDate(task.updated_at)}</td>
        `;
        tbody.appendChild(row);
    });
}

async function loadHealth() {
    try {
        const health = await TaskApp.rawFetch("/health");
        document.getElementById("health-panel").innerHTML = `
            <div class="fw-semibold mb-1">${TaskApp.escapeHtml(health.status)}</div>
            <div class="small text-secondary">Version ${TaskApp.escapeHtml(health.version)}</div>
            <div class="small text-secondary">${TaskApp.escapeHtml(health.timestamp)}</div>
        `;
    } catch (error) {
        document.getElementById("health-panel").textContent = TaskApp.extractErrorMessage(error.data || error) || "Could not load health.";
    }
}

async function loadApiKeys() {
    const wrapper = document.getElementById("api-key-list");
    wrapper.innerHTML = "";

    try {
        const keys = await TaskApp.apiFetch("/auth/api-keys");
        if (!keys.length) {
            wrapper.innerHTML = '<div class="empty-state py-3">No API keys yet.</div>';
            return;
        }

        keys.forEach((key) => {
            const card = document.createElement("div");
            card.className = "surface-subtle";
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <div class="fw-semibold">${TaskApp.escapeHtml(key.name)}</div>
                        <div class="small text-secondary">Created ${TaskApp.formatDate(key.created_at)}</div>
                        <div class="small text-secondary">Last used ${TaskApp.formatDate(key.last_used_at)}</div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" type="button">Revoke</button>
                </div>
            `;
            card.querySelector("button").addEventListener("click", async () => {
                const confirmed = window.confirm(`Revoke API key "${key.name}"?`);
                if (!confirmed) {
                    return;
                }
                try {
                    await TaskApp.apiFetch(`/auth/api-keys/${key.id}`, { method: "DELETE" });
                    TaskApp.showToast("API key revoked.", "success");
                    await loadApiKeys();
                } catch (error) {
                    TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not revoke API key.", "error");
                }
            });
            wrapper.appendChild(card);
        });
    } catch (error) {
        wrapper.innerHTML = `<div class="empty-state py-3">${TaskApp.escapeHtml(TaskApp.extractErrorMessage(error.data || error) || "Could not load API keys.")}</div>`;
    }
}
