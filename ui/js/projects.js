document.addEventListener("DOMContentLoaded", async () => {
    try {
        const user = await TaskApp.initAppShell("projects");
        if (!user) {
            return;
        }
        bindProjectPageEvents();
        await loadProjects();
    } catch (error) {
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not load projects.", "error");
    }
});

function bindProjectPageEvents() {
    document.getElementById("project-form").addEventListener("submit", createProject);
    document.getElementById("refresh-projects-btn").addEventListener("click", loadProjects);
    document.getElementById("project-status-filter").addEventListener("change", loadProjects);
}

async function createProject(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
        await TaskApp.apiFetch("/projects", {
            method: "POST",
            body: JSON.stringify({
                title: formData.get("title"),
                description: formData.get("description") || null,
                status: formData.get("status"),
            }),
        });
        form.reset();
        document.getElementById("project-status").value = "active";
        TaskApp.showToast("Project created.", "success");
        await loadProjects();
    } catch (error) {
        TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not create project.", "error");
    }
}

async function loadProjects() {
    const filter = document.getElementById("project-status-filter").value;
    const path = filter ? `/projects?status=${encodeURIComponent(filter)}` : "/projects";
    const tbody = document.getElementById("project-table-body");
    const empty = document.getElementById("project-empty");

    tbody.innerHTML = "";

    try {
        const projects = await TaskApp.apiFetch(path);
        if (!projects.length) {
            empty.classList.remove("d-none");
            return;
        }
        empty.classList.add("d-none");

        projects.forEach((project) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <a href="project.html?id=${project.id}" class="fw-semibold text-decoration-none">${TaskApp.escapeHtml(project.title)}</a>
                    <div class="small text-secondary mt-1">${TaskApp.escapeHtml(project.description || "No description")}</div>
                </td>
                <td>${TaskApp.badgeForStatus(project.status, "project")}</td>
                <td>${TaskApp.formatDate(project.created_at)}</td>
                <td class="text-end">
                    <div class="btn-group btn-group-sm">
                        <a href="project.html?id=${project.id}" class="btn btn-outline-primary">Open</a>
                        <button class="btn btn-outline-danger" type="button">Delete</button>
                    </div>
                </td>
            `;
            row.querySelector("button").addEventListener("click", async () => {
                const confirmed = window.confirm(`Delete project "${project.title}"?`);
                if (!confirmed) {
                    return;
                }
                try {
                    await TaskApp.apiFetch(`/projects/${project.id}`, { method: "DELETE" });
                    TaskApp.showToast("Project deleted.", "success");
                    row.remove();
                    if (!tbody.children.length) {
                        empty.classList.remove("d-none");
                    }
                } catch (error) {
                    TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Could not delete project.", "error");
                }
            });
            tbody.appendChild(row);
        });
    } catch (error) {
        empty.classList.remove("d-none");
        empty.textContent = TaskApp.extractErrorMessage(error.data || error) || "Could not load projects.";
    }
}
