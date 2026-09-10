
// ===================== HELPERS =====================
import { AppState, toggleFavorite } from "./state.js";
import { t, localizedName } from "./i18n.js";

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function _isRegisteredStudent() {
  return !!AppState.studentUser && AppState.studentUser.is_guest === false;
}

/** Real href only for signed-in students, so guests cannot read the URL from the browser status bar. */
function _linkHref(url) {
  return _isRegisteredStudent() ? esc(url) : "#";
}

// ===================== THEME =====================
// Theme + language preferences live in prefs.js (system/light/dark, eng/fr/ar).

// ===================== MOBILE =====================
function toggleMobileMenu() {
  document.getElementById("hamburgerBtn").classList.toggle("open");
  document.getElementById("navLinks").classList.toggle("mobile-open");
}
function toggleFilters() {
  document.getElementById("filterToggleBtn").classList.toggle("open");
  document.getElementById("filtersCollapsible").classList.toggle("open");
}

const MOBILE_MQ = "(max-width: 768px)";

function isMobileView() {
  return window.matchMedia(MOBILE_MQ).matches;
}

function adminTd(label, inner, extraAttrs = "") {
  return `<td data-label="${esc(label)}"${extraAttrs}>${inner}</td>`;
}

function adminCell(role, label, inner) {
  return `<td class="${role}" data-label="${esc(label)}">${inner}</td>`;
}

/** Clamp-friendly body text for admin inbox tables (feedback / reports / contributions). */
function adminLongText(text, { empty = "—" } = {}) {
  const raw = String(text ?? "").trim();
  if (!raw) {
    return `<span class="admin-long-text is-empty">${esc(empty)}</span>`;
  }
  return `<div class="admin-long-text" title="${esc(raw)}">${esc(raw)}</div>`;
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("nav-btn")) {
    document.getElementById("hamburgerBtn").classList.remove("open");
    document.getElementById("navLinks").classList.remove("mobile-open");
  }
});

// ===================== KEYBOARD SHORTCUT =====================
document.addEventListener("keydown", (e) => {
  // "/" or Ctrl+K → focus search (only on home view)
  const tag = document.activeElement.tagName;
  const isTyping =
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  if (isTyping) return;
  if (e.key === "/" || (e.ctrlKey && e.key === "k")) {
    e.preventDefault();
    const search = document.getElementById("searchInput");
    if (search) {
      window.showView("home");
      search.focus();
      search.select();
    }
  }
  // Escape → close modal
  if (e.key === "Escape") window.closeModal?.();
});

// ===================== BADGE =====================
function getLinkBadge(type) {
  if (type === "telegram") return '<span class="link-badge badge-tg">TG</span>';
  if (type === "drive") return '<span class="link-badge badge-drive">GD</span>';
  if (type === "classroom")
    return '<span class="link-badge badge-classroom">GC</span>';
  return '<span class="link-badge badge-other">OT</span>';
}

// ===================== CONTENT TYPE CHIP =====================
const CONTENT_TYPE_META = {
  td: { key: "ct_td", emoji: "✏️", cls: "ct-td" },
  cours: { key: "ct_cours", emoji: "📄", cls: "ct-cours" },
  videos: { key: "ct_videos", emoji: "🎬", cls: "ct-videos" },
  sessions: { key: "ct_sessions", emoji: "🎤", cls: "ct-sessions" },
  exams: { key: "ct_exams", emoji: "📝", cls: "ct-exams" },
  other: { key: "ct_other", emoji: "📦", cls: "ct-other" },
};

/**
 * Render content-type chips. Accepts a comma-separated string (e.g. "td,cours")
 * or a single value. Returns wrapped HTML for consistent layout.
 */
function getLanguageChips(languages) {
  const langs = Array.isArray(languages) ? languages : [];
  if (!langs.length) return "";
  const labels = { ar: "AR", fr: "FR", en: "EN" };
  return `<span class="lang-chips">${langs
    .map((l) => `<span class="lang-chip">${esc(labels[l] || String(l).toUpperCase())}</span>`)
    .join("")}</span>`;
}

function getContentTypeChips(contentType) {
  if (!contentType) return "";
  const types = String(contentType).split(",").map(t => t.trim()).filter(Boolean);
  if (!types.length) return "";
  const chips = types.map((type) => {
    const meta = CONTENT_TYPE_META[type];
    if (!meta) return "";
    const label = t(meta.key);
    return `<span class="content-chip ${meta.cls}" title="${esc(label)}">${meta.emoji} ${esc(label)}</span>`;
  }).filter(Boolean).join("");
  if (!chips) return "";
  return `<span class="content-chips-wrap">${chips}</span>`;
}
// Backward compat alias
function getContentTypeChip(ct) { return getContentTypeChips(ct); }

