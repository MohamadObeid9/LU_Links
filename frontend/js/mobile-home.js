import { AppState } from "./state.js";
import {
  esc,
  isMobileView,
  _buildCourseCard,
  getLinkBadge,
  getContentTypeChips,
  _linkHref,
  collectFavoriteCourses,
  setSectionHint,
  tipsSectionHtml,
  homeSectionHeading,
  FAVORITES_HINT_CARD,
} from "./ui.js";
import { t, localizedName } from "./i18n.js";

const MOBILE_MQ = "(max-width: 768px)";

function coerceId(raw) {
  if (raw === "extra" || raw === "favorites" || raw === "all" || raw === "tips") return raw;
  const n = Number(raw);
  return Number.isFinite(n) && String(n) === String(raw) ? n : raw;
}

function idsEqual(a, b) {
  return String(a) === String(b);
}

function isRealProgram(id) {
  return id != null && id !== "all" && id !== "extra" && id !== "favorites" && id !== "tips";
}

function searchQuery() {
  return document.getElementById("searchInput")?.value.toLowerCase().trim() || "";
}

function findProgram(id) {
  return AppState.dbPrograms.find((p) => idsEqual(p.id, id));
}

function hideExtra() {
  const extra = document.getElementById("extraSection");
  const courses = document.getElementById("coursesOutput");
  if (extra) extra.style.display = "none";
  if (courses) courses.style.display = "";
}

function showExtraOnly() {
  const extra = document.getElementById("extraSection");
  const courses = document.getElementById("coursesOutput");
  if (courses) courses.style.display = "none";
  if (extra) extra.style.display = "";
}

/** @param {Array<string|{label:string, crumb?:string}>} entries */
function chipsHtml(entries, changeBackStep) {
  const chips = entries
    .map((e) => {
      const label = typeof e === "string" ? e : e.label;
      const crumb = typeof e === "string" ? changeBackStep : e.crumb || changeBackStep;
      return `<button type="button" class="mobile-chip" data-mobile-back="${esc(crumb)}">${esc(label)}</button>`;
    })
    .join("");
  return `
    <div class="mobile-chips">
      ${chips}
      <button type="button" class="mobile-chip-change" data-mobile-back="${esc(changeBackStep)}">${esc(t("mobile_change"))}</button>
    </div>`;
}

function extraMatches(q) {
  if (!q) return [];
  return AppState.dbExtra.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.links.some((l) => l.label.toLowerCase().includes(q)),
  );
}

function extraCardsHtml(sections) {
  return sections
    .map(
      (r) => `
        <div class="extra-section">
          <div class="extra-title"><span>${esc(r.icon)}</span>${esc(r.title)}</div>
          <div class="links-list">
            ${r.links.length
          ? r.links
            .map(
              (l) => `
              <a class="link-item"
                 data-url="${esc(l.url)}"
                 data-link-id="${l.id}"
                 data-link-kind="extra_link"
                 href="${_linkHref(l.url)}">
                <span class="link-item-main">
                  ${getLinkBadge(l.type)}
                  <span class="link-label">${esc(l.label)}</span>
                  ${l.note ? `<span class="link-note">${esc(l.note)}</span>` : ""}
                  <button class="copy-btn" title="${esc(t("copy_link"))}"
                    aria-label="${esc(t("copy_link"))}">⎘</button>
                </span>
                ${getContentTypeChips(l.content_type)}
              </a>`,
            )
            .join("")
          : `<span class="no-links">${esc(t("no_links_yet"))}</span>`}
          </div>
        </div>`,
    )
    .join("");
}

async function renderMobileSearch(q) {
  hideExtra();
  setSectionHint("");
  const out = document.getElementById("coursesOutput");
  out.innerHTML =
    `<div class="loader"><div class="spinner"></div> ${esc(t("searching"))}</div>`;
  try {
    const rows = window.searchCourses ? await window.searchCourses(q, 50) : [];
    // Ignore stale results if the query changed while awaiting.
    const still =
      (document.getElementById("searchInput")?.value || "").trim() === q;
    if (!still) return;

    const extras = extraMatches(q.toLowerCase());
    const courseCountKey = rows.length === 1 ? "mobile_courses_one" : "mobile_courses_many";
    let html = `<div class="mobile-section-label">${esc(t(courseCountKey, { n: rows.length }))}</div>`;
    html += rows.length
      ? `<div class="courses-grid">${rows
          .map((c) => {
            const course = { ...c, links: Array.isArray(c.links) ? c.links : [] };
            return _buildCourseCard(course, { path: c.path || "" });
          })
          .join("")}</div>`
      : `<div class="empty">${esc(t("mobile_search_empty"))}</div>`;
    if (extras.length) {
      html += `<div class="mobile-section-label">${esc(t("mobile_extra_label"))}</div>${extraCardsHtml(extras)}`;
    }
    out.innerHTML = html;
  } catch (e) {
    out.innerHTML = `<div class="empty">⚠️ ${esc(e.message || t("search_failed"))}</div>`;
  }
}

