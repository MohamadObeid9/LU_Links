import { AppState } from "./state.js";
import { _loadCache, _saveCache, _clearCache } from "./cache.js";
import { apiRequest, formatApiError, logApiError, sb } from "./supabase.js";
import { showSkeleton } from "./skeleton.js";
import { esc, isMobileView } from "./ui.js";
import {
  renderProgTabs,
  renderYearFilters,
  renderSemFilters,
  renderCourses,
  syncProgramSectionHeading,
} from "./home.js";
import { initMobileHomeState } from "./mobile-home.js";

function _naturalLinkSort(a, b) {
  const numA = parseInt((a.label || "").match(/(\d+)\s*$/)?.[1]) || 0;
  const numB = parseInt((b.label || "").match(/(\d+)\s*$/)?.[1]) || 0;
  if (numA !== numB) return numA - numB;
  return (a.display_order || 0) - (b.display_order || 0);
}

function _groupBy(list, keyFn) {
  const map = new Map();
  for (const item of list) {
    const key = keyFn(item);
    let bucket = map.get(key);
    if (!bucket) {
      bucket = [];
      map.set(key, bucket);
    }
    bucket.push(item);
  }
  return map;
}

function _normalizeLink(l) {
  return {
    ...l,
    languages: Array.isArray(l.languages) ? l.languages : [],
  };
}

/** Indexed O(n) tree build — never nested .filter joins. */
function _yearsForOfferingIndexed(offeringId, yearsByOffering, semestersByYear, coursesBySem, linksByCourse) {
  const years = yearsByOffering.get(offeringId) || [];
  return years.map((y) => ({
    ...y,
    sems: (semestersByYear.get(y.id) || []).map((s) => ({
      ...s,
      courses: (coursesBySem.get(s.id) || []).map((c) => ({
        ...c,
        links: (linksByCourse.get(c.id) || []).map(_normalizeLink).sort(_naturalLinkSort),
      })),
    })),
  }));
}

