document.addEventListener("DOMContentLoaded", () => {
    const page = window.location.pathname.split("/").pop() || "index.html";

    if (page === "index.html" || page === "") {
        setupLoginPage();
    } else if (page === "register.html") {
        setupRegisterPage();
    }
});

function setupLoginPage() {
    const loginForm = document.getElementById("login-form");
    const settingsForm = document.getElementById("settings-form");
    const baseUrlInput = document.getElementById("base-url");

    if (TaskApp.hasAccessToken()) {
        window.location.href = "dashboard.html";
        return;
    }

    baseUrlInput.value = TaskApp.getBaseUrl();

    settingsForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(settingsForm);
        TaskApp.setBaseUrl(formData.get("baseUrl"));
        TaskApp.showToast("Backend URL saved.", "info");
    });

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(loginForm);
        const payload = new URLSearchParams();
        payload.set("username", String(formData.get("email")));
        payload.set("password", String(formData.get("password")));

        try {
            const response = await TaskApp.rawFetch("/auth/login", {
                method: "POST",
                body: payload,
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            TaskApp.setSession(response);
            TaskApp.showToast("Login successful.", "success");
            window.location.href = "dashboard.html";
        } catch (error) {
            TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Login failed.", "error");
        }
    });
}

function setupRegisterPage() {
    const registerForm = document.getElementById("register-form");
    const baseUrlInput = document.getElementById("register-base-url");

    baseUrlInput.value = TaskApp.getBaseUrl();

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(registerForm);
        TaskApp.setBaseUrl(formData.get("baseUrl"));

        const password = String(formData.get("password"));
        const confirmPassword = String(formData.get("confirm_password"));
        if (password !== confirmPassword) {
            TaskApp.showToast("Passwords do not match.", "error");
            return;
        }

        try {
            await TaskApp.rawFetch("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    full_name: formData.get("full_name"),
                    email: formData.get("email"),
                    password,
                }),
            });
            TaskApp.showToast("Account created. Please sign in.", "success");
            window.setTimeout(() => {
                window.location.href = "index.html";
            }, 900);
        } catch (error) {
            TaskApp.showToast(TaskApp.extractErrorMessage(error.data || error) || "Registration failed.", "error");
        }
    });
}
