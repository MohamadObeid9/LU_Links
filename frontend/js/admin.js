import { AppState } from "./state.js";
import { sb, sbAuth, sbLogout, apiRequest } from "./supabase.js";
import { esc, setBtnLoading, getLinkBadge, getContentTypeChips, getLanguageChips, adminCell, adminLongText, isMobileView } from "./ui.js";
import { getAdminTableSkeleton, getAdminAnalyticsSkeleton } from "./skeleton.js";
import { loadAll, loadReportsBadges } from "./data.js";
import { _clearCache } from "./cache.js";
import { showToast } from "./export.js";
import { renderAdminFeedback } from "./feedback.js";
import { renderAdminSuggestions } from "./suggestions.js";
import { _linkTypeOptions, _contentTypeCheckboxes, _readContentTypeCheckboxes, _languageCheckboxes, _readLanguageCheckboxes, parseContributionNote, _getNextDisplayOrder } from "./modals.js";
import { loadStudentDirectory, rememberStudents, senderDetail, studentHandleOf, fmtDateTime } from "./students.js";

// ===================== ADMIN AUTH =====================
async function checkLogin() {
  const email = document.getElementById("adminEmail").value.trim();
  const pass = document.getElementById("adminPass").value;
  document.getElementById("loginErr").textContent = "";
  const btn = document.querySelector(".login-wrap .btn-primary");
  setBtnLoading(btn, true, "Logging in…");
  try {
    AppState.sbToken = await sbAuth(email, pass);
    localStorage.setItem("lu_links_token", AppState.sbToken);
    AppState.adminLoggedIn = true;
    document.getElementById("adminPass").value = "";
    window.showView("admin");
  } catch (e) {
    document.getElementById("loginErr").textContent = e.message;
  } finally {
    setBtnLoading(btn, false);
  }
}

async function logout() {
  window.stopAdminInboxBadgePolling?.();
  await sbLogout();
  localStorage.removeItem("lu_links_token");
  AppState.sbToken = null;
  AppState.adminLoggedIn = false;
  window.showView("home");
}

// ===================== ADMIN TABS =====================
const ADMIN_PAGE_SIZE = 10;
const ADMIN_PAGE_FETCH = ADMIN_PAGE_SIZE + 1;
const ANALYTICS_VISITORS_PAGE_SIZE = 12;
const AdminPager = {
  reports: { page: 0, hasNext: false },
  contributions: { page: 0, hasNext: false },
  feedback: { page: 0, hasNext: false },
  students: { page: 0, hasNext: false },
  studentTimeline: { page: 0, hasNext: false },
};

function _setAdminPage(tab, page) {
  if (!AdminPager[tab]) return;
  AdminPager[tab].page = Math.max(0, page);
}

/** Ask for one extra row so a full last page does not look like there is a next one. */
function _pageSlice(rows, pageSize = ADMIN_PAGE_SIZE) {
  const list = Array.isArray(rows) ? rows : [];
  return { items: list.slice(0, pageSize), hasNext: list.length > pageSize };
}

function _pagerButton(label, enabled, onclick) {
  if (!enabled) {
    return `<button type="button" class="action-btn pager-btn" disabled>${label}</button>`;
  }
  return `<button type="button" class="action-btn pager-btn" onclick="${onclick}">${label}</button>`;
}

function _renderAdminPager(tab, rerenderFnName) {
  const pager = AdminPager[tab];
  if (!pager) return "";
  const pageNum = pager.page + 1;
  return `<div class="admin-pager">
    ${_pagerButton("← Prev", pager.page > 0, `adminSetPage('${tab}', -1, '${rerenderFnName}')`)}
    <span>Page ${pageNum}</span>
    ${_pagerButton("Next →", pager.hasNext, `adminSetPage('${tab}', 1, '${rerenderFnName}')`)}
  </div>`;
}

function adminSetPage(tab, delta, rerenderFnName) {
  const pager = AdminPager[tab];
  if (!pager) return;
  if (delta < 0 && pager.page === 0) return;
  if (delta > 0 && !pager.hasNext) return;
  _setAdminPage(tab, pager.page + delta);
  if (typeof window[rerenderFnName] === "function") window[rerenderFnName]();
}

function syncAdminMobileChrome() {
  const select = document.getElementById("adminTabSelect");
  if (select && select.value !== AppState.currentAdminTab) {
    select.value = AppState.currentAdminTab;
  }
  const add = document.getElementById("adminMobileAdd");
  if (add) add.hidden = true;
}

function adminTab(t) {
  AppState.currentAdminTab = t;
  AppState.adminSearch = "";
  AppState.adminFilterProg = "all";
  AppState.adminFilterYear = "all";
  AppState.adminFilterSem = "all";
  AppState.adminStudentId = null;
  _setAdminPage("studentTimeline", 0);
  if (AdminPager[t]) _setAdminPage(t, 0);
  if (t === "feedback" && typeof window.resetAdminFeedbackPage === "function") {
    window.resetAdminFeedbackPage();
  }
  if (t === "suggestions" && typeof window.resetAdminSuggestionPage === "function") {
    window.resetAdminSuggestionPage();
  }
  document.querySelectorAll(".admin-tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.adminTab === t);
  });
  syncAdminMobileChrome();
  renderAdminContent();
}

function shortUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname === "/" ? "" : u.pathname;
    const s = host + path;
    return s.length > 36 ? `${s.slice(0, 34)}…` : s;
  } catch {
    return url.length > 36 ? `${url.slice(0, 34)}…` : url;
  }
}

function adminUrlDisplay(url) {
  if (!url) return `<span class="admin-url is-empty">—</span>`;
  return `<span class="admin-url" title="${esc(url)}"><span class="admin-url-short">${esc(shortUrl(url))}</span><span class="admin-url-full">${esc(url)}</span></span>`;
}

function _adminLinkRow(l, editOnclick, deleteOnclick) {
  if (!isMobileView()) {
    return `
      <div class="link-chip">
        ${getLinkBadge(l.type)}
        <span class="link-label-with-langs">
          <span>${esc(l.label)}</span>
          ${getLanguageChips(l.languages)}
        </span>
        ${getContentTypeChips(l.content_type)}
        ${l.note ? `<span class="admin-muted">(${esc(l.note)})</span>` : ""}
        <button class="action-btn admin-chip-btn" onclick="${editOnclick}">✏️</button>
        <button class="action-btn del admin-chip-btn" onclick="${deleteOnclick}">✕</button>
      </div>`;
  }
  return `
    <div class="link-item admin-link-row">
      <div class="link-item-main">
        ${getLinkBadge(l.type)}
        <span class="link-label-with-langs">
          <span class="link-label">${esc(l.label)}</span>
          ${getLanguageChips(l.languages)}
        </span>
        ${l.note ? `<span class="link-note">${esc(l.note)}</span>` : ""}
      </div>
      ${getContentTypeChips(l.content_type)}
      <div class="admin-link-actions">
        <button class="action-btn" onclick="${editOnclick}">✏️ Edit</button>
        <button class="action-btn del" onclick="${deleteOnclick}">🗑 Delete</button>
      </div>
    </div>`;
}

function renderAdminContent() {
  loadReportsBadges();
  syncAdminMobileChrome();
  if (AppState.currentAdminTab === "structure") renderAdminStructure();
  else if (AppState.currentAdminTab === "courses") renderAdminCourses();
  else if (AppState.currentAdminTab === "extra") renderAdminExtra();
  else if (AppState.currentAdminTab === "feedback") renderAdminFeedback();
  else if (AppState.currentAdminTab === "suggestions") renderAdminSuggestions();
  else if (AppState.currentAdminTab === "reports") renderAdminReports();
  else if (AppState.currentAdminTab === "contributions") renderAdminContributions();
  else if (AppState.currentAdminTab === "students") renderAdminStudents();
  else renderAdminAnalytics();
}

