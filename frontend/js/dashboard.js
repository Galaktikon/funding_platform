const SUPABASE_URL = "https://dxrfvvkhestqjhhrqdnu.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cmZ2dmtoZXN0cWpoaHJxZG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDk5MzYsImV4cCI6MjA4MDYyNTkzNn0.GYfLDPkq00aqrLv_BKDffVmuWgqszrGcYg8k0JYIUik";

const API_URL = "https://eml-funding-platform.onrender.com";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* ---------------------------------------
    Onboarding slides
---------------------------------------- */
const userSlides = [
  {
    id: "welcome",
    title: "Welcome to Funding Profile",
    content: `
      <p>Welcome! We'll walk you through a quick setup to get your funding profile ready.</p>
      <p>This will help you access funding faster and keep your documents organized.</p>
    `,
  },
  {
    id: "profile",
    title: "Tell Us About You",
    content: `
      <p>Please enter your basic profile info so we can personalize your experience.</p>
      <label class="onb-label">Full name</label>
      <input id="onb_fullname" class="onb-input" type="text" placeholder="Jane Doe" />
      <label class="onb-label">Phone (optional)</label>
      <input id="onb_phone" class="onb-input" type="tel" placeholder="(555) 555-5555" />
      <div class="onb-note">We will save these to your account profile as you proceed.</div>
    `,
    beforeNext: async () => {
      // save profile inputs
      const fullName = document.getElementById("onb_fullname")?.value?.trim();
      const phone = document.getElementById("onb_phone")?.value?.trim();
      if (!fullName) {
        // warn user but still allow — optional change: require name
        return { ok: false, message: "Please enter your full name to continue." };
      }
      try {
        const session = await supabaseClient.auth.getSession();
        const userId = session?.data?.session?.user?.id;
        if (!userId) throw new Error("Not authenticated");

        // Upsert to 'users' table (adapt to your actual table if different)
        await supabaseClient
          .from("users")
          .upsert({ id: userId, name: fullName, phone: phone }, { onConflict: ["id"] });

        return { ok: true };
      } catch (err) {
        console.error("save profile error:", err);
        return { ok: false, message: "Failed saving profile. Try again." };
      }
    },
  },
  {
    id: "funding-tips",
    title: "Funding Tips",
    content: `
      <p>Tip: Accurate documents + consistent profile data increase approval chances.</p>
      <ul>
        <li>Keep business and personal information consistent.</li>
        <li>Upload official documents (EIN, bank statements).</li>
        <li>Use our checklist to track progress.</li>
      </ul>
      <img src="../assets/onboarding-docs.png" style="max-width:100%;border-radius:8px;margin-top:10px" alt="docs example"/>
    `,
  },
  {
    id: "finish",
    title: "You're Ready",
    content: `
      <p>Nice — you're all set. Click <strong>Finish</strong> to go to your dashboard.</p>
      <p>If you want to continue the guided setup later, your progress will be saved automatically.</p>
    `,
  },
];

const adminSlides = [
  {
    id: "admin-welcome",
    title: "Welcome, Admin",
    content: `
      <p>This admin onboarding will show you how to manage users and review applications.</p>
    `,
  },
  {
    id: "admin-users",
    title: "Manage Users",
    content: `
      <p>From the Users panel you can search, view profiles, and assign tasks.</p>
      <img src="../assets/onboarding-admin-users.png" style="max-width:100%;border-radius:8px;margin-top:10px" alt="admin users"/>
    `,
  },
  {
    id: "admin-docs",
    title: "Documents & Reviews",
    content: `
      <p>Use the Document Viewer to inspect uploads and download signed copies for records.</p>
    `,
  },
  {
    id: "admin-finish",
    title: "You're Set",
    content: `
      <p>Admin training complete. You can revisit this onboarding manually from the admin menu.</p>
    `,
  },
];


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
   Onboarding helpers: create, render, save
------------------------------------------- */

async function getOnboardingRecord(userId) {
  try {
    const { data, error } = await supabaseClient
      .from("user_onboarding")
      .select("current_slide, completed")
      .eq("user_id", userId)
      .maybeSingle();
    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows? depends on PostgREST; just log
      console.warn("getOnboardingRecord warning:", error);
    }
    return data || null;
  } catch (err) {
    console.error("getOnboardingRecord error:", err);
    return null;
  }
}

