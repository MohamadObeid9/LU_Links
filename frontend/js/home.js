
// ===================== HOME RENDER =====================
import { AppState } from "./state.js";
import { esc, _buildCourseCard, getLinkBadge, getContentTypeChips, _linkHref, isMobileView, collectFavoriteCourses, setSectionHint, tipsSectionHtml, FAVORITES_HINT, FAVORITES_HINT_CARD, homeSectionHeading, sectionInlineHintHtml } from "./ui.js";
import { renderMobileHome, selectMobileProg } from "./mobile-home.js";
import { t } from "./i18n.js";

function renderProgTabs() {
  const onFaculties =
    AppState.currentProg === "faculties" ||
    AppState.facultyNavStep === "branches" ||
    AppState.facultyNavStep === "specialisations" ||
    (typeof AppState.currentProg === "number" &&
      AppState.dbPrograms.some((p) => p.id === AppState.currentProg));
  const allLabel = isMobileView() ? t("tab_all") : t("tab_search_all");
  document.getElementById("progTabs").innerHTML =
    `<button class="prog-tab ${AppState.currentProg === "all" ? "active" : ""}" onclick="selectProg('all')">${esc(allLabel)}</button>` +
    `<button class="prog-tab ${onFaculties ? "active" : ""}" onclick="selectProg('faculties')">${esc(t("tab_faculties"))}</button>` +
    `<button class="prog-tab ${AppState.currentProg === "extra" ? "active" : ""}" onclick="selectProg('extra')">${esc(t("tab_extra"))}</button>` +
    `<button class="prog-tab ${AppState.currentProg === "tips" ? "active" : ""}" onclick="selectProg('tips')">${esc(t("tab_tips"))}</button>` +
    `<button class="prog-tab fav-tab ${AppState.currentProg === "favorites" ? "active" : ""}" onclick="selectProg('favorites')">${esc(t("tab_favorites"))}</button>`;
}

function shortFacultyLabel(name) {
  return String(name || "")
    .replace(/^Faculty of\s+/i, "")
    .replace(/^Institute of\s+/i, "")
    .trim() || name;
}

function countLabel(n, oneKey, manyKey) {
  const count = Number(n) || 0;
  return `${count} ${count === 1 ? t(oneKey) : t(manyKey)}`;
}

function offeringFacultyContext(prog) {
  const facultyId = AppState.currentFacultyId ?? prog?.faculty_id ?? null;
  const branchId = AppState.currentBranchId ?? prog?.branch_id ?? null;
  if (facultyId == null || branchId == null) return null;
  return { facultyId, branchId };
}

function backToSpecialisations() {
  const prog = AppState.dbPrograms.find((p) => p.id === AppState.currentProg);
  const ctx = offeringFacultyContext(prog);
  if (!ctx) {
    selectProg("faculties");
    return;
  }
  selectFacultyBranch(ctx.facultyId, ctx.branchId);
}

function syncProgramSectionHeading() {
  const el = document.getElementById("programSectionHeading");
  if (!el) return;
  if (isMobileView()) {
    el.hidden = true;
    el.replaceChildren();
    return;
  }
  const prog = AppState.dbPrograms.find((p) => p.id === AppState.currentProg);
  if (!prog) {
    el.hidden = true;
    el.replaceChildren();
    return;
  }
  const ctx =
    AppState.facultyNavStep === "courses" ? offeringFacultyContext(prog) : null;
  const back = ctx
    ? `<button type="button" class="nav-back" onclick="backToSpecialisations()">${esc(t("back_specialisations"))}</button>`
    : "";
  el.innerHTML = `${back}${homeSectionHeading(esc(prog.name))}`;
  el.hidden = false;
}

function pickCardHtml({ title, meta, onclick }) {
  return `
    <button type="button" class="pick-card" onclick="${onclick}">
      <span>
        <span class="pick-title">${esc(title)}</span>
        ${meta ? `<small>${esc(meta)}</small>` : ""}
      </span>
      <span class="pick-chev" aria-hidden="true">›</span>
    </button>`;
}