async function renderAdminStructure() {
  const container = document.getElementById("adminContent");
  try {
    const [faculties, branches, specs, offerings, years, semesters] = await Promise.all([
      apiRequest("/api/admin/faculties"),
      apiRequest("/api/admin/branches"),
      apiRequest("/api/admin/specialisations"),
      apiRequest("/api/admin/branch_specialisations"),
      apiRequest("/api/admin/years"),
      apiRequest("/api/admin/semesters"),
    ]);
    AppState.adminStructCache = { faculties, branches, specs, offerings, years, semesters };

    const branchName = (id) => branches.find((b) => b.id === id)?.name || `#${id}`;
    const facName = (id) => faculties.find((f) => f.id === id)?.name || `#${id}`;
    const specName = (id) => specs.find((s) => s.id === id)?.name || `#${id}`;
    const offeringLabel = (id) => {
      const o = offerings.find((x) => x.id === id);
      if (!o) return `#${id}`;
      return `${branchName(o.branch_id)} · ${specName(o.specialisation_id)}`;
    };

    const step = AppState.adminStructStep || "faculties";

    if (step === "branches") {
      container.innerHTML = `
        <div class="admin-structure">
          <button type="button" class="nav-back" onclick="adminStructGo('faculties')">← Faculties</button>
          <div class="admin-struct-head">
            <h3>Campuses</h3>
            <p class="admin-struct-sub">Shared across faculties. Link them from each faculty page.</p>
          </div>
          <div class="admin-inline-form">
            <input id="newBranchName" placeholder="Campus name (e.g. Hadath)"/>
            <button class="btn btn-primary" onclick="adminCreateBranch()">Add campus</button>
          </div>
          <div class="admin-struct-list">
            ${branches.map((b) => {
              const facCount = (AppState.dbFaculties || []).filter((f) =>
                (f.branches || []).some((br) => br.id === b.id),
              ).length;
              return `<div class="admin-struct-row">
                <div>
                  <strong>${esc(b.name)}</strong>
                  <span class="admin-muted">${facCount} facult${facCount === 1 ? "y" : "ies"}</span>
                </div>
                <button class="action-btn del" onclick="adminDeleteEntity('branches',${b.id})">🗑</button>
              </div>`;
            }).join("") || '<div class="empty">No campuses yet.</div>'}
          </div>
        </div>`;
      return;
    }

    if (step === "offering") {
      const offering = offerings.find((o) => o.id === AppState.adminStructOfferingId);
      if (!offering) {
        AppState.adminStructStep = "faculty";
        renderAdminStructure();
        return;
      }
      const sp = specs.find((s) => s.id === offering.specialisation_id);
      const facId = sp?.faculty_id ?? AppState.adminStructFacultyId;
      const offsYears = years
        .filter((y) => y.branch_specialisation_id === offering.id)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      container.innerHTML = `
        <div class="admin-structure">
          <button type="button" class="nav-back" onclick="adminStructGo('faculty',${facId})">← ${esc(facName(facId))}</button>
          <div class="admin-struct-head">
            <h3>${esc(offeringLabel(offering.id))}</h3>
            <p class="admin-struct-sub">Years & semesters for this campus offering.</p>
          </div>
          <div class="admin-inline-form">
            <input id="newYearName" placeholder="Year name (e.g. Year 1)"/>
            <button class="btn btn-primary" onclick="adminCreateYear(${offering.id})">Add year</button>
          </div>
          ${offsYears.map((y) => {
            const sems = semesters
              .filter((s) => s.year_id === y.id)
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            return `<div class="admin-struct-panel">
              <div class="admin-struct-panel-head">
                <strong>${esc(y.name)}</strong>
                <button class="action-btn del" onclick="adminDeleteEntity('years',${y.id})">🗑</button>
              </div>
              <div class="admin-inline-form compact">
                <input id="newSemName-${y.id}" placeholder="Semester name (e.g. Semester 1)"/>
                <button class="btn btn-primary" onclick="adminCreateSemester(${y.id})">Add semester</button>
              </div>
              <div class="admin-struct-list tight">
                ${sems.map((s) => `<div class="admin-struct-row">
                  <strong>${esc(s.name)}</strong>
                  <button class="action-btn del" onclick="adminDeleteEntity('semesters',${s.id})">🗑</button>
                </div>`).join("") || '<div class="admin-muted">No semesters yet.</div>'}
              </div>
            </div>`;
          }).join("") || '<div class="empty">No years yet — add Year 1 to get started.</div>'}
        </div>`;
      return;
    }

    if (step === "faculty") {
      const fac = faculties.find((f) => f.id === AppState.adminStructFacultyId);
      if (!fac) {
        AppState.adminStructStep = "faculties";
        renderAdminStructure();
        return;
      }
      const facSpecs = specs
        .filter((s) => s.faculty_id === fac.id)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      const facTree = (AppState.dbFaculties || []).find((f) => f.id === fac.id);
      const linkedBranches = facTree?.branches || [];
      const linkedIds = new Set(linkedBranches.map((b) => b.id));
      const facOfferings = offerings.filter((o) => {
        const sp = specs.find((s) => s.id === o.specialisation_id);
        return sp && sp.faculty_id === fac.id;
      });
      const unlinkedBranches = branches.filter((b) => !linkedIds.has(b.id));

      container.innerHTML = `
        <div class="admin-structure">
          <button type="button" class="nav-back" onclick="adminStructGo('faculties')">← All faculties</button>
          <div class="admin-struct-head">
            <h3>${esc(fac.name)}</h3>
            <p class="admin-struct-sub">Specialisations, campuses, and offerings.</p>
          </div>

          <div class="admin-struct-grid">
            <section class="admin-struct-panel">
              <div class="admin-struct-panel-head"><h4>Specialisations</h4></div>
              <div class="admin-inline-form compact">
                <input id="newSpecName" placeholder="Specialisation name"/>
                <button class="btn btn-primary" onclick="adminCreateSpecialisation(${fac.id})">Add</button>
              </div>
              <div class="admin-struct-list tight">
                ${facSpecs.map((s) => `<div class="admin-struct-row">
                  <strong>${esc(s.name)}</strong>
                  <button class="action-btn del" onclick="adminDeleteEntity('specialisations',${s.id})">🗑</button>
                </div>`).join("") || '<div class="admin-muted">None yet.</div>'}
              </div>
            </section>

            <section class="admin-struct-panel">
              <div class="admin-struct-panel-head"><h4>Campuses</h4></div>
              <div class="admin-inline-form compact">
                <select id="linkBranchId">${unlinkedBranches.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join("") || '<option value="">All linked</option>'}</select>
                <button class="btn btn-primary" onclick="adminLinkFacultyBranch(${fac.id})" ${unlinkedBranches.length ? "" : "disabled"}>Link</button>
              </div>
              <div class="admin-struct-list tight">
                ${linkedBranches.map((b) => `<div class="admin-struct-row">
                  <strong>${esc(b.name)}</strong>
                  <button class="action-btn del" onclick="adminUnlinkFacultyBranch(${fac.id},${b.id})">Unlink</button>
                </div>`).join("") || '<div class="admin-muted">No campuses linked.</div>'}
              </div>
            </section>
          </div>

          <section class="admin-struct-panel" style="margin-top:14px;">
            <div class="admin-struct-panel-head">
              <h4>Offerings</h4>
              <span class="admin-muted">${facOfferings.length} total</span>
            </div>
            <div class="admin-inline-form">
              <select id="offerBranchId">${linkedBranches.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join("") || '<option value="">Link a campus first</option>'}</select>
              <select id="offerSpecId">${facSpecs.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("") || '<option value="">Add a specialisation first</option>'}</select>
              <button class="btn btn-primary" onclick="adminCreateOffering()" ${linkedBranches.length && facSpecs.length ? "" : "disabled"}>Offer</button>
            </div>
            <div class="admin-struct-list">
              ${facOfferings.map((o) => {
                const yCount = years.filter((y) => y.branch_specialisation_id === o.id).length;
                return `<div class="admin-struct-row">
                  <button type="button" class="admin-struct-row-main" onclick="adminStructGo('offering',${fac.id},${o.id})">
                    <span>
                      <strong>${esc(branchName(o.branch_id))} · ${esc(specName(o.specialisation_id))}</strong>
                      <span class="admin-muted">${yCount} year${yCount === 1 ? "" : "s"}</span>
                    </span>
                    <span class="pick-chev" aria-hidden="true">›</span>
                  </button>
                  <button class="action-btn del" onclick="adminDeleteEntity('branch_specialisations',${o.id})">🗑</button>
                </div>`;
              }).join("") || '<div class="empty">No offerings yet — link a campus and offer a specialisation.</div>'}
            </div>
          </section>
        </div>`;
      return;
    }

    // faculties root
    const cards = faculties
      .map((f) => {
        const facSpecs = specs.filter((s) => s.faculty_id === f.id);
        const facTree = (AppState.dbFaculties || []).find((x) => x.id === f.id);
        const campusCount = (facTree?.branches || []).length;
        const offerCount = offerings.filter((o) =>
          facSpecs.some((s) => s.id === o.specialisation_id),
        ).length;
        return `<button type="button" class="pick-card" onclick="adminStructGo('faculty',${f.id})">
          <span>
            <span class="pick-title">${esc(f.name.replace(/^Faculty of\s+/i, "").replace(/^Institute of\s+/i, "") || f.name)}</span>
            <small>${facSpecs.length} specialisation${facSpecs.length === 1 ? "" : "s"} · ${campusCount} campus${campusCount === 1 ? "" : "es"} · ${offerCount} offering${offerCount === 1 ? "" : "s"}</small>
          </span>
          <span class="pick-chev" aria-hidden="true">›</span>
        </button>`;
      })
      .join("");

    container.innerHTML = `
      <div class="admin-structure">
        <div class="admin-struct-head row">
          <div>
            <h3>Structure</h3>
            <p class="admin-struct-sub">Faculty → campus → specialisation → years.</p>
          </div>
          <button type="button" class="btn btn-ghost" onclick="adminStructGo('branches')">Manage campuses</button>
        </div>
        <div class="admin-inline-form">
          <input id="newFacultyName" placeholder="Faculty name"/>
          <button class="btn btn-primary" onclick="adminCreateFaculty()">Add faculty</button>
        </div>
        <div class="pick-grid">${cards || '<div class="empty">No faculties yet.</div>'}</div>
      </div>`;
  } catch (e) {
    container.innerHTML = `<div class="empty">⚠️ Failed to load structure: ${esc(e.message)}</div>`;
  }
}

async function adminCreateFaculty() {
  const name = document.getElementById("newFacultyName")?.value?.trim();
  if (!name) return showToast("Name required", true);
  await apiRequest("/api/admin/faculties", { method: "POST", body: { name } });
  showToast("Faculty added");
  await loadAll();
  renderAdminStructure();
}
async function adminCreateBranch() {
  const name = document.getElementById("newBranchName")?.value?.trim();
  if (!name) return showToast("Name required", true);
  await apiRequest("/api/admin/branches", { method: "POST", body: { name } });
  showToast("Campus added");
  await loadAll();
  renderAdminStructure();
}
async function adminLinkFacultyBranch(facultyId) {
  const fid = facultyId ?? document.getElementById("linkFacultyId")?.value;
  const bid = document.getElementById("linkBranchId")?.value;
  if (!fid || !bid) return showToast("Pick a campus", true);
  await apiRequest(`/api/admin/faculties/${fid}/branches/${bid}`, { method: "POST", body: {} });
  showToast("Campus linked");
  await loadAll();
  renderAdminStructure();
}
async function adminUnlinkFacultyBranch(facultyId, branchId) {
  if (!confirm("Unlink this campus from the faculty?")) return;
  await apiRequest(`/api/admin/faculties/${facultyId}/branches/${branchId}`, { method: "DELETE" });
  showToast("Unlinked");
  await loadAll();
  renderAdminStructure();
}
async function adminCreateSpecialisation(facultyId) {
  const name = document.getElementById("newSpecName")?.value?.trim();
  const faculty_id = facultyId ?? parseInt(document.getElementById("newSpecFacultyId")?.value, 10);
  if (!name) return showToast("Name required", true);
  await apiRequest("/api/admin/specialisations", { method: "POST", body: { name, faculty_id } });
  showToast("Specialisation added");
  await loadAll();
  renderAdminStructure();
}
async function adminCreateOffering() {
  const branch_id = parseInt(document.getElementById("offerBranchId")?.value, 10);
  const specialisation_id = parseInt(document.getElementById("offerSpecId")?.value, 10);
  if (!branch_id || !specialisation_id) return showToast("Pick campus and specialisation", true);
  await apiRequest("/api/admin/branch_specialisations", { method: "POST", body: { branch_id, specialisation_id } });
  showToast("Offering added");
  await loadAll();
  renderAdminStructure();
}
async function adminCreateYear(offeringId) {
  const name = document.getElementById("newYearName")?.value?.trim();
  const branch_specialisation_id =
    offeringId ?? parseInt(document.getElementById("newYearOfferingId")?.value, 10);
  if (!name) return showToast("Name required", true);
  await apiRequest("/api/admin/years", { method: "POST", body: { name, branch_specialisation_id } });
  showToast("Year added");
  await loadAll();
  renderAdminStructure();
}
async function adminCreateSemester(yearId) {
  const input =
    (yearId && document.getElementById(`newSemName-${yearId}`)) ||
    document.getElementById("newSemName");
  const name = input?.value?.trim();
  const year_id = yearId ?? parseInt(document.getElementById("newSemYearId")?.value, 10);
  if (!name) return showToast("Name required", true);
  await apiRequest("/api/admin/semesters", { method: "POST", body: { name, year_id } });
  showToast("Semester added");
  await loadAll();
  renderAdminStructure();
}
async function adminDeleteEntity(kind, id) {
  if (!confirm("Delete this item?")) return;
  await apiRequest(`/api/admin/${kind}/${id}`, { method: "DELETE" });
  showToast("Deleted");
  await loadAll();
  renderAdminStructure();
}

