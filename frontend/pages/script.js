function toggleNav() {
    document.querySelector('.nav-links').classList.toggle('show');
}

/* Login -------------------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
    const userStatus = document.getElementById("userStatus");
    const logoutBtn = document.getElementById("logoutBtn");

    // Simulated user session (replace this with real backend check)
    const loggedInUser = localStorage.getItem("loggedInUser");

    if (userStatus) {
        if (loggedInUser) {
            userStatus.textContent = `Logged in as ${loggedInUser}`;
            if (logoutBtn) logoutBtn.style.display = "inline-block";
        } else {
            userStatus.textContent = "Not logged in";
            if (logoutBtn) logoutBtn.style.display = "none";
        }
    }

    // For testing: simulate login when submitting login form
    const loginForm = document.querySelector(".auth-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = loginForm.querySelector("input[type='text']").value;
            localStorage.setItem("loggedInUser", username);
            window.location.href = "dashboard.html"; // redirect after login
        });
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("loggedInUser");
            window.location.href = "login.html";
        });
    }
});