function renderFacultyBrowser() {
  setSectionHint("");
  document.querySelector(".filter-row").style.display = "none";
  document.getElementById("coursesOutput").style.display = "";
  document.getElementById("extraSection").style.display = "none";

  const step = AppState.facultyNavStep || "faculties";
  if (step === "faculties") {
    const cards = (AppState.dbFaculties || [])
      .map((f) =>
        pickCardHtml({
          title: shortFacultyLabel(f.name),
          meta: countLabel((f.branches || []).length, "campus_one", "campus_many"),
          onclick: `selectFaculty(${f.id})`,
        }),
      )
      .join("");
    const mobileBack = isMobileView()
      ? `<button type="button" class="nav-back" data-mobile-back="program">← ${esc(t("nav_home"))}</button>`
      : "";
    document.getElementById("coursesOutput").innerHTML = `
      <div class="home-section">
        ${mobileBack}
        ${homeSectionHeading(t("faculties_title"))}
        <p class="view-subtitle">${esc(t("faculties_sub"))}</p>
        <div class="pick-grid">${cards || `<div class="empty">${esc(t("faculties_empty"))}</div>`}</div>
      </div>`;
    return;
  }

  const fac = (AppState.dbFaculties || []).find((f) => f.id === AppState.currentFacultyId);
  if (!fac) {
    AppState.facultyNavStep = "faculties";
    renderFacultyBrowser();
    return;
  }

  if (step === "branches") {
    const cards = (fac.branches || [])
      .map((b) =>
        pickCardHtml({
          title: b.name,
          meta: countLabel((b.specialisations || []).length, "spec_one", "spec_many"),
          onclick: `selectFacultyBranch(${fac.id}, ${b.id})`,
        }),
      )
      .join("");
    document.getElementById("coursesOutput").innerHTML = `
      <div class="home-section">
        <button type="button" class="nav-back" onclick="selectProg('faculties')">${esc(t("back_all_faculties"))}</button>
        ${homeSectionHeading(esc(shortFacultyLabel(fac.name)))}
        <p class="view-subtitle">${esc(t("campus_sub"))}</p>
        <div class="pick-grid">${cards || `<div class="empty">${esc(t("campuses_empty"))}</div>`}</div>
      </div>`;
    return;
  }

  const branch = (fac.branches || []).find((b) => b.id === AppState.currentBranchId);
  if (!branch) {
    AppState.facultyNavStep = "branches";
    renderFacultyBrowser();
    return;
  }

  const cards = (branch.specialisations || [])
    .map((sp) => {
      const yearCount = (sp.years || []).length;
      return pickCardHtml({
        title: sp.name,
        meta: yearCount
          ? countLabel(yearCount, "year_courses_one", "year_courses_many")
          : t("courses_coming"),
        onclick: `selectOffering(${sp.offeringId})`,
      });
    })
    .join("");
  document.getElementById("coursesOutput").innerHTML = `
    <div class="home-section">
      <button type="button" class="nav-back" onclick="selectFaculty(${fac.id})">${esc(t("back_campuses", { name: shortFacultyLabel(fac.name) }))}</button>
      ${homeSectionHeading(esc(branch.name))}
      <p class="view-subtitle">${esc(t("spec_sub"))}</p>
      <div class="pick-grid">${cards || `<div class="empty">${esc(t("specs_empty"))}</div>`}</div>
    </div>`;
}

function selectFaculty(facultyId) {
  AppState.currentProg = "faculties";
  AppState.currentFacultyId = facultyId;
  AppState.currentBranchId = null;
  AppState.facultyNavStep = "branches";
  renderProgTabs();
  renderFacultyBrowser();
  syncProgramSectionHeading();
}

function selectFacultyBranch(facultyId, branchId) {
  AppState.currentProg = "faculties";
  AppState.currentFacultyId = facultyId;
  AppState.currentBranchId = branchId;
  AppState.facultyNavStep = "specialisations";
  renderProgTabs();
  renderFacultyBrowser();
  syncProgramSectionHeading();
}

