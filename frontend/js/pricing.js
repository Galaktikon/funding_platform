// Config: set to your backend endpoint that creates Stripe Checkout sessions
const API_BASE = "https://eml-funding-platform.onrender.com"; // <— replace when needed

document.addEventListener("DOMContentLoaded", () => {
  // UI elements
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");
  const toggleBtns = Array.from(document.querySelectorAll(".toggle-btn"));
  const chooseBtns = Array.from(document.querySelectorAll(".btn-choose"));
  const yearSpan = document.getElementById("year");

  // Set current year in footer
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // NAV: hamburger toggle for mobile
  hamburger && hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  // Billing mode: default to yearly if a toggle button has .active, else monthly
  function getMode() {
    const active = document.querySelector(".toggle-btn.active");
    return active ? active.dataset.mode : "yearly";
  }

  // Toggle behavior
  toggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      toggleBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      // Update price labels on the cards
      updatePrices(getMode());
    });
  });

  // Update price display helper
  function updatePrices(mode) {
    const priceEls = document.querySelectorAll(".price-amount");
    priceEls.forEach(el => {
      const m = el.dataset.priceMonthly;
      const y = el.dataset.priceYearly;
      if (!m && !y) {
        // keep as text (e.g., "Free")
        return;
      }
      if (mode === "monthly") {
        if (parseFloat(m) === 0) el.textContent = "Free";
        else el.textContent = `$${m}`;
        const period = el.nextElementSibling;
        if (period) period.textContent = " / month";
      } else {
        if (parseFloat(y) === 0) el.textContent = "Free";
        else el.textContent = `$${y}`;
        const period = el.nextElementSibling;
        if (period) period.textContent = " / year";
      }
    });
  }

  // Initialize prices
  updatePrices(getMode());

  // Create checkout session handler
  async function createCheckoutSession({ priceId, mode, planName }) {
    if (!priceId) {
      alert("This plan isn't configured yet. Contact the team.");
      return;
    }

    try {
      // Call your backend to create a Checkout session
      const res = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          mode, // 'monthly' or 'yearly' (backend can use to determine price or quantity)
          // success/cancel urls — to be handled by your backend or passed here
          success_url: `${window.location.origin}/pricing-success.html`,
          cancel_url: `${window.location.origin}/pricing.html`,
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Failed to create checkout session");
      }

      // Redirect user to Stripe Checkout
      window.location.href = json.url;
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to start checkout: " + (err.message || err));
    }
  }

  // Wire up "Choose" buttons
  chooseBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = getMode();
      // Grab correct price ID for selected billing mode
      const priceId = mode === "monthly" ? btn.dataset.priceIdMonthly : btn.dataset.priceIdYearly;
      const plan = btn.dataset.plan || "plan";
      createCheckoutSession({ priceId, mode, planName: plan });
    });
  });

  // Highlight pricing nav
  const pricingNav = document.getElementById("pricing-nav");
  if (pricingNav) pricingNav.classList.add("active");
});
