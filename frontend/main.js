import "./js/state.js";
import "./js/cache.js";
import "./js/supabase.js";
import "./js/skeleton.js";
import "./js/i18n.js";
import { initPreferences } from "./js/prefs.js";
import "./js/ui.js";
import "./js/hierarchy-picker.js";
import "./js/home.js";
import "./js/mobile-home.js";
import "./js/data.js";
import "./js/feedback.js";
import "./js/suggestions.js";
import "./js/export.js";
import "./js/admin.js";
import "./js/views.js";
import "./js/modals.js";
import "./js/session.js";
import { initWebMCP } from "./js/webmcp.js";

initPreferences();

function updateFooterYear() {
  const el = document.getElementById("footerYear");
  if (!el) return;
  const start = 2026;
  const now = new Date().getFullYear();
  el.textContent = now > start ? `${start} – ${now}` : String(start);
}
updateFooterYear();

// --- EVENT ROUTER (Professional Event Delegation) ---
document.addEventListener("click", (e) => {
  const target = e.target;

  // Copy-link button (must run before the link-item handler below)
  const copyBtn = target.closest(".copy-btn");
  if (copyBtn) {
    e.preventDefault();
    e.stopPropagation();
    const copyUrl = copyBtn.closest("[data-url]")?.dataset.url;
    const copy = () => {
      if (copyUrl) window.copyLink(copyUrl);
    };
    if (window.requireStudent(copy)) copy();
    return;
  }

  const hintLink = target.closest(".hint-link");
  if (hintLink) {
    e.preventDefault();
    const url = hintLink.dataset.url || hintLink.getAttribute("href");
    const openLink = () => window.confirmLink(null, url, "link");
    if (window.requireStudent(openLink)) openLink();
    return;
  }

  // Expand/collapse course links (lazy paint of link rows).
  if (!target.closest(".fav-btn, .link-item, .copy-btn")) {
    const header = target.closest("[data-toggle-course]");
    if (header) {
      e.preventDefault();
      window.toggleCourseCard?.(header.dataset.toggleCourse);
      return;
    }
  }

  const footerExternal = target.closest(".footer-external-link");
  if (footerExternal) {
    e.preventDefault();
    const url = footerExternal.getAttribute("href");
    if (url) window.confirmLink(null, url, "link");
    return;
  }

  // External link item → confirmation modal (URL read from dataset, never inline JS)
  // Opening a link is gated: the signup modal replaces the confirmation popup
  // until the visitor is a registered student.
  const linkItem = target.closest(".link-item");
  if (linkItem) {
    e.preventDefault();
    const idAttr = linkItem.dataset.linkId;
    const linkId = idAttr ? parseInt(idAttr, 10) : null;
    const linkKind = linkItem.dataset.linkKind || "link";
    const url = linkItem.dataset.url || null;
    const openLink = () => window.confirmLink(linkId, url, linkKind);
    if (window.requireStudent(openLink)) openLink();
    return;
  }

  if (!target.closest(".fav-btn, .copy-btn, .hint-link")) {
    const courseHeader = target.closest("[data-toggle-course]");
    if (courseHeader) {
      e.preventDefault();
      window.toggleCourseCard?.(courseHeader.dataset.toggleCourse);
      return;
    }
  }

  const view = target.closest("[data-view]")?.dataset.view;
  if (view) {
    window.showView(view);
    return;
  }

  const action = target.closest("[data-action]")?.dataset.action;
  if (action) {
    switch (action) {
      case "toggleMobileMenu":
        window.toggleMobileMenu();
        break;
      case "toggleTheme":
        window.toggleTheme();
        break;
      case "cycleLang":
        window.cycleLang();
        break;
      case "toggleFilters":
        window.toggleFilters();
        break;
      case "submitReport":
        window.submitReport();
        break;
      case "submitContribution":
        window.submitContribution();
        break;
      case "submitFeedback":
        window.submitFeedback();
        break;
      case "submitSuggestion":
        window.submitSuggestion();
        break;
      case "logout":
        window.logout();
        break;
      case "checkLogin":
        window.checkLogin();
        break;
      case "openAddCourseModal":
        window.openAddCourseModal();
        break;
      case "openAddExtraSectionModal":
        window.openAddExtraSectionModal();
        break;
      case "exportData":
        window.exportData();
        break;
      case "studentSignIn":
        window.promptStudentAuth();
        break;
      case "studentSignOut":
        window.signOutStudent();
        break;
    }
    return;
  }

  const adminTabName = target.closest("[data-admin-tab]")?.dataset.adminTab;
  if (adminTabName) {
    window.adminTab(adminTabName);
    return;
  }

  const rating = target.closest("[data-rating]")?.dataset.rating;
  if (rating) {
    window.setRating(parseInt(rating, 10));
    return;
  }
});

document.addEventListener("input", (e) => {
  if (e.target.id === "searchInput") {
    window.onSearch();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "adminPass") {
    e.preventDefault();
    window.checkLogin();
  }
});

document.addEventListener("mouseover", (e) => {
  const rating = e.target.closest("[data-rating]")?.dataset.rating;
  if (rating) window.handleStarHover(parseInt(rating, 10));
});
document.addEventListener("mouseout", (e) => {
  if (e.target.closest("[data-rating]")) window.clearStarHover();
});

async function init() {
  // Register WebMCP tools as early as possible so agent scanners see them on load.
  const webmcp = initWebMCP().catch((err) => {
    console.warn("WebMCP registration skipped:", err);
  });
  try {
    await window.initApp();
  } catch (err) {
    console.error("Critical: App initialization failed:", err);
  }
  await webmcp;
}

window.addEventListener("DOMContentLoaded", init);