function selectOffering(offeringId) {
  AppState.facultyNavStep = "courses";
  AppState.currentProg = offeringId;
  AppState.currentYear = "all";
  AppState.currentSem = "all";
  renderProgTabs();
  const paint = () => {
    if (isMobileView()) {
      AppState.mobileStep = "year";
      document.querySelector(".filter-row").style.display = "none";
      document.getElementById("coursesOutput").style.display = "";
      document.getElementById("extraSection").style.display = "none";
      renderCourses();
      return;
    }
    document.querySelector(".filter-row").style.display = "";
    document.getElementById("coursesOutput").style.display = "";
    document.getElementById("extraSection").style.display = "none";
    renderYearFilters();
    renderSemFilters();
    renderCourses();
    syncProgramSectionHeading();
  };
  const prog = AppState.dbPrograms.find((p) => p.id === Number(offeringId));
  if (prog && !prog._coursesLoaded && window.ensureOfferingLoaded) {
    document.getElementById("coursesOutput").innerHTML =
      `<div class="loader"><div class="spinner"></div> ${esc(t("loading_courses"))}</div>`;
    window
      .ensureOfferingLoaded(offeringId)
      .then(paint)
      .catch((e) => {
        document.getElementById("coursesOutput").innerHTML =
          `<div class="empty">⚠️ ${esc(e.message || t("load_courses_fail"))}</div>`;
      });
    return;
  }
  paint();
}

window.selectFaculty = selectFaculty;
window.selectFacultyBranch = selectFacultyBranch;
window.selectOffering = selectOffering;
window.backToSpecialisations = backToSpecialisations;
window.renderFacultyBrowser = renderFacultyBrowser;


function renderYearFilters() {
  const prog = AppState.dbPrograms.find((p) => p.id === AppState.currentProg);
  if (!prog) return;
  document.getElementById("yearFilters").innerHTML =
    `<button class="filter-btn ${AppState.currentYear === "all" ? "active" : ""}" onclick="setYear('all')">${esc(t("filter_all"))}</button>` +
    prog.years
      .map(
        (y) =>
          `<button class="filter-btn ${AppState.currentYear === y.id ? "active" : ""}" onclick="setYear(${y.id})">${esc(y.name)}</button>`,
      )
      .join("");
}

function renderSemFilters() {
  const prog = AppState.dbPrograms.find((p) => p.id === AppState.currentProg);
  if (!prog) return;
  let sems = [];
  prog.years.forEach((y) => {
    if (AppState.currentYear === "all" || y.id === AppState.currentYear)
      y.sems.forEach((s) => {
        if (!sems.find((x) => x.id === s.id)) sems.push(s);
      });
  });
  document.getElementById("semFilters").innerHTML =
    `<button class="filter-btn ${AppState.currentSem === "all" ? "active" : ""}" onclick="setSem('all')">${esc(t("filter_all"))}</button>` +
    sems
      .map(
        (s) =>
          `<button class="filter-btn ${AppState.currentSem === s.id ? "active" : ""}" onclick="setSem(${s.id})">${esc(s.name)}</button>`,
      )
      .join("");
}

// ── Favorites view ─────────────────────────────────────────────────────────
function renderFavorites() {
  const q = document.getElementById("searchInput")?.value.toLowerCase().trim() || "";
  const mobile = isMobileView();
  setSectionHint(mobile ? FAVORITES_HINT_CARD() : "");

  const finish = (body) => {
    if (mobile) {
      document.getElementById("coursesOutput").innerHTML = body;
      return;
    }
    document.getElementById("coursesOutput").innerHTML = `
      <div class="home-section">
        ${homeSectionHeading(t("my_courses"))}
        ${sectionInlineHintHtml(FAVORITES_HINT())}
        ${body}
      </div>`;
  };

  if (!window.isRegisteredStudent?.() && !AppState.adminLoggedIn) {
    finish(`<div class="empty">${esc(t("fav_signup_empty"))}</div>`);
    return;
  }
  if (AppState.favorites.size === 0) {
    finish(`<div class="empty">${esc(t("fav_empty_click"))}</div>`);
    return;
  }

  const paintFromCourses = (courses) => {
    const filtered = courses.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.code || "").toLowerCase().includes(q),
    );
    const cardsHtml = filtered
      .map((c) => _buildCourseCard(c, { path: c.path || "" }))
      .join("");
    finish(
      cardsHtml
        ? `<div class="courses-grid">${cardsHtml}</div>`
        : `<div class="empty">${esc(t("fav_no_match"))}</div>`,
    );
  };

  if (window.loadFavoriteCourses) {
    document.getElementById("coursesOutput").innerHTML =
      `<div class="loader"><div class="spinner"></div> ${esc(t("loading"))}</div>`;
    window
      .loadFavoriteCourses()
      .then(paintFromCourses)
      .catch((e) =>
        finish(`<div class="empty">⚠️ ${esc(e.message || t("load_fav_fail"))}</div>`),
      );
    return;
  }

  const entries = collectFavoriteCourses(q);
  const cardsHtml = entries
    .map((e) => _buildCourseCard(e.course, { path: e.paths.join(" | ") }))
    .join("");
  finish(
    cardsHtml
      ? `<div class="courses-grid">${cardsHtml}</div>`
      : `<div class="empty">${esc(t("fav_no_match"))}</div>`,
  );
}

