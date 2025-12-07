const SUPABASE_URL = "https://dxrfvvkhestqjhhrqdnu.supabase.co";
const SUPABASE_ANON = "YOUR_PUBLIC_KEY";

const API_URL = "https://eml-funding-platform.onrender.com";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* -------------------------------------------
   Get Auth
------------------------------------------- */
async function getSession() {
  const { data } = await supabaseClient.auth.getSession();
  return data?.session || null;
}

async function getUserRole() {
  try {
    const session = await getSession();
    if (!session) return null;

    const res = await fetch(`${API_URL}/auth/me`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: session.access_token }),
    });

    const json = await res.json();
    return json.role;
  } catch (err) {
    console.error(err);
    return null;
  }
}

/* -------------------------------------------
   UI Init
------------------------------------------- */
const hamburger = document.createElement("span");
hamburger.id = "hamburger";
hamburger.innerHTML = "☰";
document.querySelector("header").appendChild(hamburger);

const navLinks = document.querySelector("header nav ul");
hamburger.onclick = () => {
  if (navLinks.style.display === "flex") {
    navLinks.style.display = "none";
  } else {
    navLinks.style.display = "flex";
  }
};

async function initDashboard() {
  const role = await getUserRole();

  if (!role) {
    window.location.href = "../index.html";
    return;
  }

  if (role === "true") {
    document.getElementById("adminDashboard").style.display = "block";
    document.getElementById("userDashboard").style.display = "none";
    loadAdminUI();
  } else {
    document.getElementById("userDashboard").style.display = "block";
    document.getElementById("adminDashboard").style.display = "none";
    loadUserUI();
  }

  setupSidebar(role);
}

/* -------------------------------------------
   Sidebar Build
------------------------------------------- */
// Add toggle button to top nav
const sidebarToggle = document.createElement("button");
sidebarToggle.textContent = "☰";
sidebarToggle.style.fontSize = "20px";
sidebarToggle.classList.add("sidebar-toggle");
document.querySelector(".top-nav").appendChild(sidebarToggle);

const sidebar = document.querySelector(".sidebar");
const overlay = document.createElement("div");
overlay.id = "sidebar-overlay";
document.body.appendChild(overlay);

sidebarToggle.onclick = () => {
  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");
};

overlay.onclick = () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
};

function setupSidebar(role) {
  const menu = document.getElementById("sidebarMenu");
  menu.innerHTML = "";

  const items = role === "true"
    ? [
        { name: "Users", view: "admin-users" },
        { name: "Review Applications", view: "admin-review" },
        { name: "Documents", view: "admin-documents" }
      ]
    : [
        { name: "Profile", view: "profile" },
        { name: "Application Status", view: "status" },
        { name: "Documents", view: "documents" },
        { name: "Notifications", view: "notifications" },
        { name: "Messages", view: "messages" }
      ];

  items.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item.name;
    li.dataset.view = item.view;
    li.addEventListener("click", () => {
      // Highlight active
      menu.querySelectorAll("li").forEach(li => li.classList.remove("active"));
      li.classList.add("active");
    });
    menu.appendChild(li);
  });
}

/* -------------------------------------------
   User Dashboard UI
------------------------------------------- */
function loadUserUI() {
  document.getElementById("profileEmail").textContent = "Loading...";
  document.getElementById("profileName").textContent = "Loading...";
}

/* -------------------------------------------
   Admin Dashboard UI
------------------------------------------- */
function loadAdminUI() {
  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML = "<tr><td colspan='4'>Loading users...</td></tr>";
  // TODO: Fetch all users and populate table
}

/* LOGOUT */
document.getElementById("logoutBtn").onclick = async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "../index.html";
};

/* INIT */
initDashboard();