function renderMobileProgramPicker() {
  hideExtra();
  setSectionHint("");

  document.getElementById("coursesOutput").innerHTML = `
    <p class="mobile-hint">${esc(t("mobile_hub_hint"))}</p>
    <div class="pick-grid">
    <button type="button" class="pick-card" data-mobile-prog="faculties">
      <span>
        <span class="pick-title">${esc(t("tab_faculties"))}</span>
        <small>${esc(t("mobile_pick_faculties_sub"))}</small>
      </span>
      <span class="pick-chev">›</span>
    </button>
    <button type="button" class="pick-card" data-mobile-prog="extra">
      <span>
        <span class="pick-title">📦 ${esc(t("mobile_extra_label"))}</span>
        <small>${esc(t("mobile_pick_extra_sub"))}</small>
      </span>
      <span class="pick-chev">›</span>
    </button>
    <button type="button" class="pick-card" data-mobile-prog="favorites">
      <span>
        <span class="pick-title">${esc(t("my_courses"))}</span>
        <small>${esc(t("mobile_pick_favorites_sub"))}</small>
      </span>
      <span class="pick-chev">›</span>
    </button>
    <button type="button" class="pick-card" data-mobile-prog="tips">
      <span>
        <span class="pick-title">${esc(t("tips_title"))}</span>
        <small>${esc(t("mobile_pick_tips_sub"))}</small>
      </span>
      <span class="pick-chev">›</span>
    </button>
    </div>`;
}

function renderMobileYearPicker() {
  hideExtra();
  setSectionHint("");
  const prog = findProgram(AppState.currentProg);
  if (!prog) {
    AppState.mobileStep = "program";
    renderMobileProgramPicker();
    return;
  }

  const years = prog.years
    .map((y) => {
      const sems = (y.sems || [])
        .map(
          (s) =>
            `<button type="button" class="mobile-sem-btn" data-mobile-year="${y.id}" data-mobile-sem="${s.id}">${esc(s.name)}</button>`,
        )
        .join("");
      return `
        <div class="mobile-year-block">
          <h3>${esc(y.name)}</h3>
          <div class="mobile-sem-row">${sems || `<p class="mobile-hint">${esc(t("no_semesters"))}</p>`}</div>
        </div>`;
    })
    .join("");

  const backStep =
    AppState.currentFacultyId && AppState.currentBranchId
      ? "specialisations"
      : "program";
  const backLabel =
    backStep === "specialisations"
      ? t("back_specialisations")
      : `← ${t("nav_home")}`;

  document.getElementById("coursesOutput").innerHTML = `
    <button type="button" class="mobile-back" data-mobile-back="${backStep}">${esc(backLabel)}</button>
    <div class="mobile-section-label">${esc(localizedName(prog))}</div>
    ${years}`;
}

function renderMobileList() {
  hideExtra();
  setSectionHint("");
  const prog = findProgram(AppState.currentProg);
  const year = prog?.years.find((y) => idsEqual(y.id, AppState.currentYear));
  const sem = year?.sems.find((s) => idsEqual(s.id, AppState.currentSem));
  if (!prog || !year || !sem) {
    AppState.mobileStep = "year";
    renderMobileYearPicker();
    return;
  }

  const canSpecs =
    (AppState.currentFacultyId ?? prog.faculty_id) != null &&
    (AppState.currentBranchId ?? prog.branch_id) != null;
  const courseCards = (sem.courses || []).map((c) => _buildCourseCard(c));
  document.getElementById("coursesOutput").innerHTML = `
    ${chipsHtml(
      [
        { label: localizedName(prog), crumb: canSpecs ? "specialisations" : "program" },
        { label: year.name, crumb: "year" },
        { label: sem.name, crumb: "year" },
      ],
      "year",
    )}
    ${courseCards.length
      ? `<div class="courses-grid">${courseCards.join("")}</div>`
      : `<div class="empty">${esc(t("mobile_sem_empty"))}</div>`}`;
}