function renderCourses() {
  if (isMobileView() && renderMobileHome()) return;
  if (AppState.currentProg === "all") {
    setSectionHint("");
    renderAllCourses();
    return;
  }
  if (AppState.currentProg === "tips") {
    renderTips();
    return;
  }
  if (AppState.currentProg === "favorites") {
    renderFavorites();
    return;
  }
  // Default home + faculty drill-down (not a program id).
  if (
    AppState.currentProg === "faculties" ||
    AppState.facultyNavStep === "branches" ||
    AppState.facultyNavStep === "specialisations"
  ) {
    renderFacultyBrowser();
    return;
  }
  if (AppState.currentProg === "extra") {
    return;
  }

  const prog = AppState.dbPrograms.find((p) => p.id === AppState.currentProg);
  if (!prog) {
    renderFacultyBrowser();
    return;
  }
  setSectionHint("");

  const q = document.getElementById("searchInput").value.toLowerCase().trim();
  let html = "";

  prog.years.forEach((year) => {
    if (AppState.currentYear !== "all" && year.id !== AppState.currentYear) return;

    let yearHtml = "";

    year.sems.forEach((sem) => {
      if (AppState.currentSem !== "all" && sem.id !== AppState.currentSem) return;

      const filtered = sem.courses.filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q),
      );
      if (!filtered.length) return;

      const courseCards = filtered.map(_buildCourseCard);

      yearHtml += `
        <div class="sem-block">
          <div class="sem-title">${esc(sem.name)}</div>
          <div class="courses-grid">${courseCards.join("")}</div>
        </div>`;
    });

    if (yearHtml) {
      html += `
        <div style="margin-bottom:32px;">
          <h3 style="font-size:1rem;font-weight:700;color:var(--accent);margin-bottom:16px;">${esc(year.name)}</h3>
          ${yearHtml}
        </div>`;
    }
  });

  document.getElementById("coursesOutput").innerHTML =
    html || `<div class="empty">${esc(t("no_courses"))}</div>`;
}

// ── All programs view (search-gated — never paint full catalog) ─────────────
async function renderAllCourses() {
  const q = document.getElementById("searchInput")?.value.trim() || "";
  const out = document.getElementById("coursesOutput");
  const heading = homeSectionHeading(esc(t("search_all_title")));
  const wrap = (body) =>
    `<div class="home-section">${heading}${body}</div>`;

  if (q.length < 2) {
    out.innerHTML = wrap(`<div class="empty">${esc(t("all_search_hint"))}</div>`);
    return;
  }
  out.innerHTML = wrap(
    '<div class="loader"><div class="spinner"></div> Searching…</div>',
  );
  try {
    const rows = window.searchCourses
      ? await window.searchCourses(q, 50)
      : [];
    if (!rows.length) {
      out.innerHTML = wrap(`<div class="empty">${esc(t("no_courses"))}</div>`);
      return;
    }
    const cards = rows
      .map((c) => {
        const course = {
          ...c,
          links: Array.isArray(c.links) ? c.links : [],
        };
        return _buildCourseCard(course, { path: c.path || "" });
      })
      .join("");
    out.innerHTML = wrap(`<div class="courses-grid">${cards}</div>`);
  } catch (e) {
    out.innerHTML = wrap(
      `<div class="empty">⚠️ ${esc(e.message || t("search_failed"))}</div>`,
    );
  }
}