function adminStructGo(step, facultyId = null, offeringId = null) {
  AppState.adminStructStep = step;
  if (facultyId != null) AppState.adminStructFacultyId = facultyId;
  if (step === "faculties") {
    AppState.adminStructFacultyId = null;
    AppState.adminStructOfferingId = null;
  }
  if (step === "faculty") AppState.adminStructOfferingId = null;
  if (step === "offering") AppState.adminStructOfferingId = offeringId;
  renderAdminStructure();
}

window.renderAdminStructure = renderAdminStructure;
window.adminCreateFaculty = adminCreateFaculty;
window.adminCreateBranch = adminCreateBranch;
window.adminLinkFacultyBranch = adminLinkFacultyBranch;
window.adminUnlinkFacultyBranch = adminUnlinkFacultyBranch;
window.adminCreateSpecialisation = adminCreateSpecialisation;
window.adminCreateOffering = adminCreateOffering;
window.adminCreateYear = adminCreateYear;
window.adminCreateSemester = adminCreateSemester;
window.adminDeleteEntity = adminDeleteEntity;
window.adminStructGo = adminStructGo;

function _refocusSearch() {
  const s = document.querySelector("#adminContent .admin-search");
  if (s) {
    s.focus();
    s.setSelectionRange(s.value.length, s.value.length);
  }
}

// ===================== ANALYTICS =====================
function resolveLinkInfo(kind, linkId) {
  let info = { label: "Unknown Link", courseName: "Unknown Course", programName: "" };
  if (kind === "extra_link") {
    AppState.dbExtra.forEach((r) =>
      r.links.forEach((l) => {
        if (l.id == linkId) info = { label: l.label, courseName: r.title, programName: "" };
      }),
    );
    return info;
  }
  AppState.dbPrograms.forEach((p) =>
    p.years.forEach((y) =>
      y.sems.forEach((s) =>
        s.courses.forEach((c) =>
          c.links.forEach((l) => {
            if (l.id == linkId) info = { label: l.label, courseName: c.name, programName: p.name || "" };
          }),
        ),
      ),
    ),
  );
  return info;
}

function _shortProgramName(programName) {
  const raw = String(programName || "").trim();
  if (!raw) return "";
  return raw
    .split(/\s*[·/,]\s*/)
    .map((part) => {
      const name = part.trim();
      if (!name) return "";
      const lower = name.toLowerCase();
      if (lower.includes("aisl")) return "AISL";
      if (lower.includes("irsm")) return "IRSM";
      if (lower.includes("licence") || lower.includes("license")) return "License";
      return name.replace(/^master\s+/i, "").trim() || name;
    })
    .filter(Boolean)
    .join(" · ");
}

function _programSuffix(programName) {
  const name = _shortProgramName(programName);
  if (!name) return "";
  return ` ${esc(name)}`;
}

function _num(value) {
  return (Number(value) || 0).toLocaleString();
}

function buildTopLinksList(topLinks, expandKey = null) {
  const rows = (topLinks || [])
    .map((row) => {
      const isExtra = row.extra_link_id != null;
      return {
        kind: isExtra ? "extra_link" : "link",
        id: isExtra ? row.extra_link_id : row.link_id,
        clicks: Number(row.clicks) || 0,
      };
    })
    .filter((row) => row.id != null)
    .sort((a, b) => b.clicks - a.clicks);

  if (!rows.length) {
    return `<div style="color:var(--muted);font-size:0.9rem;">No click data.</div>`;
  }

  const expanded = Boolean(expandKey && AppState[expandKey]);
  const visible = expanded ? rows : rows.slice(0, 10);
  const items = visible
    .map((row) => {
      const info = resolveLinkInfo(row.kind, row.id);
      return `<li><strong>${_num(row.clicks)}</strong> clicks: ${esc(info.label)} <span style="color:var(--muted);font-size:0.8rem">(${esc(info.courseName)})${_programSuffix(info.programName)}</span></li>`;
    })
    .join("");

  const expandBtn =
    expandKey && rows.length > 10
      ? `<button type="button" class="filter-btn" style="margin-top:12px;" onclick="analyticsToggleExpand('${expandKey}')">${expanded ? "Show less" : "Show All"}</button>`
      : "";

  return `<ul style="list-style:none;padding:0;">${items}</ul>${expandBtn}`;
}

function buildTabbedTopLinksCard(summary) {
  const tab = AppState.analyticsLinksTab === "range" ? "range" : "today";
  const isToday = tab === "today";
  const expandKey = isToday ? "analyticsTopLinksTodayExpanded" : "analyticsTopLinksExpanded";
  const links = isToday ? summary.top_links_today : summary.top_links;

  const tabButtons = ["today", "range"]
    .map((t) => {
      const label = t === "today" ? "Today" : "In range";
      return `<button type="button" class="filter-btn ${tab === t ? "active" : ""}" onclick="AppState.analyticsLinksTab='${t}';analyticsPaintLocal()">${label}</button>`;
    })
    .join("");

  return `<div class="chart-wrap analytics-card">
    <div class="chart-title">🔥 Top clicked links</div>
    <div class="analytics-tabs">${tabButtons}</div>
    ${buildTopLinksList(links, expandKey)}
  </div>`;
}

function buildTopUsersInRangeSection(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) {
    return `<div class="chart-wrap analytics-card">
      <div class="chart-title">🏆 Top students (in range)</div>
      <div style="color:var(--muted);font-size:0.9rem;">No clicks in this range yet.</div>
    </div>`;
  }

  const expandKey = "analyticsTopUsersExpanded";
  const expanded = Boolean(AppState[expandKey]);
  const visible = expanded ? list : list.slice(0, 10);
  const items = visible
    .map((row) => {
      const id = Number(row.user_id);
      const handle = row.handle || (Number.isFinite(id) ? `#${id}` : "unknown");
      const label = Number.isFinite(id)
        ? `<button class="action-btn" onclick="openAdminStudent(${id})" title="Open student history">${esc(handle)}</button>`
        : esc(handle);
      return `<li style="margin-bottom:8px;"><strong>${_num(row.clicks)}</strong> clicks — ${label}</li>`;
    })
    .join("");

  const expandBtn =
    list.length > 10
      ? `<button type="button" class="filter-btn" style="margin-top:12px;" onclick="analyticsToggleExpand('${expandKey}')">${expanded ? "Show less" : "Show All"}</button>`
      : "";

  return `<div class="chart-wrap analytics-card">
    <div class="chart-title">🏆 Top students (in range)</div>
    <ul style="list-style:none;padding:0;margin-top:8px;">${items}</ul>
    ${expandBtn}
  </div>`;
}

function _visitorsTodayPage(summary) {
  const raw = summary?.visitors_today;
  if (Array.isArray(raw)) {
    return {
      visitors: raw,
      hasMore: Boolean(summary.visitors_has_more),
      total: Number(summary.visitors_today_total) || Number(summary.active_today) || raw.length,
    };
  }
  return {
    visitors: Array.isArray(raw?.visitors) ? raw.visitors : [],
    hasMore: Boolean(raw?.has_more),
    total: Number(summary.active_today) || 0,
  };
}

function buildVisitorChipsSection(summary) {
  const { visitors, hasMore, total } = _visitorsTodayPage(summary);
  const sort = AppState.analyticsVisitorsSort === "name" ? "name" : "clicks";
  const sortButtons = ["clicks", "name"]
    .map((s) => {
      const label = s === "clicks" ? "Most activity" : "Name";
      return `<button type="button" class="filter-btn ${sort === s ? "active" : ""}" onclick="AppState.analyticsVisitorsSort='${s}';AppState.analyticsVisitorsOffset=0;analyticsPaintLocal()">${label}</button>`;
    })
    .join("");

  if (!visitors.length) {
    return `<div class="chart-wrap analytics-card">
      <div class="chart-title">👀 Who visited today</div>
      <div class="analytics-tabs">${sortButtons}</div>
      <div style="color:var(--muted);margin-top:16px;font-size:0.9rem;">Nobody has visited yet today.</div>
    </div>`;
  }

  const chips = visitors
    .map((row) => {
      const id = Number(row.user_id);
      const handle = row.handle || (Number.isFinite(id) ? `#${id}` : "unknown");
      const clicks = Number(row.clicks) || 0;
      const badge = clicks > 0 ? `<span class="badge-count">${_num(clicks)}</span>` : "";
      const onclick = Number.isFinite(id) ? `openAdminStudent(${id})` : "";
      return `<button type="button" class="visitor-chip" ${onclick ? `onclick="${onclick}"` : ""} title="Open student history">
        <span class="visitor-chip-handle">${esc(handle)}</span>${badge}
      </button>`;
    })
    .join("");

  const offset = Number(AppState.analyticsVisitorsOffset) || 0;
  const pageSize = ANALYTICS_VISITORS_PAGE_SIZE;
  const pageNum = Math.floor(offset / pageSize) + 1;
  const hasPrev = offset > 0;
  const totalHint = Number.isFinite(total) && total > 0
    ? `<span style="font-size:0.8rem;color:var(--muted);margin-left:8px;">${_num(total)} total</span>`
    : "";

  const pager = `<div class="admin-pager">
    ${_pagerButton("← Prev", hasPrev, `AppState.analyticsVisitorsOffset=Math.max(0,${offset}-${pageSize});analyticsPaintLocal()`)}
    <span>Page ${pageNum}</span>
    ${_pagerButton("Next →", hasMore, `AppState.analyticsVisitorsOffset=${offset + pageSize};analyticsPaintLocal()`)}
  </div>`;

  return `<div class="chart-wrap analytics-card">
    <div class="chart-title">👀 Who visited today${totalHint}</div>
    <div class="analytics-tabs">${sortButtons}</div>
    <div class="visitor-chips">${chips}</div>
    ${pager}
  </div>`;
}

function _deviceTodayParts(devices) {
  if (!devices || typeof devices !== "object") return { val: "0", sub: "" };
  const phone = Number(devices.phone) || 0;
  const laptop = Number(devices.laptop) || 0;
  const both = Number(devices.both) || 0;
  if (!phone && !laptop) return { val: "0", sub: "" };
  let sub = "unique students";
  if (both) sub += ` · ${_num(both)} used both`;
  if (phone && laptop) return { val: `${_num(phone)}/${_num(laptop)}`, sub: `phone / laptop · ${sub}` };
  if (phone) return { val: _num(phone), sub: `phone · ${sub}` };
  return { val: _num(laptop), sub: `laptop · ${sub}` };
}

function _deviceLabel(type) {
  if (type === "phone") return "📱 Phone";
  if (type === "laptop") return "💻 Laptop";
  return "—";
}