function renderMobileFavorites() {
  hideExtra();
  setSectionHint(FAVORITES_HINT_CARD());
  const head =
    chipsHtml([t("my_courses").replace(/^⭐\s*/, "")], "program") +
    homeSectionHeading(esc(t("my_courses")));
  if (!window.isRegisteredStudent?.() && !AppState.adminLoggedIn) {
    document.getElementById("coursesOutput").innerHTML =
      head +
      `<div class="empty">${esc(t("fav_signup_empty"))}</div>`;
    return;
  }
  if (AppState.favorites.size === 0) {
    document.getElementById("coursesOutput").innerHTML =
      head +
      `<div class="empty">${esc(t("fav_empty_tap"))}</div>`;
    return;
  }

  const entries = collectFavoriteCourses(searchQuery());
  const cards = entries.map((e) =>
    _buildCourseCard(e.course, { path: e.paths.join(" | ") }),
  );

  document.getElementById("coursesOutput").innerHTML = `
    ${head}
    ${cards.length
      ? `<div class="courses-grid">${cards.join("")}</div>`
      : `<div class="empty">${esc(t("fav_no_match"))}</div>`}`;
}

function renderMobileTips() {
  hideExtra();
  setSectionHint("");
  document.getElementById("coursesOutput").innerHTML = `
    <div class="tips-page">
    ${chipsHtml([t("chip_tips")], "program")}
    ${homeSectionHeading(esc(t("tips_title")))}
    ${tipsSectionHtml()}
    </div>`;
}

function renderMobileExtra() {
  AppState.currentProg = "extra";
  AppState.mobileStep = "list";
  setSectionHint("");
  showExtraOnly();
  window.renderExtra();
  const extra = document.getElementById("extraSection");
  if (!extra) return;
  extra.insertAdjacentHTML("afterbegin", chipsHtml([t("chip_extra")], "program"));
}

function renderMobileHome() {
  if (!isMobileView()) return false;

  const q = (document.getElementById("searchInput")?.value || "").trim();
  if (q) {
    void renderMobileSearch(q);
    return true;
  }

  if (AppState.currentProg === "extra") {
    renderMobileExtra();
    return true;
  }
  if (AppState.currentProg === "tips") {
    renderMobileTips();
    return true;
  }
  if (AppState.currentProg === "favorites") {
    renderMobileFavorites();
    return true;
  }
  if (AppState.mobileStep === "year" && isRealProgram(AppState.currentProg)) {
    renderMobileYearPicker();
    return true;
  }
  if (
    AppState.mobileStep === "list" &&
    isRealProgram(AppState.currentProg) &&
    AppState.currentYear !== "all" &&
    AppState.currentSem !== "all"
  ) {
    renderMobileList();
    return true;
  }

  AppState.mobileStep = "program";
  renderMobileProgramPicker();
  return true;
}

function selectMobileProg(id) {
  if (id === "favorites" && !window.requireStudent(() => selectMobileProg("favorites"))) {
    return;
  }

  AppState.currentProg = id;
  AppState.currentYear = "all";
  AppState.currentSem = "all";

  if (id === "all") {
    AppState.mobileStep = "program";
    renderMobileHome();
    return;
  }
  if (id === "extra") {
    renderMobileExtra();
    return;
  }
  if (id === "tips") {
    AppState.mobileStep = "list";
    renderMobileTips();
    return;
  }
  if (id === "favorites") {
    AppState.mobileStep = "list";
    renderMobileFavorites();
    return;
  }
  if (id === "faculties") {
    AppState.mobileStep = "list";
    AppState.facultyNavStep = "faculties";
    AppState.currentFacultyId = null;
    AppState.currentBranchId = null;
    window.renderProgTabs?.();
    window.renderFacultyBrowser?.();
    return;
  }

  AppState.mobileStep = "year";
  window.trackBrowse?.("year");
  renderMobileYearPicker();
}

function selectMobileSem(yearId, semId) {
  AppState.currentYear = coerceId(yearId);
  AppState.currentSem = coerceId(semId);
  AppState.mobileStep = "list";
  window.trackBrowse?.("list");
  renderMobileList();
}