// ===================== COURSE CARD BUILDER =====================
/**
 * Builds the HTML string for a single course card.
 * Used by both renderCourses (filtered) and renderAllCourses (all).
 * opts.path is shown under the course code (faculty · campus · …).
 */
/** One entry per favorite course id, even when the course is offered in several programs. */
function collectFavoriteCourses(query = "") {
  const q = query.toLowerCase().trim();
  const favIds = AppState.favorites;
  const byId = new Map();
  AppState.dbPrograms.forEach((prog) => {
    prog.years.forEach((year) => {
      year.sems.forEach((sem) => {
        (sem.courses || []).forEach((c) => {
          if (!favIds.has(String(c.id))) return;
          if (
            q &&
            !c.name.toLowerCase().includes(q) &&
            !c.code.toLowerCase().includes(q)
          ) {
            return;
          }
          const path = `${localizedName(prog)} · ${year.name} · ${sem.name}`;
          const existing = byId.get(c.id);
          if (existing) {
            if (!existing.paths.includes(path)) existing.paths.push(path);
            return;
          }
          byId.set(c.id, { course: c, paths: [path] });
        });
      });
    });
  });
  return [...byId.values()];
}

function _buildCourseCard(c, opts = {}) {
  const isFav = AppState.favorites.has(String(c.id));
  const path = opts.path || "";
  const links = Array.isArray(c.links) ? c.links : [];
  const linksHtml = links.length
    ? links
      .map(
        (l) => `
            <a class="link-item"
               data-url="${esc(l.url)}"
               data-link-id="${l.id}"
               data-link-kind="link"
               href="${_linkHref(l.url)}">
              <span class="link-item-main">
                ${getLinkBadge(l.type)}
                <span class="link-label-with-langs">
                  <span class="link-label">${esc(l.label)}</span>
                  ${getLanguageChips(l.languages)}
                </span>
                ${l.note ? `<span class="link-note">${esc(l.note)}</span>` : ""}
                <button class="copy-btn" title="${esc(t("copy_link"))}"
                  aria-label="${esc(t("copy_link"))}">⎘</button>
              </span>
              ${getContentTypeChips(l.content_type)}
            </a>`,
      )
      .join("")
    : `<span class="no-links">${esc(t("no_links_yet"))}</span>`;

  return `
    <div class="course-card" id="course-card-${c.id}">
      <div class="course-header">
        <h2 class="course-name">${esc(c.name)}</h2>
        <div class="course-header-side">
          <div class="course-header-tags">
            ${c.is_optional ? `<span class="optional-tag">${esc(t("optional_tag"))}</span>` : ""}
            <h3 class="course-code">${esc(c.code)}</h3>
          </div>
          <button class="fav-btn ${isFav ? "active" : ""}"
            title="${esc(isFav ? t("fav_remove") : t("fav_add"))}"
            onclick="handleFavoriteToggle(${c.id})"
            aria-label="${esc(t("fav_aria"))}">★</button>
        </div>
      </div>
      ${path ? `<div class="course-path">${esc(path)}</div>` : ""}
      <div class="links-list">${linksHtml}</div>
    </div>`;
}

const TELEGRAM_CONTRIBUTE_URL = "https://t.me/LU_Links_Contributing_Guide";

function hintLink(url, label) {
  return `<a class="hint-link" href="${_linkHref(url)}" data-url="${esc(url)}">${esc(label)}</a>`;
}

function FAVORITES_HINT() {
  return t("tip_fav_body");
}

function CONTRIBUTE_HINT() {
  return t("tip_contrib_body").replace(
    "{{link}}",
    hintLink(TELEGRAM_CONTRIBUTE_URL, t("tip_contrib_link_label")),
  );
}

function linkTypesLegendHtml() {
  return `
    <div class="hint-link-types">
      <span class="hint-legend-item">${getLinkBadge("telegram")} ${esc(t("link_type_telegram"))}</span>
      <span class="hint-legend-item">${getLinkBadge("drive")} ${esc(t("link_type_drive"))}</span>
      <span class="hint-legend-item">${getLinkBadge("classroom")} ${esc(t("link_type_classroom"))}</span>
      <span class="hint-legend-item">${getLinkBadge("other")} ${esc(t("tip_legend_other"))}</span>
      <span class="hint-legend-item"><span class="optional-tag">${esc(t("optional_tag"))}</span> ${esc(t("tip_legend_optional"))}</span>
    </div>`;
}