function _pctDelta(current, previous) {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev <= 0) return cur > 0 ? "+new" : "—";
  const pct = Math.round(((cur - prev) / prev) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

function _pctGrowth(added, base) {
  const a = Number(added) || 0;
  const b = Number(base) || 0;
  if (b <= 0) return a > 0 ? "+new" : "—";
  return `+${Math.round((a / b) * 100)}%`;
}

function _pctOfTotal(part, total) {
  const p = Number(part) || 0;
  const t = Number(total) || 0;
  if (t <= 0) return "—";
  return `${Math.round((p / t) * 100)}%`;
}

function _showAllList(rows, expandKey, emptyMsg, renderItem) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) {
    return `<div style="color:var(--muted);font-size:0.9rem;">${esc(emptyMsg)}</div>`;
  }
  const expanded = Boolean(AppState[expandKey]);
  const visible = expanded ? list : list.slice(0, 10);
  const items = visible.map(renderItem).join("");
  const expandBtn =
    list.length > 10
      ? `<button type="button" class="filter-btn" style="margin-top:12px;" onclick="analyticsToggleExpand('${expandKey}')">${expanded ? "Show less" : "Show All"}</button>`
      : "";
  return `<ul style="list-style:none;padding:0;margin:0;">${items}</ul>${expandBtn}`;
}

function _courseDemandList(rows, emptyMsg, countLabel = "clicks", expandKey = null) {
  return _showAllList(rows, expandKey, emptyMsg, (row) =>
    `<li style="margin-bottom:8px;"><strong>${_num(row.count)}</strong> ${esc(countLabel)}: ${esc(row.name)} <span style="color:var(--muted);font-size:0.8rem;">(${esc(row.code)})${_programSuffix(row.program_name)}</span></li>`,
  );
}

function _deadLinksList(rows, expandKey = null) {
  return _showAllList(rows, expandKey, "Every link got at least one click in this range.", (row) => {
    const fromTree = row.kind === "link" ? resolveLinkInfo("link", row.id) : { programName: "" };
    const program = row.program_name || fromTree.programName;
    return `<li style="margin-bottom:8px;">${esc(row.label)} <span style="color:var(--muted);font-size:0.8rem;">(${esc(row.course_name)})${_programSuffix(program)}</span></li>`;
  });
}

function _searchTermsList(rows, expandKey = null) {
  return _showAllList(rows, expandKey, "No searches tracked in this range yet.", (row) =>
    `<li style="margin-bottom:8px;"><strong>${_num(row.count)}</strong> × <code>${esc(row.query)}</code></li>`,
  );
}

function _heatmapCellStyle(n, max) {
  if (!n) return "";
  const t = max ? Math.min(1, Math.sqrt(n / max)) : 0;
  // Cream → teal → gold → coral so quiet hours stay warm and peaks pop.
  const stops = [
    { t: 0, h: 165, s: 55, l: 78 },
    { t: 0.35, h: 168, s: 72, l: 42 },
    { t: 0.7, h: 38, s: 95, l: 52 },
    { t: 1, h: 8, s: 88, l: 54 },
  ];
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const span = b.t - a.t || 1;
  const p = (t - a.t) / span;
  const h = a.h + (b.h - a.h) * p;
  const s = a.s + (b.s - a.s) * p;
  const l = a.l + (b.l - a.l) * p;
  const color = l < 58 ? "#fff" : "#14302c";
  const glow = t > 0.55 ? `box-shadow:0 0 10px hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${l.toFixed(0)}% / 0.45);` : "";
  return `background:hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${l.toFixed(0)}%);color:${color};font-weight:700;${glow}`;
}

function _buildHeatmap(cells, unit = "events") {
  const unitLabel = unit || "events";
  const map = new Map();
  let max = 0;
  const mobile = isMobileView();
  const step = mobile ? 2 : 1;
  const startHour = 0;
  const endHour = 23;

  (cells || []).forEach((c) => {
    const hour = Number(c.hour) || 0;
    const bucket = hour - (hour % step);
    const key = `${Number(c.dow)}-${bucket}`;
    const n = (map.get(key) || 0) + (Number(c.count) || 0);
    map.set(key, n);
    if (n > max) max = n;
  });

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = [];
  for (let h = startHour; h <= endHour; h += step) hours.push(h);

  const head = `<div class="heatmap-cell heatmap-label"></div>${hours
    .map((h) => `<div class="heatmap-cell heatmap-label">${h}</div>`)
    .join("")}`;
  const body = days
    .map((label, dow) => {
      const row = hours
        .map((hour) => {
          const n = map.get(`${dow}-${hour}`) || 0;
          const end = hour + step - 1;
          const title = step === 1
            ? `${label} ${hour}:00 — ${_num(n)} ${unitLabel}`
            : `${label} ${hour}:00–${end}:59 — ${_num(n)} ${unitLabel}`;
          const empty = n === 0 ? " heatmap-empty" : " heatmap-hit";
          const labelText = n ? _num(n) : "";
          return `<div class="heatmap-cell${empty}" title="${title}" style="${_heatmapCellStyle(n, max)}">${labelText}</div>`;
        })
        .join("");
      return `<div class="heatmap-cell heatmap-label">${label}</div>${row}`;
    })
    .join("");

  return `<div class="heatmap-scroll"><div class="heatmap-grid" style="--heatmap-cols:${hours.length}">${head}${body}</div></div>
    <div class="heatmap-legend" aria-hidden="true">
      <span>Quiet</span>
      <span class="heatmap-legend-swatch heatmap-legend-0"></span>
      <span class="heatmap-legend-swatch heatmap-legend-1"></span>
      <span class="heatmap-legend-swatch heatmap-legend-2"></span>
      <span class="heatmap-legend-swatch heatmap-legend-3"></span>
      <span>Busy</span>
    </div>`;
}

function _formatGain(value) {
  const n = Number(value) || 0;
  return `+${_num(n)}`;
}

function _statsInRangeSection(summary, range) {
  const total = Number(summary.total_students) || 0;
  const newStudents = Number(summary.funnel?.signed_up) || 0;
  const rosterAtStart = Math.max(0, total - newStudents);
  const active = Number(summary.active_registered_in_range) || 0;
  const newPct = _pctGrowth(newStudents, rosterAtStart);
  const activePct = _pctOfTotal(active, total);

  return `<div class="chart-wrap analytics-card analytics-stats-range">
    <div class="chart-title">📊 Stats in range (${esc(range)} days)</div>
    <div class="analytics-stats-grid">
      <div class="analytics-stat-tile">
        <div class="analytics-stat-val">${_num(newStudents)} <span class="analytics-stat-pct">(${esc(newPct)})</span></div>
        <div class="analytics-stat-label">New students vs roster at start</div>
      </div>
      <div class="analytics-stat-tile">
        <div class="analytics-stat-val">${_num(active)} <span class="analytics-stat-pct">(${esc(activePct)})</span></div>
        <div class="analytics-stat-label">Active registered students of total roster</div>
      </div>
    </div>
  </div>`;
}

/** Pad the server's sparse per-day series so the chart always spans the range. */
function _dailyUniqueSeries(daily, rangeDays) {
  const byDay = new Map();
  (daily || []).forEach((d) => {
    const key = String(d?.day || "").slice(0, 10);
    if (key) byDay.set(key, Number(d.users) || 0);
  });
  const now = Date.now();
  const days = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const key = new Date(now - i * 86400000).toISOString().slice(0, 10);
    days.push({ date: key, count: byDay.get(key) || 0 });
  }
  return days;
}

/** Pad cumulative roster totals per day for the growth chart. */
function _dailyRosterSeries(daily, rangeDays) {
  const byDay = new Map();
  (daily || []).forEach((d) => {
    const key = String(d?.day || "").slice(0, 10);
    if (key) byDay.set(key, Number(d.total) || 0);
  });
  const now = Date.now();
  const days = [];
  let lastKnown = 0;
  for (let i = rangeDays - 1; i >= 0; i--) {
    const key = new Date(now - i * 86400000).toISOString().slice(0, 10);
    if (byDay.has(key)) lastKnown = byDay.get(key);
    days.push({ date: key, count: lastKnown });
  }
  return days;
}

function _buildBarChart(days, range, todayStr) {
  const maxCount = Math.max(...days.map((d) => d.count), 1);
  const labelStep = range === "7" ? 1 : range === "30" ? 5 : 15;

  function fmtDay(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en", { month: "short", day: "numeric" });
  }

  return days
    .map((d, i) => {
      const pct = Math.round((d.count / maxCount) * 100);
      const showLabel = i % labelStep === 0 || i === days.length - 1;
      return `<div class="bar-col"><div class="bar-val">${d.count}</div><div class="bar-fill" style="height:${Math.max(pct, d.count > 0 ? 4 : 0)}%;background:${d.date === todayStr ? "var(--accent2)" : "var(--accent)"}"></div><div class="bar-label">${showLabel ? fmtDay(d.date) : ""}</div></div>`;
    })
    .join("");
}

let _analyticsRangeCache = Object.create(null);
let _analyticsVisitorsAll = null;
let _analyticsFetchGen = 0;
const _analyticsRangeInflight = Object.create(null);

function _analyticsRangeKey() {
  return ["7", "30", "90"].includes(String(AppState.analyticsRange))
    ? String(AppState.analyticsRange)
    : "30";
}

function _sortVisitorsToday(visitors, sort) {
  const list = (visitors || []).slice();
  const byHandle = (a, b) =>
    String(a.handle || "").localeCompare(String(b.handle || ""), undefined, { sensitivity: "base", numeric: true });
  if (sort === "name") {
    list.sort(byHandle);
  } else {
    list.sort((a, b) => (Number(b.clicks) || 0) - (Number(a.clicks) || 0) || byHandle(a, b));
  }
  return list;
}

function _withLocalVisitors(summary) {
  const all = Array.isArray(_analyticsVisitorsAll) ? _analyticsVisitorsAll : null;
  if (!all) return summary;
  const sort = AppState.analyticsVisitorsSort === "name" ? "name" : "clicks";
  const sorted = _sortVisitorsToday(all, sort);
  const pageSize = ANALYTICS_VISITORS_PAGE_SIZE;
  let offset = Math.max(0, Number(AppState.analyticsVisitorsOffset) || 0);
  if (sorted.length && offset >= sorted.length) {
    offset = Math.max(0, Math.floor((sorted.length - 1) / pageSize) * pageSize);
    AppState.analyticsVisitorsOffset = offset;
  }
  return {
    ...summary,
    visitors_today: {
      visitors: sorted.slice(offset, offset + pageSize),
      has_more: offset + pageSize < sorted.length,
    },
  };
}

async function _fetchAnalyticsSummary(range, gen) {
  const key = String(range);
  const inflightKey = `${gen}:${key}`;
  if (_analyticsRangeInflight[inflightKey]) return _analyticsRangeInflight[inflightKey];
  const req = (async () => {
    const query = new URLSearchParams({
      range: key,
      visitors_limit: "100",
      visitors_offset: "0",
      visitors_sort: "clicks",
    });
    const summary = (await sb(`analytics/summary?${query}`, "GET")) || {};
    if (gen === _analyticsFetchGen) _analyticsRangeCache[key] = summary;
    return summary;
  })();
  _analyticsRangeInflight[inflightKey] = req;
  try {
    return await req;
  } finally {
    if (_analyticsRangeInflight[inflightKey] === req) delete _analyticsRangeInflight[inflightKey];
  }
}

function _prefetchAnalyticsRanges(currentRange, gen) {
  for (const r of ["7", "30", "90"]) {
    if (r === currentRange || _analyticsRangeCache[r]) continue;
    _fetchAnalyticsSummary(r, gen).catch(() => {});
  }
}

