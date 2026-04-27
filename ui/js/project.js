let currentProject = null;
let currentTasks = [];
let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        currentUser = await TaskApp.initAppShell("projects");
        if (!currentUser) {
            return;
        }
        const projectId = TaskApp.getQueryId();
        if (!projectId) {
            TaskApp.showToast("Missing project id.", "error");
            window.location.href = "projects.html";
            return;
        }

        bindProjectDetailEvents(projectId);
        await loadProjectPage(projectId);
    } catch (error) {
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not load project.", "error");
    }
});

function bindProjectDetailEvents(projectId) {
    document.getElementById("refresh-tasks-btn").addEventListener("click", () => loadTasks(projectId));
    document.getElementById("project-update-form").addEventListener("submit", (event) => updateProject(event, projectId));
    document.getElementById("task-form").addEventListener("submit", (event) => createTask(event, projectId));
    document.getElementById("delete-project-btn").addEventListener("click", () => deleteProject(projectId));
}

async function loadProjectPage(projectId) {
    await loadProject(projectId);
    await Promise.all([loadTasks(projectId), maybeLoadAssignees()]);
}

async function loadProject(projectId) {
    currentProject = await TaskApp.apiFetch(`/projects/${projectId}`);
    document.getElementById("project-title-display").textContent = currentProject.title;
    document.getElementById("project-description-display").textContent = currentProject.description || "No description yet.";
    document.getElementById("project-status-badge").innerHTML = TaskApp.badgeForStatus(currentProject.status, "project");
    document.getElementById("project-meta-line").textContent = `Created ${TaskApp.formatDate(currentProject.created_at)}`;

    document.getElementById("edit-project-title").value = currentProject.title;
    document.getElementById("edit-project-description").value = currentProject.description || "";
    document.getElementById("edit-project-status").value = currentProject.status;
}

async function maybeLoadAssignees() {
    if (!currentUser || currentUser.role !== "admin") {
        return;
    }

    const wrap = document.getElementById("assignee-field-wrap");
    const select = document.getElementById("task-assignee");
    wrap.classList.remove("d-none");
    select.innerHTML = '<option value="">Unassigned</option>';

    try {
        const users = await TaskApp.apiFetch("/users");
        users.forEach((user) => {
            const option = document.createElement("option");
            option.value = String(user.id);
            option.textContent = `${user.full_name} (${user.email})`;
            select.appendChild(option);
        });
    } catch (error) {
        wrap.classList.add("d-none");
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not load assignees.", "error");
    }
}

async function updateProject(event, projectId) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
        await TaskApp.apiFetch(`/projects/${projectId}`, {
            method: "PUT",
            body: JSON.stringify({
                title: formData.get("title"),
                description: formData.get("description") || null,
                status: formData.get("status"),
            }),
        });
        TaskApp.showToast("Project updated.", "success");
        await loadProject(projectId);
    } catch (error) {
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not update project.", "error");
    }
}

async function deleteProject(projectId) {
    const confirmed = window.confirm(`Delete project "${currentProject ? currentProject.title : projectId}"?`);
    if (!confirmed) {
        return;
    }
    try {
        await TaskApp.apiFetch(`/projects/${projectId}`, { method: "DELETE" });
        TaskApp.showToast("Project deleted.", "success");
        window.location.href = "projects.html";
    } catch (error) {
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not delete project.", "error");
    }
}

async function createTask(event, projectId) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
        title: formData.get("title"),
        description: formData.get("description") || null,
        status: formData.get("status"),
        priority: formData.get("priority"),
        due_date: formData.get("due_date") || null,
    };

    const assigneeValue = formData.get("assignee_id");
    if (currentUser && currentUser.role === "admin" && assigneeValue) {
        payload.assignee_id = Number(assigneeValue);
    }

    try {
        await TaskApp.apiFetch(`/projects/${projectId}/tasks`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
        form.reset();
        document.getElementById("task-status").value = "todo";
        document.getElementById("task-priority").value = "medium";
        TaskApp.showToast("Task created.", "success");
        await loadTasks(projectId);
    } catch (error) {
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not create task.", "error");
    }
}

async function loadTasks(projectId) {
    const tbody = document.getElementById("task-table-body");
    const empty = document.getElementById("task-empty");
    tbody.innerHTML = "";

    try {
        currentTasks = await TaskApp.apiFetch(`/projects/${projectId}/tasks`);
        if (!currentTasks.length) {
            empty.classList.remove("d-none");
            return;
        }

        empty.classList.add("d-none");
        currentTasks.forEach((task) => tbody.appendChild(buildTaskRow(task)));
    } catch (error) {
        empty.classList.remove("d-none");
        empty.textContent = TaskApp.extractErrorMessage(error.data || error) || "Could not load tasks.";
    }
}

function buildTaskRow(task) {
    const row = document.createElement("tr");
    const statusOptions = ["todo", "in_progress", "done", "blocked"]
        .map((status) => `<option value="${status}" ${status === task.status ? "selected" : ""}>${status}</option>`)
        .join("");

    row.innerHTML = `
        <td>
            <a href="task.html?id=${task.id}" class="fw-semibold text-decoration-none">${TaskApp.escapeHtml(task.title)}</a>
            <div class="small text-secondary mt-1">${TaskApp.escapeHtml(task.description || "No description")}</div>
        </td>
        <td><select class="form-select form-select-sm">${statusOptions}</select></td>
        <td>${TaskApp.badgeForPriority(task.priority)}</td>
        <td>${TaskApp.formatShortDate(task.due_date)}</td>
        <td class="text-end">
            <div class="btn-group btn-group-sm">
                <a class="btn btn-outline-primary" href="task.html?id=${task.id}">Open</a>
                <button class="btn btn-outline-danger" type="button">Delete</button>
            </div>
        </td>
    `;

    row.querySelector("select").addEventListener("change", async (event) => {
        try {
            await TaskApp.apiFetch(`/tasks/${task.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: event.currentTarget.value }),
            });
            TaskApp.showToast("Task status updated.", "success");
            await loadTasks(task.project_id);
        } catch (error) {
            TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not update task status.", "error");
            event.currentTarget.value = task.status;
        }
    });

    row.querySelector("button").addEventListener("click", async () => {
        const confirmed = window.confirm(`Delete task "${task.title}"?`);
        if (!confirmed) {
            return;
        }
        try {
            await TaskApp.apiFetch(`/tasks/${task.id}`, { method: "DELETE" });
            TaskApp.showToast("Task deleted.", "success");
            await loadTasks(task.project_id);
        } catch (error) {
            TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not delete task.", "error");
        }
    });

    return row;
}