function _buildTree(payload) {
  const faculties = payload.faculties || [];
  const branches = payload.branches || [];
  const facultyBranches = payload.faculty_branches || [];
  const specialisations = payload.specialisations || [];
  const offerings = payload.branch_specialisations || [];
  const years = payload.years || [];
  const semesters = payload.semesters || [];
  const courses = payload.courses || [];
  const links = payload.links || [];
  const extraSections = payload.extra_sections || [];
  const extraLinks = payload.extra_links || [];

  const branchById = new Map(branches.map((b) => [b.id, b]));
  const specById = new Map(specialisations.map((s) => [s.id, s]));
  const yearsByOffering = _groupBy(years, (y) => y.branch_specialisation_id);
  const semestersByYear = _groupBy(semesters, (s) => s.year_id);
  const coursesBySem = _groupBy(courses, (c) => c.semester_id);
  const linksByCourse = _groupBy(links, (l) => l.course_id);
  const fbByFaculty = _groupBy(facultyBranches, (fb) => fb.faculty_id);
  const offeringsByBranch = _groupBy(offerings, (o) => o.branch_id);
  const extraLinksBySection = _groupBy(extraLinks, (l) => l.section_id);

  // Build each offering's year tree once; share references.
  const yearsByOfferingId = new Map();
  for (const o of offerings) {
    yearsByOfferingId.set(
      o.id,
      _yearsForOfferingIndexed(o.id, yearsByOffering, semestersByYear, coursesBySem, linksByCourse),
    );
  }

  AppState.dbPrograms = offerings
    .map((o) => {
      const sp = specById.get(o.specialisation_id);
      const br = branchById.get(o.branch_id);
      const fac = faculties.find((f) => f.id === sp?.faculty_id);
      if (!sp || !br || !fac) return null;
      const nameEn = `${sp.name} · ${br.name}`;
      const spAr = String(sp.name_ar || "").trim();
      const brAr = String(br.name_ar || "").trim();
      const nameAr =
        spAr || brAr ? `${spAr || sp.name} · ${brAr || br.name}` : "";
      return {
        id: o.id,
        name: nameEn,
        name_ar: nameAr,
        slug: `${fac.slug}-${br.slug}-${sp.slug}`,
        faculty_id: fac.id,
        branch_id: br.id,
        specialisation_id: sp.id,
        display_order: o.display_order,
        years: yearsByOfferingId.get(o.id) || [],
        _coursesLoaded: false,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  AppState.dbFaculties = faculties.map((f) => {
    const branchIds = (fbByFaculty.get(f.id) || []).map((fb) => fb.branch_id);
    return {
      ...f,
      branches: branchIds
        .map((id) => branchById.get(id))
        .filter(Boolean)
        .map((b) => {
          const specs = (offeringsByBranch.get(b.id) || [])
            .map((o) => {
              const sp = specById.get(o.specialisation_id);
              if (!sp || sp.faculty_id !== f.id) return null;
              return {
                ...sp,
                offeringId: o.id,
                display_order: o.display_order,
                years: yearsByOfferingId.get(o.id) || [],
              };
            })
            .filter(Boolean)
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          return { ...b, specialisations: specs };
        })
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
    };
  });

  AppState.dbExtra = extraSections.map((sec) => ({
    ...sec,
    links: (extraLinksBySection.get(sec.id) || []).sort(_naturalLinkSort),
  }));

  AppState.courseById = new Map();
  AppState.linkById = new Map();
  AppState.dbPrograms.forEach((p) =>
    p.years.forEach((y) =>
      y.sems.forEach((s) =>
        s.courses.forEach((c) => {
          AppState.courseById.set(c.id, c);
          c.links.forEach((l) => AppState.linkById.set(l.id, l));
        }),
      ),
    ),
  );
  AppState.dbExtra.forEach((sec) =>
    sec.links.forEach((l) => AppState.linkById.set(l.id, l)),
  );
}

function _contentPayload(data) {
  return {
    faculties: data.faculties || [],
    branches: data.branches || [],
    faculty_branches: data.faculty_branches || [],
    specialisations: data.specialisations || [],
    branch_specialisations: data.branch_specialisations || [],
    years: data.years || [],
    semesters: data.semesters || [],
    courses: data.courses || [],
    links: data.links || [],
    extra_sections: data.extra_sections || [],
    extra_links: data.extra_links || [],
  };
}

function _applyContent(payload) {
  _buildTree(payload);
}

async function _fetchJSON(url, { etag = "", cache = undefined } = {}) {
  const headers = {};
  if (etag) headers["If-None-Match"] = etag;
  const res = await apiRequest(url, {
    headers,
    cache,
    rawResponse: true,
  });
  if (res.status === 304) {
    return { notModified: true, etag: res.etag || etag, data: null };
  }
  return { notModified: false, etag: res.etag || "", data: res.data };
}

async function _fetchHierarchy() {
  const cached = await _loadCache("hierarchy");
  const result = await _fetchJSON("/api/content/hierarchy", {
    etag: cached?.etag || "",
  });
  if (result.notModified && cached) {
    if (cached.stale) await _saveCache(cached.data, { key: "hierarchy", etag: result.etag });
    return cached.data;
  }
  const payload = _contentPayload(result.data || {});
  await _saveCache(payload, { key: "hierarchy", etag: result.etag });
  return payload;
}

async function _fetchFullAdminContent() {
  const data = await apiRequest("/api/admin/content", { cache: "no-store" });
  return _contentPayload(data);
}

/** Ensure courses/links for an offering are loaded and merged into AppState. */
async function ensureOfferingLoaded(offeringId) {
  const id = Number(offeringId);
  const prog = AppState.dbPrograms.find((p) => p.id === id);
  if (!prog) return false;
  if (prog._coursesLoaded) return true;

  const cacheKey = `offering:${id}`;
  const cached = await _loadCache(cacheKey);
  let slice = null;
  try {
    const result = await _fetchJSON(`/api/content/offerings/${id}`, {
      etag: cached?.etag || "",
    });
    if (result.notModified && cached) {
      slice = cached.data;
    } else {
      slice = result.data || {};
      await _saveCache(slice, { key: cacheKey, etag: result.etag });
    }
  } catch (e) {
    if (cached?.data) slice = cached.data;
    else throw e;
  }

  const yearsByOffering = _groupBy(slice.years || [], (y) => y.branch_specialisation_id);
  const semestersByYear = _groupBy(slice.semesters || [], (s) => s.year_id);
  const coursesBySem = _groupBy(slice.courses || [], (c) => c.semester_id);
  const linksByCourse = _groupBy(slice.links || [], (l) => l.course_id);
  const yearsTree = _yearsForOfferingIndexed(
    id,
    yearsByOffering,
    semestersByYear,
    coursesBySem,
    linksByCourse,
  );

  prog.years = yearsTree;
  prog._coursesLoaded = true;

  // Keep faculty browser specialisation years in sync (shared structure).
  for (const fac of AppState.dbFaculties || []) {
    for (const br of fac.branches || []) {
      for (const sp of br.specialisations || []) {
        if (sp.offeringId === id) sp.years = yearsTree;
      }
    }
  }

  yearsTree.forEach((y) =>
    y.sems.forEach((s) =>
      s.courses.forEach((c) => {
        AppState.courseById.set(c.id, c);
        c.links.forEach((l) => AppState.linkById.set(l.id, l));
      }),
    ),
  );
  return true;
}

async function searchCourses(q, limit = 50) {
  const query = String(q || "").trim();
  if (query.length < 2) return [];
  const rows = await apiRequest(
    `/api/content/search?q=${encodeURIComponent(query)}&limit=${limit}`,
  );
  return Array.isArray(rows) ? rows : [];
}

async function loadFavoriteCourses() {
  const ids = [...AppState.favorites].map((id) => Number(id)).filter((n) => n > 0);
  if (!ids.length) return [];
  const missing = ids.filter((id) => !AppState.courseById.has(id));
  if (missing.length) {
    const rows = await apiRequest(
      `/api/content/courses?ids=${missing.map(encodeURIComponent).join(",")}`,
    );
    for (const c of Array.isArray(rows) ? rows : []) {
      const links = (c.links || []).map(_normalizeLink).sort(_naturalLinkSort);
      const course = { ...c, links };
      AppState.courseById.set(course.id, course);
      links.forEach((l) => AppState.linkById.set(l.id, l));
    }
  }
  return ids.map((id) => AppState.courseById.get(id)).filter(Boolean);
}

function _renderAfterLoad({ resetMobile = true } = {}) {
  if (resetMobile) initMobileHomeState();
  if (!AppState.currentProg) AppState.currentProg = "faculties";
  document.getElementById("extraSection").style.display = "none";
  if (isMobileView()) {
    document.querySelector(".filter-row").style.display = "none";
    document.getElementById("coursesOutput").style.display = "";
    renderProgTabs();
    renderCourses();
    window.refreshReportContributePickers?.();
    return;
  }
  if (AppState.currentProg === "all") {
    document.querySelector(".filter-row").style.display = "none";
    document.getElementById("extraSection").style.display = "none";
    document.getElementById("extraSection").innerHTML = "";
  } else if (
    AppState.currentProg === "faculties" ||
    AppState.facultyNavStep === "branches" ||
    AppState.facultyNavStep === "specialisations"
  ) {
    document.querySelector(".filter-row").style.display = "none";
  }
  renderProgTabs();
  renderYearFilters();
  renderSemFilters();
  renderCourses();
  syncProgramSectionHeading();
  window.refreshReportContributePickers?.();
}

async function loadAll() {
  const output = document.getElementById("coursesOutput");
  const extra = document.getElementById("extraSection");

  const isFirstLoad = !output.dataset.loaded;
  if (isFirstLoad) {
    showSkeleton();
  } else {
    output.innerHTML =
      '<div class="loader"><div class="spinner"></div> Loading…</div>';
  }
  extra.innerHTML = "";

  try {
    if (AppState.adminLoggedIn) {
      const payload = await _fetchFullAdminContent();
      _applyContent({ ...payload, _offeringLoaded: -1 });
      // Admin full dump: mark all offerings loaded.
      AppState.dbPrograms.forEach((p) => {
        p._coursesLoaded = true;
      });
    } else {
      const cached = await _loadCache("hierarchy");
      if (cached) {
        _applyContent(cached.data);
        output.dataset.loaded = "1";
        _renderAfterLoad();
        if (!cached.stale) {
          // Background revalidate via ETag.
          _fetchHierarchy()
            .then((fresh) => {
              _applyContent(fresh);
              _renderAfterLoad({ resetMobile: false });
            })
            .catch(() => {});
          return;
        }
      }
      const payload = await _fetchHierarchy();
      _applyContent(payload);
    }
    output.dataset.loaded = "1";
    _renderAfterLoad();
  } catch (e) {
    const message = formatApiError(e, "Failed to fetch from backend");
    output.innerHTML = `<div class="empty">⚠️ Failed to load data: ${esc(message)}</div>`;
  }
}

async function loadReportsBadges() {
  try {
    const [reports, contribs, feedback, suggestions] = await Promise.all([
      sb("reports?status=open&limit=100", "GET").then((r) => (Array.isArray(r) ? r : [])),
      sb("contributions?status=pending&limit=100", "GET").then((r) =>
        Array.isArray(r) ? r : [],
      ),
      sb("feedback?status=new&limit=100", "GET").then((r) => (Array.isArray(r) ? r : [])),
      sb("suggestions?status=new&limit=100", "GET").then((r) => (Array.isArray(r) ? r : [])),
    ]);
    const openR = reports.length;
    const pendC = contribs.length;
    const newF = feedback.length;
    const newS = suggestions.length;
    _setInboxBadge("reportBadge", openR);
    _setInboxBadge("contribBadge", pendC);
    _setInboxBadge("feedbackBadge", newF);
    _setInboxBadge("suggestionBadge", newS);
    _paintAdminInboxHints(openR, pendC, newF, newS);
  } catch (e) {
    logApiError(e, "loadReportsBadges");
  }
}

function _setInboxBadge(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  const n = Number(count) || 0;
  el.textContent = n > 99 ? "99+" : String(n);
  el.classList.toggle("is-alert", n > 0);
  el.hidden = n <= 0;
  el.setAttribute("aria-hidden", n <= 0 ? "true" : "false");
}

function _paintAdminInboxHints(openR, pendC, newF, newS) {
  const select = document.getElementById("adminTabSelect");
  if (select) {
    const labels = {
      feedback: newF ? `Feedbacks (${newF})` : "Feedbacks",
      suggestions: newS ? `Suggestions (${newS})` : "Suggestions",
      reports: openR ? `Reports (${openR})` : "Reports",
      contributions: pendC ? `Contributions (${pendC})` : "Contributions",
    };
    [...select.options].forEach((opt) => {
      if (labels[opt.value]) opt.textContent = labels[opt.value];
    });
  }

  const el = document.getElementById("adminMobileAlerts");
  if (!el) return;
  const items = [
    newF > 0 && { tab: "feedback", label: "Feedbacks", n: newF },
    newS > 0 && { tab: "suggestions", label: "Suggestions", n: newS },
    openR > 0 && { tab: "reports", label: "Reports", n: openR },
    pendC > 0 && { tab: "contributions", label: "Contributions", n: pendC },
  ].filter(Boolean);
  el.hidden = items.length === 0;
  el.innerHTML = items
    .map(
      (i) =>
        `<button type="button" class="admin-alert-chip" data-admin-tab="${i.tab}">${i.label} <span class="badge is-alert">${i.n > 99 ? "99+" : i.n}</span></button>`,
    )
    .join("");
}

let _inboxBadgeTimer = null;

function startAdminInboxBadgePolling() {
  stopAdminInboxBadgePolling();
  loadReportsBadges();
  _inboxBadgeTimer = setInterval(() => {
    if (!AppState.adminLoggedIn) {
      stopAdminInboxBadgePolling();
      return;
    }
    const adminView = document.getElementById("view-admin");
    if (!adminView?.classList.contains("active")) {
      stopAdminInboxBadgePolling();
      return;
    }
    loadReportsBadges();
  }, 30000);
}

function stopAdminInboxBadgePolling() {
  if (_inboxBadgeTimer) {
    clearInterval(_inboxBadgeTimer);
    _inboxBadgeTimer = null;
  }
}

function onSearch() {
  window.trackSearch?.(document.getElementById("searchInput")?.value || "");
  if (isMobileView()) {
    window.renderCourses();
    return;
  }
  if (AppState.currentProg === "extra") window.renderExtra();
  else window.renderCourses();
}

window.loadAll = loadAll;
window.onSearch = onSearch;
window.loadReportsBadges = loadReportsBadges;
window.startAdminInboxBadgePolling = startAdminInboxBadgePolling;
window.stopAdminInboxBadgePolling = stopAdminInboxBadgePolling;
window.ensureOfferingLoaded = ensureOfferingLoaded;
window.searchCourses = searchCourses;
window.loadFavoriteCourses = loadFavoriteCourses;
window._clearContentCache = _clearCache;

export {
  loadAll,
  onSearch,
  loadReportsBadges,
  startAdminInboxBadgePolling,
  stopAdminInboxBadgePolling,
  ensureOfferingLoaded,
  searchCourses,
  loadFavoriteCourses,
};
