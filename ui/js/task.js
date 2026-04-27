let currentTask = null;
let currentProject = null;
let currentUser = null;
let allTags = [];

document.addEventListener("DOMContentLoaded", async () => {
    try {
        currentUser = await TaskApp.initAppShell("projects");
        if (!currentUser) {
            return;
        }

        const taskId = TaskApp.getQueryId();
        if (!taskId) {
            TaskApp.showToast("Missing task id.", "error");
            window.location.href = "projects.html";
            return;
        }

        bindTaskEvents(taskId);
        await loadTaskPage(taskId);
    } catch (error) {
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not load task.", "error");
    }
});

function bindTaskEvents(taskId) {
    document.getElementById("task-status-form").addEventListener("submit", (event) => quickUpdateStatus(event, taskId));
    document.getElementById("task-update-form").addEventListener("submit", (event) => updateTask(event, taskId));
    document.getElementById("comment-form").addEventListener("submit", (event) => createComment(event, taskId));
    document.getElementById("refresh-comments-btn").addEventListener("click", () => loadComments(taskId));
    document.getElementById("refresh-tags-btn").addEventListener("click", () => loadTags(taskId));
    document.getElementById("attach-tag-form").addEventListener("submit", (event) => attachTag(event, taskId));
    document.getElementById("delete-task-btn").addEventListener("click", () => deleteTask(taskId));
}

async function loadTaskPage(taskId) {
    await loadTask(taskId);
    await Promise.all([loadComments(taskId), loadTags(taskId)]);
}

async function loadTask(taskId) {
    currentTask = await TaskApp.apiFetch(`/tasks/${taskId}`);
    currentProject = await TaskApp.apiFetch(`/projects/${currentTask.project_id}`);

    document.getElementById("task-title-display").textContent = currentTask.title;
    document.getElementById("task-description-display").textContent = currentTask.description || "No description provided.";
    document.getElementById("task-project-name").textContent = currentProject.title;
    document.getElementById("task-assignee-display").textContent = currentTask.assignee_id ? `User #${currentTask.assignee_id}` : "Unassigned";
    document.getElementById("task-due-display").textContent = TaskApp.formatShortDate(currentTask.due_date);
    document.getElementById("task-created-display").textContent = TaskApp.formatDate(currentTask.created_at);
    document.getElementById("task-status-select").value = currentTask.status;

    document.getElementById("edit-task-title").value = currentTask.title;
    document.getElementById("edit-task-description").value = currentTask.description || "";
    document.getElementById("edit-task-priority").value = currentTask.priority;
    document.getElementById("edit-task-due-date").value = currentTask.due_date || "";

    document.getElementById("back-to-project-link").href = `project.html?id=${currentTask.project_id}`;
    document.getElementById("back-to-project-link").textContent = `<- Back to ${currentProject.title}`;
    document.getElementById("task-badges").innerHTML = `
        ${TaskApp.badgeForStatus(currentTask.status)}
        ${TaskApp.badgeForPriority(currentTask.priority)}
    `;
}

async function quickUpdateStatus(event, taskId) {
    event.preventDefault();
    const status = document.getElementById("task-status-select").value;
    try {
        await TaskApp.apiFetch(`/tasks/${taskId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        });
        TaskApp.showToast("Task status updated.", "success");
        await loadTask(taskId);
    } catch (error) {
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not update status.", "error");
    }
}

async function updateTask(event, taskId) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
        await TaskApp.apiFetch(`/tasks/${taskId}`, {
            method: "PUT",
            body: JSON.stringify({
                title: formData.get("title"),
                description: formData.get("description") || null,
                status: currentTask.status,
                priority: formData.get("priority"),
                assignee_id: currentTask.assignee_id,
                due_date: formData.get("due_date") || null,
            }),
        });
        TaskApp.showToast("Task updated.", "success");
        await loadTask(taskId);
    } catch (error) {
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not update task.", "error");
    }
}

async function deleteTask(taskId) {
    const confirmed = window.confirm(`Delete task "${currentTask ? currentTask.title : taskId}"?`);
    if (!confirmed) {
        return;
    }
    try {
        await TaskApp.apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
        TaskApp.showToast("Task deleted.", "success");
        window.location.href = `project.html?id=${currentTask.project_id}`;
    } catch (error) {
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not delete task.", "error");
    }
}

async function loadComments(taskId) {
    const list = document.getElementById("comment-list");
    const empty = document.getElementById("comment-empty");
    list.innerHTML = "";

    try {
        const comments = await TaskApp.apiFetch(`/tasks/${taskId}/comments`);
        if (!comments.length) {
            empty.classList.remove("d-none");
            return;
        }
        empty.classList.add("d-none");

        comments
            .slice()
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .forEach((comment) => list.appendChild(buildCommentCard(comment)));
    } catch (error) {
        empty.classList.remove("d-none");
        empty.textContent = TaskApp.extractErrorMessage(error.data || error) || "Could not load comments.";
    }
}

function buildCommentCard(comment) {
    const card = document.createElement("article");
    card.className = "comment-card";
    const canManage = currentUser && (currentUser.id === comment.author_id || currentUser.role === "admin");

    card.innerHTML = `
        <div class="d-flex justify-content-between gap-3">
            <div>
                <div class="fw-semibold mb-1">Author #${TaskApp.escapeHtml(comment.author_id)}</div>
                <div class="comment-meta">${TaskApp.formatDate(comment.created_at)}</div>
            </div>
            <div class="${canManage ? "" : "d-none"} btn-group btn-group-sm">
                <button class="btn btn-outline-secondary" type="button" data-action="edit">Edit</button>
                <button class="btn btn-outline-danger" type="button" data-action="delete">Delete</button>
            </div>
        </div>
        <p class="mb-0 mt-3">${TaskApp.escapeHtml(comment.body)}</p>
    `;

    if (canManage) {
        card.querySelector('[data-action="edit"]').addEventListener("click", async () => {
            if (currentUser.id !== comment.author_id) {
                TaskApp.showToast("Only the author can edit a comment in this backend.", "info");
                return;
            }
            const body = window.prompt("Edit comment", comment.body);
            if (!body || body === comment.body) {
                return;
            }
            try {
                await TaskApp.apiFetch(`/comments/${comment.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ body }),
                });
                TaskApp.showToast("Comment updated.", "success");
                await loadComments(currentTask.id);
            } catch (error) {
                TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not update comment.", "error");
            }
        });

        card.querySelector('[data-action="delete"]').addEventListener("click", async () => {
            const confirmed = window.confirm("Delete this comment?");
            if (!confirmed) {
                return;
            }
            try {
                await TaskApp.apiFetch(`/comments/${comment.id}`, { method: "DELETE" });
                TaskApp.showToast("Comment deleted.", "success");
                await loadComments(currentTask.id);
            } catch (error) {
                TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not delete comment.", "error");
            }
        });
    }

    return card;
}

