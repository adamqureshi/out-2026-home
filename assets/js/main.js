(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Footer year
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav
  const navToggle = $(".nav-toggle");
  const nav = $("#primary-nav");
  const navPanel = nav ? $(".nav__panel", nav) : null;

  const setNavOpen = (open) => {
    document.body.classList.toggle("nav-open", open);
    if (navToggle) navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      // focus first link
      const first = navPanel ? $(".nav__link", navPanel) : null;
      if (first) first.focus();
    } else if (navToggle) {
      navToggle.focus();
    }
  };

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => setNavOpen(!document.body.classList.contains("nav-open")));
    $$("[data-nav-close]", nav).forEach((el) => el.addEventListener("click", () => setNavOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setNavOpen(false);
    });

    // Close on nav click (mobile)
    $$(".nav__link", nav).forEach((a) => {
      a.addEventListener("click", () => setNavOpen(false));
    });
  }

  // Auth modal (home page)
  const authModal = $("#authModal");
  const openAuthBtns = $$("[data-open-auth]");
  const closeAuthBtns = $$("[data-close-auth]");

  const openAuth = () => {
    if (!authModal) return;
    authModal.hidden = false;
    document.body.classList.add("modal-open");
    const google = $("[data-auth-google]", authModal);
    if (google) google.focus();
  };

  const closeAuth = () => {
    if (!authModal) return;
    authModal.hidden = true;
    document.body.classList.remove("modal-open");
  };

  openAuthBtns.forEach((btn) => btn.addEventListener("click", (e) => {
    e.preventDefault();
    openAuth();
  }));

  closeAuthBtns.forEach((btn) => btn.addEventListener("click", (e) => {
    e.preventDefault();
    closeAuth();
  }));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAuth();
  });

  // Chat open/close is handled in chat.js, but we provide triggers here
  const chatOpenBtns = $$("[data-open-chat]");
  chatOpenBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      window.OUT_CHAT && window.OUT_CHAT.open && window.OUT_CHAT.open();
    });
  });
})();
