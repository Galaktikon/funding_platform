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
    console.log(session);
    const res = await fetch(`${API_URL}/auth/me`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: session.access_token }),
    });
    console.log(res)
    const json = await res.json();
    return json.role;
  } catch (err) {
    return null;
  }
}

/* -------------------------------------------
   UI Init
------------------------------------------- */
async function initDashboard() {
  const role = await getUserRole();

  if (!role) {
    //window.location.href = "../index.html";
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
function setupSidebar(role) {
  const menu = document.getElementById("sidebarMenu");
  menu.innerHTML = "";

  if (role === "admin") {
    menu.innerHTML = `
      <li data-view="admin-users">Users</li>
      <li data-view="admin-review">Review Applications</li>
      <li data-view="admin-documents">Documents</li>
    `;
  } else {
    menu.innerHTML = `
      <li data-view="profile">Profile</li>
      <li data-view="status">Application Status</li>
      <li data-view="documents">Documents</li>
      <li data-view="notifications">Notifications</li>
      <li data-view="messages">Messages</li>
    `;
  }
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
  document.querySelector("#usersTable tbody").innerHTML =
    "<tr><td colspan='4'>Loading users...</td></tr>";
}

/* LOGOUT */
document.getElementById("logoutBtn").onclick = async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "../index.html";
};

/* INIT */
initDashboard();