async function createComment(event, taskId) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
        await TaskApp.apiFetch(`/tasks/${taskId}/comments`, {
            method: "POST",
            body: JSON.stringify({ body: formData.get("body") }),
        });
        form.reset();
        TaskApp.showToast("Comment added.", "success");
        await loadComments(taskId);
    } catch (error) {
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not add comment.", "error");
    }
}

async function loadTags(taskId) {
    const tagList = document.getElementById("task-tag-list");
    const availableSelect = document.getElementById("available-tag-select");
    tagList.innerHTML = "";
    availableSelect.innerHTML = "";

    try {
        allTags = await TaskApp.apiFetch("/tags");
        if (!allTags.length) {
            tagList.innerHTML = '<div class="empty-state py-3 w-100">No tags have been created yet.</div>';
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No available tags";
            availableSelect.appendChild(option);
            return;
        }

        tagList.innerHTML = '<div class="empty-state py-3 w-100">The backend does not return attached tags on task detail, so this screen offers attach and detach actions against the shared tag catalog.</div>';
        allTags.forEach((tag) => {
            const option = document.createElement("option");
            option.value = String(tag.id);
            option.textContent = `${tag.name} (${tag.colour})`;
            availableSelect.appendChild(option);
            tagList.appendChild(buildTagActionRow(tag, taskId));
        });
    } catch (error) {
        tagList.innerHTML = `<div class="empty-state py-3 w-100">${TaskApp.escapeHtml(TaskApp.extractErrorMessage(error.data || error) || "Could not load tags.")}</div>`;
    }
}

function buildTagActionRow(tag, taskId) {
    const row = document.createElement("div");
    row.className = "surface-subtle d-flex justify-content-between align-items-center gap-3";
    row.innerHTML = `
        <div class="d-flex align-items-center gap-2">
            <span class="tag-chip" style="background-color:${TaskApp.escapeHtml(tag.colour)}">${TaskApp.escapeHtml(tag.name)}</span>
            <span class="small text-secondary">${TaskApp.escapeHtml(tag.colour)}</span>
        </div>
        <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" type="button" data-mode="attach">Attach</button>
            <button class="btn btn-outline-secondary" type="button" data-mode="detach">Detach</button>
        </div>
    `;

    row.querySelector('[data-mode="attach"]').addEventListener("click", async () => {
        try {
            await TaskApp.apiFetch(`/tasks/${taskId}/tags/${tag.id}`, { method: "POST" });
            TaskApp.showToast(`Attach attempted for ${tag.name}.`, "success");
        } catch (error) {
            TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not attach tag.", "error");
        }
    });

    row.querySelector('[data-mode="detach"]').addEventListener("click", async () => {
        try {
            await TaskApp.apiFetch(`/tasks/${taskId}/tags/${tag.id}`, { method: "DELETE" });
            TaskApp.showToast(`Detach attempted for ${tag.name}.`, "success");
        } catch (error) {
            TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not detach tag.", "error");
        }
    });

    return row;
}

async function attachTag(event, taskId) {
    event.preventDefault();
    const tagId = document.getElementById("available-tag-select").value;
    if (!tagId) {
        return;
    }
    try {
        await TaskApp.apiFetch(`/tasks/${taskId}/tags/${tagId}`, { method: "POST" });
        TaskApp.showToast("Tag attached.", "success");
    } catch (error) {
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not attach tag.", "error");
    }
}