function mobileBrowseBack(step) {
  if (step === "specialisations") {
    const prog = findProgram(AppState.currentProg);
    const facultyId = AppState.currentFacultyId ?? prog?.faculty_id;
    const branchId = AppState.currentBranchId ?? prog?.branch_id;
    if (facultyId != null && branchId != null) {
      window.selectFacultyBranch?.(facultyId, branchId);
      return;
    }
    window.selectProg?.("faculties");
    return;
  }
  if (step === "program") {
    AppState.currentProg = "faculties";
    AppState.facultyNavStep = "faculties";
    AppState.currentYear = "all";
    AppState.currentSem = "all";
    AppState.mobileStep = "program";
    hideExtra();
    renderMobileProgramPicker();
    return;
  }
  if (step === "year") {
    AppState.mobileStep = "year";
    AppState.currentYear = "all";
    AppState.currentSem = "all";
    renderMobileYearPicker();
  }
}

function toggleCourseCard(courseId) {
  const card = document.getElementById(`course-card-${courseId}`);
  if (!card) return;
  const open = card.classList.contains("open");
  document.querySelectorAll(".course-card.open").forEach((el) => el.classList.remove("open"));
  if (!open) card.classList.add("open");
}

function initMobileHomeState() {
  if (!isMobileView()) return;
  AppState.currentProg = "faculties";
  AppState.facultyNavStep = "faculties";
  AppState.currentYear = "all";
  AppState.currentSem = "all";
  AppState.mobileStep = "program";
}

function onMobileViewportChange() {
  if (document.getElementById("view-admin")?.classList.contains("active")) {
    window.renderAdminContent?.();
  }
  if (!document.getElementById("coursesOutput") || !AppState.dbPrograms.length) return;
  if (isMobileView()) {
    initMobileHomeState();
    const filterRow = document.querySelector(".filter-row");
    if (filterRow) filterRow.style.display = "none";
    renderMobileHome();
    return;
  }
  if (!AppState.currentProg) AppState.currentProg = "faculties";
  if (AppState.currentYear == null) AppState.currentYear = "all";
  if (AppState.currentSem == null) AppState.currentSem = "all";
  if (AppState.mobileStep === "program" || AppState.mobileStep === "year") {
    if (!isRealProgram(AppState.currentProg)) AppState.currentProg = "faculties";
    AppState.currentYear = "all";
    AppState.currentSem = "all";
  }
  window.selectProg(AppState.currentProg);
}

function onMobileHomeClick(e) {
  if (!isMobileView()) return;

  const progEl = e.target.closest("[data-mobile-prog]");
  if (progEl) {
    e.preventDefault();
    selectMobileProg(coerceId(progEl.dataset.mobileProg));
    return;
  }

  const semEl = e.target.closest("[data-mobile-sem]");
  if (semEl) {
    e.preventDefault();
    selectMobileSem(semEl.dataset.mobileYear, semEl.dataset.mobileSem);
    return;
  }

  const backEl = e.target.closest("[data-mobile-back]");
  if (backEl) {
    e.preventDefault();
    mobileBrowseBack(backEl.dataset.mobileBack);
    return;
  }

  if (e.target.closest(".fav-btn, .link-item, .copy-btn, .hint-link")) return;

  const extraTitle = e.target.closest(".extra-title");
  if (extraTitle) {
    const section = extraTitle.closest(".extra-section");
    if (section) {
      e.preventDefault();
      const open = section.classList.contains("open");
      document.querySelectorAll(".extra-section.open").forEach((el) => el.classList.remove("open"));
      if (!open) section.classList.add("open");
    }
    return;
  }

  const header = e.target.closest("[data-toggle-course]");
  if (header) {
    e.preventDefault();
    toggleCourseCard(header.dataset.toggleCourse);
  }
}

function bindMobileHome() {
  const home = document.getElementById("view-home");
  if (home && !home.dataset.mobileBound) {
    home.addEventListener("click", onMobileHomeClick);
    home.dataset.mobileBound = "1";
  }
  window.matchMedia(MOBILE_MQ).addEventListener("change", onMobileViewportChange);
}

bindMobileHome();

window.renderMobileHome = renderMobileHome;
window.selectMobileProg = selectMobileProg;
window.initMobileHomeState = initMobileHomeState;
window.toggleCourseCard = toggleCourseCard;

export {
  renderMobileHome,
  selectMobileProg,
  initMobileHomeState,
  toggleCourseCard,
  onMobileViewportChange,
};
