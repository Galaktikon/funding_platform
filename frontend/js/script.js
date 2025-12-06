const API_BASE_URL = "https://eml-funding-platform.onrender.com";

// Supabase Configuration (public anon key is OK in frontend)
const SUPABASE_URL = "https://dxrfvvkhestqjhhrqdnu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cmZ2dmtoZXN0cWpoaHJxZG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDk5MzYsImV4cCI6MjA4MDYyNTkzNn0.GYfLDPkq00aqrLv_BKDffVmuWgqszrGcYg8k0JYIUik";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/************************************************************
 * Main script
 ************************************************************/

document.addEventListener("DOMContentLoaded", async () => {
    /* =======================================================
    *  DOM ELEMENTS
    * ======================================================= */

    // High-level sections for auth gating
    const auth = document.getElementById('auth');
    const openAuth = document.getElementById('open-auth');
    const heroAuth = document.getElementById('hero-signup');

    const authTitle = document.getElementById('auth-title');
    const authBtn = document.getElementById('auth-btn');
    const switchAuth = document.getElementById('switch-auth');
    const nameField = document.getElementById('nameField');

    const home = document.getElementById('home');
    const homeNav = document.getElementById('home-nav');

    const priceNav = document.getElementById('price-nav');

    let mode = 'signin';

    /**
     * Get Authorization headers for talking to the FastAPI backend.
     */
    async function getAuthHeaders(f) {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) {
            console.error("Error getting session:", error);
            throw new Error("Could not get auth session");
        }
        const token = data?.session?.access_token;
        if (!token) {
            throw new Error("No active auth token; user is not logged in");
        }
        if (f) {
            return {
                Authorization: `Bearer ${token}`,
            };
        } else {
            return {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            };
        }
    }

    /**
     * Generic helper to call your FastAPI backend with auth.
     */
    async function callBackend(endpoint, f, { method = "GET", body = null } = {}) {
        const headers = await getAuthHeaders(f);

        const opts = { method, headers };

        if (body instanceof FormData) {
            // Remove content-type if getAuthHeaders added it
            if (opts.headers["Content-Type"]) {
                delete opts.headers["Content-Type"];
            }
            opts.body = body;  // send FormData as-is
        } else if (body != null) {
            opts.headers["Content-Type"] = "application/json";
            opts.body = JSON.stringify(body);
        }

        const res = await fetch(`${API_BASE_URL}${endpoint}`, opts);

        let json;
        try {
            json = await res.json();
        } catch (e) {
            const text = await res.text();
            throw new Error(
                `Backend ${endpoint} returned non-JSON. Status ${res.status}. Body: ${text}`
            );
        }

        if (!res.ok) {
            console.error(`Backend error on ${endpoint}:`, res.status, json);
            throw new Error(
                `Backend ${endpoint} failed with status ${res.status}: ${
                json.detail || json.message || JSON.stringify(json)
                }`
            );
        }

        return { json, res };
    }

    openAuth.onclick = () => {
        home.style.display = 'none';
        auth.style.display = 'block';
        window.scrollTo(0, auth.offsetTop - 20);
    }

    homeNav.onclick = () => {
        mode = 'signin';
        updateAuthMode();

        home.style.display = 'block';
        auth.style.display = 'none';
    }

    heroAuth.onclick = () => {
        mode = 'signup';
        updateAuthMode();

        home.style.display = 'none';
        auth.style.display = 'block';
        window.scrollTo(0, auth.offsetTop - 20);
    }

    function updateAuthMode() {
        if (mode === 'signin') {
            authTitle.textContent = 'Sign In';
            authBtn.textContent = 'Login';
            nameField.style.display = 'none';
            switchAuth.textContent = "Don't have an account? Sign Up";
        } else {
            authTitle.textContent = 'Create Your Account';
            authBtn.textContent = 'Create Account';
            nameField.style.display = 'block';
            switchAuth.textContent = "Already have an account? Sign In";
        }
    }

    switchAuth.onclick = () => {
        mode = mode === 'signin' ? 'signup' : 'signin';
        updateAuthMode();
    }

    updateAuthMode();
    

});