function hintCardHtml(title, bodyHtml, extraClass = "") {
  const classes = ["fav-hint", extraClass].filter(Boolean).join(" ");
  return `<div class="${classes}"><div class="fav-hint-title">${esc(title)}</div><div class="fav-hint-body">${bodyHtml}</div></div>`;
}

function FAVORITES_HINT_CARD() {
  return hintCardHtml(t("tip_fav_title"), FAVORITES_HINT());
}

function CONTRIBUTE_HINT_CARD() {
  return hintCardHtml(t("tip_contrib_title"), CONTRIBUTE_HINT());
}

function LINK_TYPES_HINT_CARD() {
  return hintCardHtml(t("tip_types_title"), linkTypesLegendHtml(), "fav-hint--link-types");
}

function tipsSectionHtml() {
  return `
    <div class="tips-section">
      ${FAVORITES_HINT_CARD()}
      ${CONTRIBUTE_HINT_CARD()}
      ${LINK_TYPES_HINT_CARD()}
    </div>`;
}

function homeSectionHeading(title) {
  return `<h2 class="home-section-title">${title}</h2>`;
}

function sectionInlineHintHtml(bodyHtml) {
  return `<div class="section-inline-hint">${bodyHtml}</div>`;
}

function setSectionHint(html) {
  const el = document.getElementById("sectionHint");
  if (!el) return;
  if (!html) {
    el.hidden = true;
    el.replaceChildren();
    return;
  }
  el.innerHTML = html;
  el.hidden = false;
}

// ===================== FAVORITES =====================
function _paintFavorite(courseId) {
  if (AppState.currentProg === "favorites") {
    window.renderCourses();
    return;
  }
  const btn = document.querySelector(`#course-card-${courseId} .fav-btn`);
  if (btn) {
    const isFav = AppState.favorites.has(String(courseId));
    btn.classList.toggle("active", isFav);
    btn.title = isFav ? t("fav_remove") : t("fav_add");
  }
}

/** Optimistic star toggle; the server is the source of truth so failures roll back. */
async function handleFavoriteToggle(courseId) {
  const retry = () => handleFavoriteToggle(courseId);
  if (!window.requireStudent(retry)) return;

  const added = !AppState.favorites.has(String(courseId));
  toggleFavorite(courseId);
  _paintFavorite(courseId);

  try {
    await window.syncFavorite(courseId, added);
  } catch (err) {
    toggleFavorite(courseId);
    _paintFavorite(courseId);
    if (window.handleStudentAuthError?.(err, retry)) return;
    window.logApiError?.(err, "syncFavorite");
    window.showToast(
      window.formatApiError?.(err, t("toast_fav_save_fail")) ||
      t("toast_fav_save_fail"),
      true,
    );
  }
}

// ===================== COPY LINK =====================
function copyLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    window.showToast(t("toast_link_copied"));
  }).catch(() => {
    window.showToast(t("toast_copy_failed"), true);
  });
}

// ===================== LOADING STATES =====================
/**
 * Toggle a button's loading state.
 * @param {HTMLButtonElement} btn
 * @param {boolean} loading
 * @param {string} [loadingText]
 */
function setBtnLoading(btn, loading, loadingText = "…") {
  if (!btn) return;
  if (loading) {
    btn.dataset.origText = btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;
    btn.classList.add("btn-loading");
  } else {
    btn.textContent = btn.dataset.origText || btn.textContent;
    btn.disabled = false;
    btn.classList.remove("btn-loading");
  }
}

window.toggleMobileMenu = toggleMobileMenu;
window.toggleFilters = toggleFilters;
window.copyLink = copyLink;
window.setBtnLoading = setBtnLoading;
window.esc = esc;
window.handleFavoriteToggle = handleFavoriteToggle;
window.isMobileView = isMobileView;

export {
  esc,
  _buildCourseCard,
  getLinkBadge,
  getContentTypeChips,
  getLanguageChips,
  getContentTypeChip,
  setBtnLoading,
  toggleMobileMenu,
  toggleFilters,
  copyLink,
  handleFavoriteToggle,
  _linkHref,
  isMobileView,
  adminTd,
  adminCell,
  adminLongText,
  FAVORITES_HINT,
  FAVORITES_HINT_CARD,
  collectFavoriteCourses,
  setSectionHint,
  tipsSectionHtml,
  homeSectionHeading,
  sectionInlineHintHtml,
};