function analyticsSelectRange(range) {
  if (["7", "30", "90"].includes(String(range))) AppState.analyticsRange = String(range);
  const key = _analyticsRangeKey();
  if (_analyticsRangeCache[key]) {
    analyticsPaintLocal();
    return;
  }
  const gen = _analyticsFetchGen;
  const pending = _analyticsRangeInflight[`${gen}:${key}`] || _fetchAnalyticsSummary(key, gen);
  pending.then(() => {
    if (_analyticsRangeKey() === key && _analyticsRangeCache[key]) analyticsPaintLocal();
  }).catch(() => {});
}

function analyticsToggleExpand(key) {
  AppState[key] = !AppState[key];
  analyticsPaintLocal();
}

function analyticsPaintLocal() {
  const summary = _analyticsRangeCache[_analyticsRangeKey()];
  if (!summary) {
    renderAdminAnalytics();
    return;
  }
  const y = window.scrollY;
  const heatScrolls = [...document.querySelectorAll(".heatmap-scroll")].map((el) => el.scrollLeft);
  paintAdminAnalytics(_withLocalVisitors(summary));
  window.scrollTo(0, y);
  document.querySelectorAll(".heatmap-scroll").forEach((el, i) => {
    el.scrollLeft = heatScrolls[i] || 0;
  });
}

function paintAdminAnalytics(summary) {
  const range = ["7", "30", "90"].includes(String(AppState.analyticsRange))
    ? String(AppState.analyticsRange)
    : "30";
  const chartSeries = AppState.analyticsChartSeries === "roster" ? "roster" : "visitors";
  const rangeDays = parseInt(range, 10);
    const todayStr = new Date().toISOString().slice(0, 10);
    const chartDays =
      chartSeries === "roster"
        ? _dailyRosterSeries(summary.daily_roster, rangeDays)
        : _dailyUniqueSeries(summary.daily_unique_visits, rangeDays);
    const barsHtml = _buildBarChart(chartDays, range, todayStr);

    const rangeButtons = ["7", "30", "90"]
      .map((r) => `<button type="button" class="filter-btn ${range === r ? "active" : ""}" onclick="analyticsSelectRange('${r}')">${r} days</button>`)
      .join("");

    const seriesButtons = ["visitors", "roster"]
      .map((s) => {
        const label = s === "visitors" ? "Unique visitors" : "Registered students";
        return `<button type="button" class="filter-btn ${chartSeries === s ? "active" : ""}" onclick="AppState.analyticsChartSeries='${s}';analyticsPaintLocal()">${label}</button>`;
      })
      .join("");

    const chartTitle =
      chartSeries === "roster"
        ? `Registered students over time — <span style="color:var(--accent2);">■</span> today`
        : `Unique students per day — <span style="color:var(--accent2);">■</span> today`;

    const gained7 = Number(summary.students_gained_7d) || 0;
    const deviceRange = _deviceTodayParts(summary.devices_in_range);
    const activeRange = Number(summary.active_in_range) || 0;
    const clicksRange = Number(summary.clicks_in_range) || 0;
    const clickers = Number(summary.clickers_in_range) || 0;
    const clicksPerActive = Number(summary.clicks_per_active) || 0;
    const funnel = summary.funnel || {};
    const browse = summary.browse || {};

    document.getElementById("adminContent").innerHTML = `
      <div class="analytics-stack">
      <div class="stat-grid analytics-kpis">
          <div class="stat-card">
            <div class="stat-val">${_num(summary.total_students)}</div>
            <div class="stat-mid"><span class="stat-delta">${_formatGain(gained7)} this week</span></div>
            <div class="stat-label">Registered students</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${_num(activeRange)}</div>
            <div class="stat-mid"><span class="stat-sub">today ${_num(summary.active_today)} · ${_pctDelta(activeRange, summary.prev_active_in_range)} vs prior</span></div>
            <div class="stat-label">Active in range</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${_num(clicksRange)}</div>
            <div class="stat-mid"><span class="stat-sub">${_num(clickers)} people · ${clicksPerActive.toFixed(1)} / active</span></div>
            <div class="stat-label">Clicks in range</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${deviceRange.val}</div>
            <div class="stat-mid">${deviceRange.sub ? `<span class="stat-sub">${deviceRange.sub}</span>` : ""}</div>
            <div class="stat-label">Device in range</div>
          </div>
      </div>
      <div class="stat-grid analytics-kpis">
          <div class="stat-card">
            <div class="stat-val">${_num(summary.returning_in_range)} / ${_num(summary.new_in_range)}</div>
            <div class="stat-mid"><span class="stat-sub">returning / new visitors</span></div>
            <div class="stat-label">Audience mix</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${_num(funnel.signed_up)} / ${_num(funnel.arrivals)}</div>
            <div class="stat-mid"><span class="stat-sub">${_num(funnel.still_guest)} still guest · ${_num(funnel.guests_open)} open guests</span></div>
            <div class="stat-label">Signup funnel</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${_num(browse.reached_year)} → ${_num(browse.reached_list)}</div>
            <div class="stat-mid"><span class="stat-sub">reached year → semester list</span></div>
            <div class="stat-label">Browse depth</div>
          </div>
      </div>
      <div class="chart-wrap analytics-card">
          <div class="chart-title">Growth</div>
          <div class="analytics-range">${rangeButtons}</div>
          <div class="analytics-chart-series">${seriesButtons}</div>
          <div class="chart-title" style="margin-top:0;margin-bottom:12px;font-size:0.88rem;font-weight:600;">${chartTitle}</div>
          <div class="bar-chart-scroll"><div class="bar-chart">${barsHtml}</div></div>
      </div>
      ${_statsInRangeSection(summary, range)}
      <div class="analytics-two-col">
        ${buildVisitorChipsSection(summary)}
        ${buildTabbedTopLinksCard(summary)}
      </div>
      <div class="analytics-two-col">
        <div class="chart-wrap analytics-card">
          <div class="chart-title">📚 Top courses (in range)</div>
          ${_courseDemandList(summary.top_courses, "No course clicks in this range.", "clicks", "analyticsTopCoursesExpanded")}
        </div>
        <div class="chart-wrap analytics-card">
          <div class="chart-title">🕳️ Courses with zero clicks</div>
          ${_courseDemandList(summary.zero_click_courses, "Every course with links got clicks.", "links ignored", "analyticsZeroCoursesExpanded")}
        </div>
      </div>
      <div class="analytics-two-col">
        <div class="chart-wrap analytics-card">
          <div class="chart-title">💤 Links never opened</div>
          ${_deadLinksList(summary.zero_click_links, "analyticsZeroLinksExpanded")}
        </div>
        ${buildTopUsersInRangeSection(summary.top_users)}
      </div>
      <div class="analytics-two-col">
        <div class="chart-wrap analytics-card">
          <div class="chart-title">⭐ Most favorited</div>
          ${_courseDemandList(summary.top_favorites, "No favorites yet.", "stars", "analyticsTopFavoritesExpanded")}
        </div>
        <div class="chart-wrap analytics-card">
          <div class="chart-title">🔎 Search terms</div>
          ${_searchTermsList(summary.search_terms, "analyticsSearchExpanded")}
        </div>
      </div>
      <div class="analytics-heatmap-stack">
        <div class="chart-wrap analytics-card analytics-heatmap-card">
          <div class="chart-title">🗓️ Page visits</div>
          <p class="analytics-heatmap-desc">When students load pages — by day and hour in the selected range.</p>
          ${_buildHeatmap(summary.visit_heatmap, "visits")}
        </div>
        <div class="chart-wrap analytics-card analytics-heatmap-card">
          <div class="chart-title">🔗 Link clicks</div>
          <p class="analytics-heatmap-desc">When students open course links — by day and hour in the selected range.</p>
          ${_buildHeatmap(summary.click_heatmap, "clicks")}
        </div>
      </div>
      <p class="analytics-footnote">Unique students where noted — device counts people, not tab loads. Search and browse depth fill in as new traffic arrives after deploy.</p>
      </div>`;
}

async function renderAdminAnalytics() {
  document.getElementById("adminContent").innerHTML = getAdminAnalyticsSkeleton();
  const gen = ++_analyticsFetchGen;
  _analyticsRangeCache = Object.create(null);
  _analyticsVisitorsAll = null;
  const range = _analyticsRangeKey();
  try {
    const summary = await _fetchAnalyticsSummary(range, gen);
    if (gen !== _analyticsFetchGen) return;
    _analyticsVisitorsAll = _visitorsTodayPage(summary).visitors.slice();
    paintAdminAnalytics(_withLocalVisitors(summary));
    _prefetchAnalyticsRanges(range, gen);
  } catch (e) {
    if (gen !== _analyticsFetchGen) return;
    _analyticsRangeCache = Object.create(null);
    _analyticsVisitorsAll = null;
    document.getElementById("adminContent").innerHTML = `<div class="empty">⚠️ Could not load analytics: ${esc(e.message)}</div>`;
  }
}

// ===================== ADMIN COURSES =====================
function _adminCoursePrograms() {
  let list = AppState.dbPrograms || [];
  if (AppState.adminFilterFaculty !== "all") {
    list = list.filter((p) => p.faculty_id === AppState.adminFilterFaculty);
  }
  if (AppState.adminFilterBranch !== "all") {
    list = list.filter((p) => p.branch_id === AppState.adminFilterBranch);
  }
  if (AppState.adminFilterProg !== "all") {
    list = list.filter((p) => p.id === AppState.adminFilterProg);
  }
  return list;
}

function _adminFilterSelect(id, label, value, options, onchange) {
  return `<label class="admin-filter-field">
    <span>${esc(label)}</span>
    <select id="${id}" onchange="${onchange}">
      ${options
        .map(
          ([v, text]) =>
            `<option value="${v}" ${String(value) === String(v) ? "selected" : ""}>${esc(text)}</option>`,
        )
        .join("")}
    </select>
  </label>`;
}

function adminCoursesSetFaculty(val) {
  AppState.adminFilterFaculty = val === "all" ? "all" : parseInt(val, 10);
  AppState.adminFilterBranch = "all";
  AppState.adminFilterProg = "all";
  AppState.adminFilterYear = "all";
  AppState.adminFilterSem = "all";
  renderAdminCourses();
}
function adminCoursesSetBranch(val) {
  AppState.adminFilterBranch = val === "all" ? "all" : parseInt(val, 10);
  AppState.adminFilterProg = "all";
  AppState.adminFilterYear = "all";
  AppState.adminFilterSem = "all";
  renderAdminCourses();
}
function adminCoursesSetProg(val) {
  AppState.adminFilterProg = val === "all" ? "all" : parseInt(val, 10);
  AppState.adminFilterYear = "all";
  AppState.adminFilterSem = "all";
  renderAdminCourses();
}
function adminCoursesSetYear(val) {
  AppState.adminFilterYear = val === "all" ? "all" : parseInt(val, 10);
  AppState.adminFilterSem = "all";
  renderAdminCourses();
}
function adminCoursesSetSem(val) {
  AppState.adminFilterSem = val === "all" ? "all" : parseInt(val, 10);
  renderAdminCourses();
}

