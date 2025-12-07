const API_BASE_URL = "https://eml-funding-platform.onrender.com";

// Supabase config
const SUPABASE_URL = "https://dxrfvvkhestqjhhrqdnu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cmZ2dmtoZXN0cWpoaHJxZG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDk5MzYsImV4cCI6MjA4MDYyNTkzNn0.GYfLDPkq00aqrLv_BKDffVmuWgqszrGcYg8k0JYIUik";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

document.addEventListener("DOMContentLoaded", () => {
  /* DOM elements */
  const authContainer = document.getElementById("auth");
  const openAuth = document.getElementById("open-auth");
  const heroAuth = document.getElementById("hero-signup");

  const authTitle = document.getElementById("auth-title");
  const authBtn = document.getElementById("auth-btn");
  const switchAuth = document.getElementById("switch-auth");

  const homeContainer = document.getElementById("home");
  const homeNav = document.getElementById("home-nav");

  const nameField = document.getElementById("nameField");
  const authForm = document.getElementById("auth-form");

  let mode = "signin";

  /************************************************************
   * Backend helper
   ************************************************************/
  async function getAuthHeaders(fileUpload = false) {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw new Error("Auth error: " + error.message);

    var token = data?.session?.access_token;
    if (!token) {
        token = "guest-token";
        console.log("User is not logged in")
        //throw new Error("User is not logged in");
    }

    if (fileUpload) {
      return { Authorization: `Bearer ${token}` };
    }

    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }

  async function callBackend(endpoint, fileUpload, { method = "GET", body = null } = {}) {
    const headers = await getAuthHeaders(fileUpload);
    const opts = { method, headers };

    if (body instanceof FormData) {
      delete opts.headers["Content-Type"];
      opts.body = body;
    } else if (body) {
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, opts);
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("Backend error:", res.status, json);
      throw new Error(json?.detail || json?.message || "Request failed");
    }

    return json;
  }

  /************************************************************
   * Signup & Login handlers
   ************************************************************/
  async function signup(email, password, fullName) {
    try {
      return await callBackend("/auth/signup", false, {
        method: "POST",
        body: { email, password, fullName }
      });
    } catch (err) {
      console.error("Signup failed:", err);
      alert(err.message);
      throw err;
    }
  }

  async function login(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Login failed:", err);
      alert(err.message);
      throw err;
    }
  }

  /************************************************************
   * Mode switching
   ************************************************************/
  function updateAuthMode() {
    if (mode === "signin") {
      authTitle.textContent = "Sign In";
      authBtn.textContent = "Login";
      nameField.style.display = "none";
      switchAuth.textContent = "Don't have an account? Sign Up";
    } else {
      authTitle.textContent = "Create Your Account";
      authBtn.textContent = "Create Account";
      nameField.style.display = "block";
      switchAuth.textContent = "Already have an account? Sign In";
    }
  }

  switchAuth.onclick = () => {
    mode = mode === "signin" ? "signup" : "signin";
    updateAuthMode();
  };

  updateAuthMode();

  /************************************************************
   * Form Submission (MAIN PART)
   ************************************************************/
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(authForm);
    const email = formData.get("email");
    const password = formData.get("password");
    const fullName = formData.get("fullName");

    try {
        if (mode === "signup") {
        await signup(email, password, fullName);
        alert("Account created! Please log in.");
        mode = "signin";
        updateAuthMode();
        } else {
        await login(email, password);
        alert("Logged in successfully!");
        window.location.href = "../pages/dashboard.html"
        }
    } catch (err) {
        console.error(err);
    }
  });

  /************************************************************
   * Navigation
   ************************************************************/
    const hamburger = document.createElement("span");
    hamburger.id = "hamburger";
    hamburger.innerHTML = "☰";
    document.querySelector("header").appendChild(hamburger);

    const navLinks = document.getElementById("nav-links");
    hamburger.onclick = () => {
      navLinks.classList.toggle("active");

    };

  openAuth.onclick = () => {
    homeContainer.style.display = "none";
    authContainer.style.display = "block";
  };

  heroAuth.onclick = () => {
    mode = "signup";
    updateAuthMode();
    homeContainer.style.display = "none";
    authContainer.style.display = "block";
  };

  homeNav.onclick = () => {
    homeContainer.style.display = "block";
    authContainer.style.display = "none";
    mode = "signin";
    updateAuthMode();
  };
});