async function upsertOnboardingRecord(userId, current_slide = 0, completed = false) {
  try {
    const { data: existing, error: selectError } = await supabaseClient
      .from("user_onboarding")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 = no rows found
      throw selectError;
    }

    if (!existing) {
      // INSERT
      const { error: insertError } = await supabaseClient
        .from("user_onboarding")
        .insert({
          user_id: userId,
          current_slide,
          completed,
        });

      if (insertError) throw insertError;
    } else {
      // UPDATE
      const { error: updateError } = await supabaseClient
        .from("user_onboarding")
        .update({
          current_slide,
          completed,
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;
    }

  } catch (err) {
    console.error("upsertOnboardingRecord error:", err);
  }
}

/* Build modal DOM (returns references) */
function buildOnboardingModal() {
  // if modal exists, return references
  const existing = document.getElementById("onboardingModal");
  if (existing) {
    return {
      modal: existing,
      titleEl: existing.querySelector("#slideTitle"),
      contentEl: existing.querySelector("#slideContent"),
      prevBtn: existing.querySelector("#prevSlide"),
      nextBtn: existing.querySelector("#nextSlide"),
      closeBtn: existing.querySelector("#closeOnboarding"),
      progressFill: existing.querySelector("#progressFill"),
    };
  }

  const modal = document.createElement("div");
  modal.id = "onboardingModal";
  modal.className = "onboarding-modal";

  modal.innerHTML = `
    <div class="onboarding-container">
      <div class="onboarding-header">
        <h2 id="slideTitle"></h2>
        <button id="closeOnboarding" class="onb-close" aria-label="Close onboarding">✕</button>
      </div>
      <div class="onboarding-content" id="slideContent"></div>
      <div class="onboarding-footer">
        <button id="prevSlide" class="onb-btn onb-secondary" disabled>Back</button>
        <div style="flex:1"></div>
        <button id="nextSlide" class="onb-btn onb-primary">Next</button>
      </div>
      <div class="progress-bar onb-progress">
        <div id="progressFill" class="progress-fill"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  return {
    modal,
    titleEl: modal.querySelector("#slideTitle"),
    contentEl: modal.querySelector("#slideContent"),
    prevBtn: modal.querySelector("#prevSlide"),
    nextBtn: modal.querySelector("#nextSlide"),
    closeBtn: modal.querySelector("#closeOnboarding"),
    progressFill: modal.querySelector("#progressFill"),
  };
}

/* Main initOnboarding */
async function initOnboarding(role, startIndex = 0) {
  const session = await supabaseClient.auth.getSession();
  const userId = session?.data?.session?.user?.id;
  if (!userId) return;
  console.log("User Id", userId)

  const isAdmin = role === "admin" || role === "true" || role === true;
  const slides = isAdmin ? adminSlides : userSlides;

  // ensure onboarding record exists
  await upsertOnboardingRecord(userId, startIndex, false);

  let current = Math.min(Math.max(0, startIndex), slides.length - 1);

  const { modal, titleEl, contentEl, prevBtn, nextBtn, closeBtn, progressFill } = buildOnboardingModal();

  function render() {
    const s = slides[current];
    titleEl.innerHTML = s.title || "";
    contentEl.innerHTML = s.content || "";
    prevBtn.disabled = current === 0;
    nextBtn.textContent = current === slides.length - 1 ? "Finish" : "Next";
    progressFill.style.width = `${((current + 1) / slides.length) * 100}%`;

    // focus first input if present
    const firstInput = contentEl.querySelector("input, textarea, select, button");
    if (firstInput) firstInput.focus();
  }

  async function tryBeforeNext() {
    const s = slides[current];
    if (s.beforeNext && typeof s.beforeNext === "function") {
      // call and expect { ok: boolean, message?: string }
      try {
        const result = await s.beforeNext();
        if (!result || result.ok) return { ok: true };
        return { ok: false, message: result.message || "Validation failed" };
      } catch (err) {
        console.error("beforeNext error:", err);
        return { ok: false, message: "Failed validation" };
      }
    }
    return { ok: true };
  }

  prevBtn.onclick = async () => {
    if (current > 0) {
      current--;
      await upsertOnboardingRecord(userId, current, false);
      render();
    }
  };

  nextBtn.onclick = async () => {
    // run beforeNext if exists for current slide (e.g., save profile)
    const check = await tryBeforeNext();
    if (!check.ok) {
      alert(check.message || "Please complete this step.");
      return;
    }

    if (current < slides.length - 1) {
      current++;
      await upsertOnboardingRecord(userId, current, false);
      render();
    } else {
      // complete
      await upsertOnboardingRecord(userId, current, true);
      modal.style.display = "none";
      // optionally refresh profile UI after finishing
      try { loadUserUI(); } catch(e){ /* ignore */ }
    }
  };

  closeBtn.onclick = () => {
    // hide modal but keep progress saved
    modal.style.display = "none";
  };

  // show modal
  modal.style.display = "flex";
  render();
}

/* -------------------------------------------
   UI Init
------------------------------------------- */
async function initDashboard() {
  const role = await getUserRole();
  const overlay = document.getElementById("loadingOverlay");

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

  try {
    const session = await supabaseClient.auth.getSession();
    const userId = session?.data?.session?.user?.id;
    if (userId) {
      const record = await getOnboardingRecord(userId);
      console.log("Onborading Record: ", record)
      const currentSlide = record?.current_slide ?? 0;
      const completed = record?.completed ?? false;
      if (!completed) {
        // Start onboarding at saved progress (currentSlide)
        await initOnboarding(role, currentSlide);
      }
    }
  } catch (err) {
    console.error("onboarding check error:", err);
  }

  overlay.style.display = "none";
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

// Create loading overlay
const loadingOverlay = document.createElement("div");
loadingOverlay.id = "loadingOverlay";
loadingOverlay.style.cssText = `
  position: fixed;
  top: 0; left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255,255,255,0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

loadingOverlay.innerHTML = `
  <div style="text-align:center;">
    <p>Loading dashboard...</p>
    <div style="
      border: 4px solid #f3f3f3;
      border-top: 4px solid #555;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    "></div>
  </div>
`;

// Add spinner animation
const styleEl = document.createElement("style");
styleEl.innerHTML = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;
document.head.appendChild(styleEl);

// Attach overlay to body
document.body.appendChild(loadingOverlay);

initDashboard();