window.adminCoursesSetFaculty = adminCoursesSetFaculty;
window.adminCoursesSetBranch = adminCoursesSetBranch;
window.adminCoursesSetProg = adminCoursesSetProg;
window.adminCoursesSetYear = adminCoursesSetYear;
window.adminCoursesSetSem = adminCoursesSetSem;

function renderAdminCourses() {
  const q = AppState.adminSearch.toLowerCase().trim();
  const faculties = AppState.dbFaculties || [];
  const allPrograms = AppState.dbPrograms || [];

  const facultyOpts = [["all", "All faculties"], ...faculties.map((f) => [f.id, f.name])];
  let branchOpts = [["all", "All campuses"]];
  let progOpts = [["all", "All specialisations"]];

  const facScoped =
    AppState.adminFilterFaculty === "all"
      ? allPrograms
      : allPrograms.filter((p) => p.faculty_id === AppState.adminFilterFaculty);

  const branches = new Map();
  facScoped.forEach((p) => {
    const fac = faculties.find((f) => f.id === p.faculty_id);
    const br = (fac?.branches || []).find((b) => b.id === p.branch_id);
    if (br) branches.set(br.id, br.name);
  });
  [...branches.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .forEach(([id, name]) => branchOpts.push([id, name]));

  const branchScoped =
    AppState.adminFilterBranch === "all"
      ? facScoped
      : facScoped.filter((p) => p.branch_id === AppState.adminFilterBranch);
  branchScoped
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((p) => {
      const label = p.name.includes(" · ")
        ? p.name
        : `${p.name}`;
      progOpts.push([p.id, label]);
    });

  const programs = _adminCoursePrograms();
  const activeProg =
    AppState.adminFilterProg !== "all"
      ? allPrograms.find((p) => p.id === AppState.adminFilterProg)
      : null;

  let yearOpts = [["all", "All years"]];
  let semOpts = [["all", "All semesters"]];
  if (activeProg) {
    activeProg.years.forEach((y) => yearOpts.push([y.id, y.name]));
    activeProg.years.forEach((y) => {
      if (AppState.adminFilterYear !== "all" && y.id !== AppState.adminFilterYear) return;
      y.sems.forEach((s) => {
        if (!semOpts.find((x) => String(x[0]) === String(s.id))) semOpts.push([s.id, s.name]);
      });
    });
  }

  let html = `
    <div class="admin-courses">
      <input class="admin-search" placeholder="🔍 Search by course name or code…" value="${esc(AppState.adminSearch)}" oninput="AppState.adminSearch=this.value;renderAdminCourses()"/>
      <div class="admin-filter-bar">
        ${_adminFilterSelect("adminFacFilter", "Faculty", AppState.adminFilterFaculty, facultyOpts, "adminCoursesSetFaculty(this.value)")}
        ${_adminFilterSelect("adminBrFilter", "Campus", AppState.adminFilterBranch, branchOpts, "adminCoursesSetBranch(this.value)")}
        ${_adminFilterSelect("adminProgFilter", "Specialisation", AppState.adminFilterProg, progOpts, "adminCoursesSetProg(this.value)")}
        ${
          activeProg
            ? `${_adminFilterSelect("adminYearFilter", "Year", AppState.adminFilterYear, yearOpts, "adminCoursesSetYear(this.value)")}
               ${_adminFilterSelect("adminSemFilter", "Semester", AppState.adminFilterSem, semOpts, "adminCoursesSetSem(this.value)")}`
            : ""
        }
      </div>`;

  const scopedTooWide =
    AppState.adminFilterProg === "all" &&
    AppState.adminFilterBranch === "all" &&
    !q;

  if (scopedTooWide) {
    const hint =
      AppState.adminFilterFaculty !== "all"
        ? "Pick a campus or specialisation — or search by course code."
        : "Pick a faculty (or search) to browse courses.";
    html += `<div class="empty">${esc(hint)}</div></div>`;
    document.getElementById("adminContent").innerHTML = html;
    _refocusSearch();
    return;
  }

  let shown = 0;
  programs.forEach((prog) => {
    let progHtml = "";
    let courseCount = 0;
    prog.years.forEach((year) => {
      if (AppState.adminFilterYear !== "all" && year.id !== AppState.adminFilterYear) return;
      year.sems.forEach((sem) => {
        if (AppState.adminFilterSem !== "all" && sem.id !== AppState.adminFilterSem) return;
        const filtered = sem.courses.filter(
          (c) =>
            !q ||
            c.name.toLowerCase().includes(q) ||
            (c.code || "").toLowerCase().includes(q),
        );
        if (!filtered.length) return;
        courseCount += filtered.length;
        progHtml += `<div class="admin-sem-block">
          <div class="admin-sem-label">${esc(year.name)} · ${esc(sem.name)}
            <span class="admin-muted">${filtered.length}</span>
          </div>
          <div class="admin-course-table">
            ${filtered
              .map(
                (c) => `<div class="admin-course-row">
              <div class="admin-course-head">
                <div class="admin-course-title">
                  <span class="admin-course-name">${esc(c.name)}</span>
                  <code class="course-code">${esc(c.code || "—")}</code>
                </div>
                <div class="action-btns admin-course-actions">
                  <label class="admin-optional-check">
                    <input type="checkbox" ${c.is_optional ? "checked" : ""} onchange="toggleOptional(${c.id}, ${!!c.is_optional})"/>
                    Optional
                  </label>
                  <button class="action-btn" onclick="openEditCourseModal(${c.id}, ${Number(c.placement_id) || 0})">✏️ Edit</button>
                  <button class="action-btn" onclick="openAddLinkModal(${c.id})">+ Link</button>
                  <button class="action-btn del" onclick="confirmAction('Remove this course?',()=>deleteCourse(${c.id}, ${Number(c.placement_id) || 0}))">🗑 Delete</button>
                </div>
              </div>
              ${
                c.links.length
                  ? `<div class="admin-course-links">${c.links
                      .map((l) =>
                        _adminLinkRow(
                          l,
                          `openEditLinkModal(${l.id},${c.id})`,
                          `confirmDeleteLink(${l.id},${c.id})`,
                        ),
                      )
                      .join("")}</div>`
                  : `<div class="admin-course-links admin-course-links--empty"><span class="admin-muted">No links yet</span></div>`
              }
            </div>`,
              )
              .join("")}
          </div>
        </div>`;
      });
    });
    if (!progHtml) return;
    shown += courseCount;
    html += `<section class="admin-offering-block">
      <header class="admin-offering-head">
        <h3>${esc(prog.name)}</h3>
        <span class="admin-muted">${courseCount} course${courseCount === 1 ? "" : "s"}</span>
      </header>
      ${progHtml}
    </section>`;
  });

  if (!shown) {
    html += `<div class="empty">${q ? "No courses match that search." : "No courses in this filter."}</div>`;
  }
  html += `</div>`;
  document.getElementById("adminContent").innerHTML = html;
  _refocusSearch();
}

// ===================== ADMIN EXTRA =====================
function renderAdminExtra() {
  const q = AppState.adminSearch.toLowerCase();
  let html = `<input class="admin-search" placeholder="🔍 Search extra resources…" value="${esc(AppState.adminSearch)}" oninput="AppState.adminSearch=this.value;renderAdminExtra()"/>
  <button class="btn btn-primary admin-desktop-add" style="margin-bottom:16px;" onclick="openAddExtraSectionModal()">+ Add Section</button>`;
  AppState.dbExtra.forEach((r) => {
    if (q && !r.title.toLowerCase().includes(q)) return;
    html += `<div class="admin-entity-card">
      <div class="admin-entity-head">
        <button type="button" class="admin-entity-toggle">
          <span class="admin-entity-title">${r.icon} ${esc(r.title)}</span>
          <span class="admin-entity-hint">${r.links.length} link${r.links.length === 1 ? "" : "s"}</span>
          <span class="course-chev" aria-hidden="true">›</span>
        </button>
        <div class="action-btns">
          <button class="action-btn" onclick="openEditExtraSectionModal(${r.id})">✏️ Edit</button>
          <button class="action-btn" onclick="openAddExtraLinkModal(${r.id})">+ Link</button>
          <button class="action-btn del" onclick="confirmAction('Delete this section and all its links?',()=>deleteExtraSection(${r.id}))">🗑 Delete</button>
        </div>
      </div>
      <div class="admin-link-list">
        ${r.links.length
        ? r.links
          .map((l) => _adminLinkRow(
            l,
            `openEditExtraLinkModal(${l.id},${r.id})`,
            `confirmAction('Remove this link?',()=>deleteExtraLink(${l.id},${r.id}))`,
          ))
          .join("")
        : '<span class="admin-muted">No links</span>'
      }
      </div>
    </div>`;
  });
  document.getElementById("adminContent").innerHTML = html;
}

// ===================== ADMIN REPORTS =====================
async function renderAdminReports() {
  document.getElementById("adminContent").innerHTML = getAdminTableSkeleton();
  const q = AppState.adminSearch.trim();
  const page = AdminPager.reports.page;
  const offset = page * ADMIN_PAGE_SIZE;
  try {
    const [fetchedReports] = await Promise.all([
      sb(`reports?limit=${ADMIN_PAGE_FETCH}&offset=${offset}&q=${encodeURIComponent(q)}`, "GET").then((r) => r || []),
      loadStudentDirectory(),
    ]);
    const reportsPage = _pageSlice(fetchedReports);
    const reports = reportsPage.items;
    if (page > 0 && reports.length === 0) {
      _setAdminPage("reports", page - 1);
      renderAdminReports();
      return;
    }
    AdminPager.reports.hasNext = reportsPage.hasNext;
    let html = `<input class="admin-search" placeholder="🔍 Search reports…" value="${esc(AppState.adminSearch)}" oninput="AppState.adminSearch=this.value;_setAdminPage('reports',0);renderAdminReports()"/>`;
    if (!reports.length) {
      const emptyMsg = q ? `No report matching "${esc(q)}" found.` : "No reports yet.";
      document.getElementById("adminContent").innerHTML = html + `<div class="empty">${emptyMsg}</div>`;
      return;
    }
    html += `<table class="admin-table"><thead><tr><th>Sender</th><th>Course</th><th>Link</th><th>Issue</th><th>Status</th><th>Actions</th></tr></thead><tbody>`;
    reports.forEach((r) => {
      const issue = (r.description || "").trim() || "No description";
      const statusTag = r.status === "open"
        ? "tag-open"
        : r.status === "rejected"
          ? "tag-rejected"
          : "tag-resolved";
      html += `<tr class="admin-row">
        ${senderDetail(r.user_id)}
        ${adminCell("admin-pri", "Course", esc(r.course_name))}
        ${adminCell(r.link_url ? "admin-detail" : "admin-detail admin-empty", "Link", adminUrlDisplay(r.link_url))}
        ${adminCell("admin-sec", "Issue", adminLongText(issue))}
        ${adminCell("admin-meta", "Status", `<span class="tag ${statusTag}">${esc(r.status || "open")}</span>`)}
        ${adminCell("admin-actions action-btns", "Actions", _reportActions(r))}
      </tr>`;
    });
    html += "</tbody></table>";
    html += _renderAdminPager("reports", "renderAdminReports");
    document.getElementById("adminContent").innerHTML = html;
  } catch (e) {
    document.getElementById("adminContent").innerHTML = `<div class="empty">⚠️ ${e.message}</div>`;
  }
}

// ===================== ADMIN CONTRIBUTIONS =====================
async function renderAdminContributions() {
  document.getElementById("adminContent").innerHTML = getAdminTableSkeleton();
  const q = AppState.adminSearch.trim();
  const page = AdminPager.contributions.page;
  const offset = page * ADMIN_PAGE_SIZE;
  try {
    const [fetchedContribs] = await Promise.all([
      sb(`contributions?limit=${ADMIN_PAGE_FETCH}&offset=${offset}&q=${encodeURIComponent(q)}`, "GET").then((r) => r || []),
      loadStudentDirectory(),
    ]);
    const contribsPage = _pageSlice(fetchedContribs);
    const contribs = contribsPage.items;
    if (page > 0 && contribs.length === 0) {
      _setAdminPage("contributions", page - 1);
      renderAdminContributions();
      return;
    }
    AdminPager.contributions.hasNext = contribsPage.hasNext;
    let html = `<input class="admin-search" placeholder="🔍 Search contributions…" value="${esc(AppState.adminSearch)}" oninput="AppState.adminSearch=this.value;_setAdminPage('contributions',0);renderAdminContributions()"/>`;
    if (!contribs.length) {
      const emptyMsg = q ? `No contribution matching "${esc(q)}" found.` : "No contributions yet.";
      document.getElementById("adminContent").innerHTML = html + `<div class="empty">${emptyMsg}</div>`;
      return;
    }
    html += `<table class="admin-table"><thead><tr><th>Sender</th><th>Course</th><th>Link</th><th>Note</th><th>Status</th><th>Actions</th></tr></thead><tbody>`;
    contribs.forEach((c) => {
      const statusTag = c.status === "pending"
        ? "tag-open"
        : c.status === "rejected"
          ? "tag-rejected"
          : "tag-resolved";
      const note = (c.note || "").trim();
      const preview = note || shortUrl(c.link_url) || "No note";
      html += `<tr class="admin-row">
        ${senderDetail(c.user_id)}
        ${adminCell("admin-pri", "Course", esc(c.course_name))}
        ${adminCell(c.link_url ? "admin-detail" : "admin-detail admin-empty", "Link", adminUrlDisplay(c.link_url))}
        ${adminCell("admin-sec", "Note", adminLongText(preview))}
        ${adminCell("admin-meta", "Status", `<span class="tag ${statusTag}">${esc(c.status || "pending")}</span>`)}
        ${adminCell("admin-actions action-btns", "Actions", _contributionActions(c))}
      </tr>`;
    });
    html += "</tbody></table>";
    html += _renderAdminPager("contributions", "renderAdminContributions");
    document.getElementById("adminContent").innerHTML = html;
  } catch (e) {
    document.getElementById("adminContent").innerHTML = `<div class="empty">⚠️ ${e.message}</div>`;
  }
}

function _reportActions(r) {
  if (r.status === "rejected") {
    return `<button class="action-btn" onclick="setReportStatus(${r.id},'open','Report reopened.')">↩ Reopen</button>
      <button class="action-btn del" onclick="confirmAction('Delete this report permanently?',()=>deleteReport(${r.id}))">🗑</button>`;
  }
  if (r.status === "resolved") {
    return `<button class="action-btn" onclick="setReportStatus(${r.id},'open','Report reopened.')">↩ Reopen</button>`;
  }
  return `<button class="action-btn" style="color:var(--success); border-color:var(--success)" onclick="setReportStatus(${r.id},'resolved','Report resolved.')">✅ Resolve</button>
    <button class="action-btn del" onclick="confirmAction('Reject this report? It stays in the list as rejected.',()=>setReportStatus(${r.id},'rejected','Report rejected.'),'Reject')">✕ Reject</button>`;
}

async function setReportStatus(id, status, toast) {
  try {
    await sb(`reports?id=eq.${id}`, "PATCH", { status });
    renderAdminReports();
    loadReportsBadges();
    if (toast) showToast(toast);
  } catch (e) { showToast(e.message, true); }
}

function _contributionActions(c) {
  if (c.status === "rejected") {
    return `<button class="action-btn" onclick="setContributionStatus(${c.id},'pending','Contribution reopened.')">↩ Reopen</button>
      <button class="action-btn del" onclick="confirmAction('Delete this contribution permanently?',()=>deleteContrib(${c.id}))">🗑</button>`;
  }
  if (c.status === "approved") {
    return `<button class="action-btn" disabled>Approved</button>`;
  }
  return `<button class="action-btn" style="color:var(--success); border-color:var(--success)" onclick="openAutoApproveContribModal(${esc(JSON.stringify(c))})">✅ Approve & Add</button>
    <button class="action-btn del" onclick="confirmAction('Reject this contribution? It stays in the list as rejected.',()=>rejectContrib(${c.id}),'Reject')">✕ Reject</button>`;
}

async function rejectContrib(id) {
  await setContributionStatus(id, "rejected", "Contribution rejected.");
}

async function setContributionStatus(id, status, toast) {
  try {
    await sb(`contributions?id=eq.${id}`, "PATCH", { status });
    renderAdminContributions();
    loadReportsBadges();
    if (toast) showToast(toast);
  } catch (e) { showToast(e.message, true); }
}

// ===================== ADMIN STUDENTS =====================
const TIMELINE_META = {
  visit: { icon: "👣", label: "Visit" },
  link_click: { icon: "🔗", label: "Link opened" },
  report: { icon: "🚨", label: "Report" },
  contribution: { icon: "➕", label: "Contribution" },
  feedback: { icon: "⭐", label: "Feedbacks" },
  suggestion: { icon: "💡", label: "Suggestion" },
  favorite_added: { icon: "★", label: "Favorite added" },
  favorite_removed: { icon: "☆", label: "Favorite removed" },
};

function openAdminStudent(id) {
  AppState.currentAdminTab = "students";
  AppState.adminStudentId = Number(id);
  AppState.adminSearch = "";
  _setAdminPage("studentTimeline", 0);
  document.querySelectorAll(".admin-tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.adminTab === "students");
  });
  syncAdminMobileChrome();
  renderAdminStudents();
}

