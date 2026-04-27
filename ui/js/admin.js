document.addEventListener("DOMContentLoaded", async () => {
    try {
        const user = await TaskApp.initAppShell("admin");
        if (!user) {
            return;
        }
        if (user.role !== "admin") {
            TaskApp.showToast("Admin access required.", "error");
            window.location.href = "dashboard.html";
            return;
        }

        bindAdminEvents();
        await Promise.all([loadStats(), loadUsers(), loadAdminTags()]);
    } catch (error) {
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not load admin panel.", "error");
    }
});

function bindAdminEvents() {
    document.getElementById("refresh-users-btn").addEventListener("click", loadUsers);
    document.getElementById("refresh-admin-tags-btn").addEventListener("click", loadAdminTags);
}

async function loadStats() {
    const stats = await TaskApp.apiFetch("/stats");
    document.getElementById("admin-total-users").textContent = String(stats.total_users);
    document.getElementById("admin-total-projects").textContent = String(stats.total_projects);
    document.getElementById("admin-total-tasks").textContent = String(stats.total_tasks);
    document.getElementById("admin-total-statuses").textContent = String(Object.keys(stats.tasks_by_status || {}).length);

    const breakdown = document.getElementById("status-breakdown");
    breakdown.innerHTML = "";
    Object.entries(stats.tasks_by_status || {}).forEach(([status, count]) => {
        const item = document.createElement("div");
        item.className = "surface-subtle d-flex justify-content-between align-items-center";
        item.innerHTML = `<span>${TaskApp.badgeForStatus(status)}</span><strong>${count}</strong>`;
        breakdown.appendChild(item);
    });
}

async function loadUsers() {
    const tbody = document.getElementById("admin-user-body");
    tbody.innerHTML = "";

    const users = await TaskApp.apiFetch("/users");
    users.forEach((user) => {
        const row = document.createElement("tr");
        const roleOptions = ["user", "admin"]
            .map((role) => `<option value="${role}" ${role === user.role ? "selected" : ""}>${role}</option>`)
            .join("");

        row.innerHTML = `
            <td>${user.id}</td>
            <td>${TaskApp.escapeHtml(user.full_name)}</td>
            <td>${TaskApp.escapeHtml(user.email)}</td>
            <td><select class="form-select form-select-sm">${roleOptions}</select></td>
            <td>${user.is_active ? '<span class="badge text-bg-success">active</span>' : '<span class="badge text-bg-secondary">inactive</span>'}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-danger" type="button">Deactivate</button>
            </td>
        `;

        row.querySelector("select").addEventListener("change", async (event) => {
            try {
                await TaskApp.apiFetch(`/users/${user.id}/role`, {
                    method: "PATCH",
                    body: JSON.stringify({ role: event.currentTarget.value }),
                });
                TaskApp.showToast("User role updated.", "success");
                await loadUsers();
            } catch (error) {
                TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not update role.", "error");
            }
        });

        row.querySelector("button").addEventListener("click", async () => {
            const confirmed = window.confirm(`Deactivate ${user.full_name}?`);
            if (!confirmed) {
                return;
            }
            try {
                await TaskApp.apiFetch(`/users/${user.id}`, { method: "DELETE" });
                TaskApp.showToast("User deactivated.", "success");
                await loadUsers();
            } catch (error) {
                TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not deactivate user.", "error");
            }
        });

        tbody.appendChild(row);
    });
}

async function loadAdminTags() {
    const wrapper = document.getElementById("admin-tag-list");
    wrapper.innerHTML = "";
    const tags = await TaskApp.apiFetch("/tags");

    if (!tags.length) {
        wrapper.innerHTML = '<div class="empty-state py-3">No tags available.</div>';
        return;
    }

    tags.forEach((tag) => {
        const row = document.createElement("div");
        row.className = "surface-subtle d-flex justify-content-between align-items-center gap-3";
        row.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <span class="tag-chip" style="background-color:${TaskApp.escapeHtml(tag.colour)}">${TaskApp.escapeHtml(tag.name)}</span>
                <span class="small text-secondary">${TaskApp.escapeHtml(tag.colour)}</span>
            </div>
            <button class="btn btn-sm btn-outline-danger" type="button">Delete</button>
        `;
        row.querySelector("button").addEventListener("click", async () => {
            const confirmed = window.confirm(`Delete tag "${tag.name}"?`);
            if (!confirmed) {
                return;
            }
            try {
                await TaskApp.apiFetch(`/tags/${tag.id}`, { method: "DELETE" });
                TaskApp.showToast("Tag deleted.", "success");
                await loadAdminTags();
            } catch (error) {
                TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not delete tag.", "error");
            }
        });
        wrapper.appendChild(row);
    });
}