function renderExtra() {
  const q =
    document.getElementById("searchInput")?.value.toLowerCase().trim() || "";

  const filtered = q
    ? AppState.dbExtra.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.links.some((l) => l.label.toLowerCase().includes(q)),
      )
    : AppState.dbExtra;

  const heading = homeSectionHeading(`📦 ${esc(t("extra_resources"))}`);
  const body = filtered.length
    ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">
      ${filtered
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
        .join("")}
    </div>`
    : `<div class="empty">${esc(t("extra_empty"))}</div>`;

  document.getElementById("extraSection").innerHTML = `${heading}${body}`;
}

function renderTips() {
  setSectionHint("");
  document.getElementById("coursesOutput").innerHTML = `
    <div class="home-section tips-page">
      ${homeSectionHeading(t("tips_title"))}
      ${tipsSectionHtml()}
    </div>`;
}

function selectProg(id) {
  // "My Courses" is server-synced, so it needs a registered student.
  if (id === "favorites" && !window.requireStudent(() => selectProg("favorites"))) {
    return;
  }
  if (isMobileView()) {
    selectMobileProg(id);
    return;
  }
  AppState.currentProg = id;
  AppState.currentYear = "all";
  AppState.currentSem = "all";
  renderProgTabs();
  if (id === "faculties") {
    AppState.facultyNavStep = "faculties";
    AppState.currentFacultyId = null;
    AppState.currentBranchId = null;
    renderFacultyBrowser();
  } else if (id === "extra") {
    AppState.facultyNavStep = "faculties";
    setSectionHint("");
    document.querySelector(".filter-row").style.display = "none";
    document.getElementById("coursesOutput").style.display = "none";
    document.getElementById("extraSection").style.display = "";
    renderExtra();
  } else if (id === "all") {
    AppState.facultyNavStep = "faculties";
    document.querySelector(".filter-row").style.display = "none";
    document.getElementById("coursesOutput").style.display = "";
    document.getElementById("extraSection").style.display = "none";
    document.getElementById("extraSection").innerHTML = "";
    renderCourses();
  } else if (id === "tips") {
    setSectionHint("");
    document.querySelector(".filter-row").style.display = "none";
    document.getElementById("coursesOutput").style.display = "";
    document.getElementById("extraSection").style.display = "none";
    renderTips();
  } else if (id === "favorites") {
    document.querySelector(".filter-row").style.display = "none";
    document.getElementById("coursesOutput").style.display = "";
    document.getElementById("extraSection").style.display = "none";
    renderFavorites();
  } else {
    AppState.facultyNavStep = "courses";
    document.querySelector(".filter-row").style.display = "";
    document.getElementById("coursesOutput").style.display = "";
    document.getElementById("extraSection").style.display = "none";
    renderYearFilters();
    renderSemFilters();
    renderCourses();
  }
  syncProgramSectionHeading();
}

function setYear(y) {
  AppState.currentYear = y;
  AppState.currentSem = "all";
  window.trackBrowse?.("year");
  renderYearFilters();
  renderSemFilters();
  renderCourses();
}
function setSem(s) {
  AppState.currentSem = s;
  window.trackBrowse?.("list");
  renderSemFilters();
  renderCourses();
}

window.renderProgTabs = renderProgTabs;
window.renderYearFilters = renderYearFilters;
window.renderSemFilters = renderSemFilters;
window.renderCourses = renderCourses;
window.renderExtra = renderExtra;
window.selectProg = selectProg;
window.setYear = setYear;
window.setSem = setSem;
window.syncProgramSectionHeading = syncProgramSectionHeading;

export {
  renderProgTabs,
  renderYearFilters,
  renderSemFilters,
  renderCourses,
  renderExtra,
  selectProg,
  setYear,
  setSem,
  syncProgramSectionHeading,
};