function closeAdminStudent() {
  AppState.adminStudentId = null;
  _setAdminPage("studentTimeline", 0);
  renderAdminStudents();
}

async function renderAdminStudents() {
  if (AppState.adminStudentId) {
    renderAdminStudentDetail();
    return;
  }
  document.getElementById("adminContent").innerHTML = getAdminTableSkeleton();
  const q = AppState.adminSearch.trim();
  const page = AdminPager.students.page;
  const offset = page * ADMIN_PAGE_SIZE;
  try {
    const studentsPage = _pageSlice(
      (await sb(`users?limit=${ADMIN_PAGE_FETCH}&offset=${offset}&q=${encodeURIComponent(q)}`, "GET")) || [],
    );
    const students = studentsPage.items;
    if (page > 0 && students.length === 0) {
      _setAdminPage("students", page - 1);
      renderAdminStudents();
      return;
    }
    AdminPager.students.hasNext = studentsPage.hasNext;
    rememberStudents(students);

    let html = `<input class="admin-search" placeholder="🔍 Search students…" value="${esc(AppState.adminSearch)}" oninput="AppState.adminSearch=this.value;_setAdminPage('students',0);renderAdminStudents()"/>`;
    if (!students.length) {
      const emptyMsg = q ? `No student matching "${esc(q)}" found.` : "No students yet.";
      document.getElementById("adminContent").innerHTML = html + `<div class="empty">${emptyMsg}</div>`;
      return;
    }

    html += `<table class="admin-table"><thead><tr><th>Student</th><th>First seen</th><th>Last seen</th><th>Visits</th><th>Clicks</th><th>Actions</th></tr></thead><tbody>`;
    students.forEach((u) => {
      html += `<tr class="admin-row" data-student-id="${Number(u.id)}">
        ${adminCell("admin-pri", "Student", `<strong>${esc(studentHandleOf(u))}</strong>`)}
        ${adminCell("admin-detail", "First seen", esc(fmtDateTime(u.created_at)))}
        ${adminCell("admin-sec", "Last seen", esc(fmtDateTime(u.last_seen_at)))}
        ${adminCell("admin-meta", "Visits", String(_num(u.visit_count)))}
        ${adminCell("admin-detail", "Clicks", String(_num(u.click_count)))}
        ${adminCell("admin-actions action-btns", "Actions", `<button class="action-btn" onclick="openAdminStudent(${Number(u.id)})">👤 History</button>`)}
      </tr>`;
    });
    html += "</tbody></table>";
    html += _renderAdminPager("students", "renderAdminStudents");
    document.getElementById("adminContent").innerHTML = html;
    _refocusSearch();
  } catch (e) {
    document.getElementById("adminContent").innerHTML = `<div class="empty">⚠️ ${esc(e.message)}</div>`;
  }
}

function _favoriteCourseNames(ids) {
  const names = (ids || [])
    .map((id) => AppState.courseById.get(Number(id))?.name || `#${id}`)
    .map((name) => esc(String(name)));
  return names.length ? names.join(", ") : "—";
}

async function renderAdminStudentDetail() {
  const id = AppState.adminStudentId;
  document.getElementById("adminContent").innerHTML = getAdminTableSkeleton();
  const page = AdminPager.studentTimeline.page;
  const offset = page * ADMIN_PAGE_SIZE;
  try {
    const data =
      (await sb(`users/${id}?limit=${ADMIN_PAGE_FETCH}&offset=${offset}`, "GET")) || {};
    const user = data.user || {};
    const timelinePage = _pageSlice(data.timeline);
    const timeline = timelinePage.items;
    if (page > 0 && timeline.length === 0) {
      _setAdminPage("studentTimeline", page - 1);
      renderAdminStudentDetail();
      return;
    }
    AdminPager.studentTimeline.hasNext = timelinePage.hasNext;
    rememberStudents([user]);

    const rows = timeline.length
      ? timeline
        .map((item) => {
          const meta = TIMELINE_META[item.type] || { icon: "•", label: item.type || "Activity" };
          return `<tr class="admin-row">
              ${adminCell("admin-pri", "Type", `${meta.icon} ${esc(meta.label)}`)}
              ${adminCell("admin-sec", "Details", esc(item.summary || "—"))}
              ${adminCell("admin-meta", "When", esc(fmtDateTime(item.at)))}
            </tr>`;
        })
        .join("")
      : `<tr class="admin-table-empty"><td colspan="3" style="color:var(--muted);">No activity on this page.</td></tr>`;

    document.getElementById("adminContent").innerHTML = `
      <button class="action-btn" style="margin-bottom:16px;" onclick="closeAdminStudent()">← All students</button>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-val" style="font-size:1.2rem;word-break:break-all;">${esc(studentHandleOf(user))}</div><div class="stat-label">Student</div></div>
        <div class="stat-card"><div class="stat-val" style="font-size:1rem;">${esc(fmtDateTime(user.created_at))}</div><div class="stat-label">Signed up</div></div>
        <div class="stat-card"><div class="stat-val" style="font-size:1rem;">${esc(fmtDateTime(user.last_seen_at))}</div><div class="stat-label">Last seen</div></div>
        <div class="stat-card"><div class="stat-val" style="font-size:1rem;">${esc(_deviceLabel(data.last_device_type))}</div><div class="stat-label">Device</div></div>
      </div>
      <div class="chart-wrap" style="margin-bottom:20px;">
        <div class="chart-title">⭐ Current favorites</div>
        <div style="font-size:.85rem;color:var(--muted);">${_favoriteCourseNames(user.favorite_course_ids)}</div>
      </div>
      <div class="chart-title">🕒 Activity history</div>
      <table class="admin-table"><thead><tr><th>Type</th><th>When</th><th>Details</th></tr></thead><tbody>${rows}</tbody></table>
      ${_renderAdminPager("studentTimeline", "renderAdminStudentDetail")}`;
  } catch (e) {
    document.getElementById("adminContent").innerHTML = `
      <button class="action-btn" style="margin-bottom:16px;" onclick="closeAdminStudent()">← All students</button>
      <div class="empty">⚠️ ${esc(e.message)}</div>`;
  }
}

/** Resolve contribution course_name ("Name (CODE)" or plain) to a course id. */
function _matchContributionCourseId(courseName) {
  const raw = String(courseName || "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const codeMatch = raw.match(/\(([^)]+)\)\s*$/);
  const code = codeMatch ? codeMatch[1].trim().toLowerCase() : "";
  const nameOnly = codeMatch
    ? raw.slice(0, codeMatch.index).trim().toLowerCase()
    : lower;

  let byCode = null;
  let byName = null;
  AppState.dbPrograms.forEach((p) =>
    p.years.forEach((y) =>
      y.sems.forEach((s) =>
        s.courses.forEach((course) => {
          const cName = String(course.name || "").toLowerCase();
          const cCode = String(course.code || "").toLowerCase();
          if (code && cCode === code) byCode = course.id;
          if (cName === nameOnly || cName === lower || cCode === lower) byName = course.id;
        }),
      ),
    ),
  );
  return byCode || byName || null;
}

// Auto-Approve Flow
function openAutoApproveContribModal(c) {
  const suggestedCourseId = _matchContributionCourseId(c.course_name);

  let courseOpts = "";
  const seenCourseIds = new Set();
  AppState.dbPrograms.forEach((p) => {
    courseOpts += `<optgroup label="${esc(p.name)}">`;
    p.years.forEach((y) =>
      y.sems.forEach((s) =>
        s.courses.forEach((course) => {
          if (seenCourseIds.has(course.id)) return;
          seenCourseIds.add(course.id);
          const sel = Number(course.id) === Number(suggestedCourseId) ? "selected" : "";
          courseOpts += `<option value="${course.id}" ${sel}>${esc(course.name)} (${esc(course.code)})</option>`;
        }),
      ),
    );
    courseOpts += `</optgroup>`;
  });

  let preType = c.link_type || "drive";
  let preLangs = [];
  let preContent = "";
  let cleanNote = c.note || "";
  const parsed = parseContributionNote(cleanNote);
  if (parsed.linkType) preType = parsed.linkType;
  if (parsed.contentTypes) preContent = parsed.contentTypes;
  if (parsed.languages.length) preLangs = parsed.languages;
  cleanNote = parsed.note;
  if (!preType && c.link_type) preType = c.link_type;

  window.openModal(`<h2>✅ Approve Contribution</h2>
  <p style="color:var(--muted);font-size:0.9rem;margin-bottom:16px;">Review and add this link directly to the database.</p>
  <label>Target Course</label><select id="acCourse">${courseOpts}</select>
  <label>Type</label><select id="acType">${_linkTypeOptions(preType)}</select>
  <label>URL</label><input type="text" id="acUrl" value="${esc(c.link_url)}"/>
  <label>Label</label><input type="text" id="acLabel" value="Link"/>
  <label>Content Type(s)</label>${_contentTypeCheckboxes(preContent, "acct")}
  <label>Language(s)</label>${_languageCheckboxes(preLangs, "aclang")}
  <label>Note</label><input type="text" id="acNote" value="${esc(cleanNote)}"/>
  <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="applyAutoApproveContrib(${c.id})">Approve & Add</button></div>`);
}

async function applyAutoApproveContrib(contribId) {
  const courseId = parseInt(document.getElementById("acCourse").value);
  const url = document.getElementById("acUrl").value.trim();
  const type = document.getElementById("acType").value;
  const label = document.getElementById("acLabel").value.trim() || "Link";
  const note = document.getElementById("acNote").value.trim();
  const contentType = _readContentTypeCheckboxes("acct");
  const languages = _readLanguageCheckboxes("aclang");

  if (!courseId || !url) { showToast("Course and URL required.", true); return; }

  const btn = document.querySelector("#modalBox .btn-primary");
  setBtnLoading(btn, true, "Saving…");
  try {
    await sb("links", "POST", {
      course_id: courseId, type, url, label, note, content_type: contentType, languages, display_order: _getNextDisplayOrder(courseId)
    });
    await sb(`contributions?id=eq.${contribId}`, "PATCH", { status: "approved" });
    window.closeModal(); _clearCache(); loadAll(); renderAdminContributions();
    showToast("Contribution approved and link added!");
  } catch (e) { showToast(e.message, true); }
  finally { setBtnLoading(btn, false); }
}

// ===================== DB MUTATIONS =====================
async function deleteCourse(id, placementId) {
  try {
    let url = `/api/admin/courses/${id}`;
    if (placementId) url += `?placement_id=${placementId}`;
    await apiRequest(url, { method: "DELETE" });
    _clearCache();
    loadAll();
    showToast("Course removed from this program.");
  } catch (e) { showToast(e.message, true); }
}
async function toggleOptional(id, current) {
  try {
    await apiRequest(`/api/admin/courses/${id}`, {
      method: "PATCH",
      body: { is_optional: !current },
    });
    _clearCache();
    loadAll();
    renderAdminCourses();
    showToast(current ? "Marked as required." : "Marked as optional.");
  } catch (e) { showToast(e.message, true); }
}
function confirmDeleteLink(linkId, _courseId) {
  window.openModal(`<h2>⚠️ Confirm</h2>
    <p style="color:var(--muted);font-size:.9rem;margin-top:8px;">Remove this link from the course in every program that offers it?</p>
    <div class="modal-actions">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn" style="background:var(--danger);color:#fff;" onclick="applyDeleteLink()">Delete</button>
    </div>`);
  AppState._pendingLinkOp = { linkId };
}
async function applyDeleteLink() {
  const { linkId } = AppState._pendingLinkOp || {};
  try {
    await sb(`links?id=eq.${linkId}`, "DELETE");
    window.closeModal();
    _clearCache();
    loadAll();
    renderAdminCourses();
    showToast("Link removed.");
  } catch (e) { showToast(e.message, true); } finally { AppState._pendingLinkOp = null; }
}
async function deleteExtraSection(id) {
  try {
    await sb(`extra_sections?id=eq.${id}`, "DELETE");
    _clearCache();
    loadAll();
    renderAdminExtra();
    showToast("Section deleted.");
  } catch (e) { showToast(e.message, true); }
}
async function deleteExtraLink(id) {
  try {
    await sb(`extra_links?id=eq.${id}`, "DELETE");
    _clearCache();
    loadAll();
    renderAdminExtra();
    showToast("Link removed.");
  } catch (e) { showToast(e.message, true); }
}
async function deleteReport(id) {
  try {
    await sb(`reports?id=eq.${id}`, "DELETE");
    renderAdminReports();
    loadReportsBadges();
    showToast("Report deleted.");
  } catch (e) { showToast(e.message, true); }
}
async function deleteContrib(id) {
  try {
    await sb(`contributions?id=eq.${id}`, "DELETE");
    renderAdminContributions();
    loadReportsBadges();
    showToast("Contribution deleted.");
  } catch (e) { showToast(e.message, true); }
}

function bindAdminMobile() {
  const select = document.getElementById("adminTabSelect");
  if (select && !select.dataset.bound) {
    select.addEventListener("change", () => adminTab(select.value));
    select.dataset.bound = "1";
  }
  const root = document.getElementById("view-admin");
  if (root && !root.dataset.mobileBound) {
    root.addEventListener("click", (e) => {
      if (e.target.closest(".action-btn, a, select, input, .btn")) return;

      const longText = e.target.closest(".admin-long-text:not(.is-empty)");
      if (longText && !isMobileView()) {
        longText.classList.toggle("is-expanded");
        return;
      }

      if (!isMobileView()) return;

      const toggle = e.target.closest(".admin-entity-toggle");
      if (toggle) {
        e.preventDefault();
        const card = toggle.closest(".admin-entity-card");
        const open = card.classList.contains("open");
        document.querySelectorAll(".admin-entity-card.open").forEach((el) => el.classList.remove("open"));
        if (!open) card.classList.add("open");
        return;
      }

      const studentRow = e.target.closest("tr[data-student-id]");
      if (studentRow) {
        openAdminStudent(studentRow.dataset.studentId);
        return;
      }

      const row = e.target.closest(".admin-table tr.admin-row");
      if (row && !row.classList.contains("admin-table-empty")) {
        const open = row.classList.contains("open");
        document.querySelectorAll(".admin-table tr.open").forEach((el) => el.classList.remove("open"));
        if (!open) row.classList.add("open");
      }
    });
    root.dataset.mobileBound = "1";
  }
}

bindAdminMobile();

Object.assign(window, {
  checkLogin,
  logout,
  adminTab,
  renderAdminContent,
  adminSetPage,
  _setAdminPage,
  renderAdminReports,
  renderAdminContributions,
  renderAdminAnalytics,
  analyticsToggleExpand,
  analyticsPaintLocal,
  analyticsSelectRange,
  renderAdminCourses,
  renderAdminExtra,
  toggleOptional,
  deleteCourse,
  confirmDeleteLink,
  applyDeleteLink,
  deleteExtraSection,
  deleteExtraLink,
  toggleReportStatus: setReportStatus,
  setReportStatus,
  deleteReport,
  openAutoApproveContribModal,
  applyAutoApproveContrib,
  rejectContrib,
  setContributionStatus,
  deleteContrib,
  openAdminStudent,
  closeAdminStudent,
  renderAdminStudents,
  renderAdminStudentDetail,
  ADMIN_PAGE_SIZE,
});

export {
  renderAdminContent,
  renderAdminAnalytics,
  renderAdminCourses,
  renderAdminExtra,
  renderAdminReports,
  renderAdminContributions,
};
