import { AppState } from "./state.js";
import { sb, apiRequest, formatApiError, logApiError } from "./supabase.js";
import { showToast } from "./export.js";
import { esc, setBtnLoading, adminCell, adminLongText } from "./ui.js";
import { loadReportsBadges } from "./data.js";
import { getAdminTableSkeleton } from "./skeleton.js";
import { loadStudentDirectory, senderDetail } from "./students.js";
import { t } from "./i18n.js";

const SUGGESTION_PAGE_SIZE = 10;
let suggestionPage = 0;
let suggestionHasNext = false;

function resetAdminSuggestionPage() {
  suggestionPage = 0;
  suggestionHasNext = false;
}

function _renderSuggestionPager() {
  const pageNum = suggestionPage + 1;
  const prev = suggestionPage > 0
    ? `<button type="button" class="action-btn pager-btn" onclick="setAdminSuggestionPage(-1)">← Prev</button>`
    : `<button type="button" class="action-btn pager-btn" disabled>← Prev</button>`;
  const next = suggestionHasNext
    ? `<button type="button" class="action-btn pager-btn" onclick="setAdminSuggestionPage(1)">Next →</button>`
    : `<button type="button" class="action-btn pager-btn" disabled>Next →</button>`;
  return `<div class="admin-pager">${prev}<span>Page ${pageNum}</span>${next}</div>`;
}

function setAdminSuggestionPage(delta) {
  if (delta < 0 && suggestionPage === 0) return;
  if (delta > 0 && !suggestionHasNext) return;
  suggestionPage = Math.max(0, suggestionPage + delta);
  renderAdminSuggestions();
}

function syncSuggestionFormSteps() {
  const category = document.getElementById("suggestionCategory")?.value || "";
  const placeholder = document.getElementById("suggestionDescPlaceholder");
  const step = document.getElementById("suggestionDescStep");
  if (!step) return;

  const show = !!category;
  if (placeholder) placeholder.hidden = show;
  step.hidden = !show;
  if (!show) {
    const desc = document.getElementById("suggestionDescription");
    if (desc) desc.value = "";
  } else {
    queueMicrotask(() => document.getElementById("suggestionDescription")?.focus());
  }
}

async function submitSuggestion() {
  if (!window.requireStudent(submitSuggestion)) return;
  const btn = document.getElementById("submitSuggestionBtn");
  const category = document.getElementById("suggestionCategory")?.value || "";
  const description = document.getElementById("suggestionDescription")?.value.trim() || "";

  if (!category) {
    showToast(t("toast_need_category"), true);
    return;
  }
  if (!description) {
    showToast(t("toast_need_suggestion_desc"), true);
    return;
  }

  setBtnLoading(btn, true, t("btn_submitting"));
  try {
    await apiRequest("/api/suggestions", {
      method: "POST",
      body: { category, description },
    });
    showToast(t("toast_suggestion_ok"));
    document.getElementById("suggestionCategory").value = "";
    document.getElementById("suggestionDescription").value = "";
    syncSuggestionFormSteps();
  } catch (err) {
    if (window.handleStudentAuthError?.(err, submitSuggestion)) return;
    logApiError(err, "submitSuggestion");
    showToast(formatApiError(err, t("toast_suggestion_fail")), true);
  } finally {
    setBtnLoading(btn, false);
  }
}

function _suggestionActions(item) {
  if (item.status === "rejected") {
    return `<button class="action-btn" onclick="setSuggestionStatus(${item.id},'new')">↩ Reopen</button>
      <button class="action-btn del" onclick="confirmAction('Delete this suggestion permanently?',()=>deleteSuggestion(${item.id}))">🗑</button>`;
  }
  if (item.status === "read") {
    return `<button class="action-btn" onclick="setSuggestionStatus(${item.id},'new')">↩ Mark new</button>`;
  }
  return `<button class="action-btn ok" onclick="setSuggestionStatus(${item.id},'read')">✓ Mark read</button>
    <button class="action-btn del" onclick="setSuggestionStatus(${item.id},'rejected')">✕ Reject</button>`;
}

async function renderAdminSuggestions() {
  const contentDiv = document.getElementById("adminContent");
  contentDiv.innerHTML = getAdminTableSkeleton();
  const q = (AppState.adminSearch || "").trim();
  const offset = suggestionPage * SUGGESTION_PAGE_SIZE;

  try {
    const [response] = await Promise.all([
      sb(`suggestions?limit=${SUGGESTION_PAGE_SIZE + 1}&offset=${offset}&q=${encodeURIComponent(q)}`, "GET"),
      loadStudentDirectory(),
    ]);
    const fetched = Array.isArray(response) ? response : (response && response.data) || [];
    suggestionHasNext = fetched.length > SUGGESTION_PAGE_SIZE;
    const items = fetched.slice(0, SUGGESTION_PAGE_SIZE);
    if (suggestionPage > 0 && items.length === 0) {
      suggestionPage -= 1;
      renderAdminSuggestions();
      return;
    }

    let html = `<input class="admin-search" placeholder="🔍 Search suggestions…" value="${esc(AppState.adminSearch)}" oninput="AppState.adminSearch=this.value;resetAdminSuggestionPage();renderAdminSuggestions()"/>`;
    if (items.length === 0) {
      const emptyMsg = q ? `No suggestion matching "${esc(q)}" found.` : "No suggestions yet.";
      contentDiv.innerHTML = html + `<div style="padding: 20px; text-align: center; color: var(--muted);">${emptyMsg}</div>`;
      return;
    }

    html += `<table class="admin-table"><thead><tr>
      <th>Sender</th><th>Date</th><th>Category</th><th>Description</th><th>Status</th><th>Action</th>
    </tr></thead><tbody>`;

    items.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString();
      const statusClass = item.status === "new"
        ? "tag-blue"
        : item.status === "rejected"
          ? "tag-rejected"
          : "tag-resolved";
      const categoryDisplay = item.category
        ? esc(item.category.charAt(0).toUpperCase() + item.category.slice(1))
        : "N/A";
      html += `<tr class="admin-row">
        ${senderDetail(item.user_id)}
        ${adminCell("admin-detail", "Date", date)}
        ${adminCell("admin-pri", "Category", `<span class="tag tag-gray">${categoryDisplay}</span>`)}
        ${adminCell("admin-sec", "Description", adminLongText(item.description))}
        ${adminCell("admin-meta", "Status", `<span class="tag ${statusClass}">${esc(item.status || "new")}</span>`)}
        ${adminCell("admin-actions action-btns", "Actions", _suggestionActions(item))}
      </tr>`;
    });

    html += `</tbody></table>`;
    html += _renderSuggestionPager();
    contentDiv.innerHTML = html;
  } catch (err) {
    console.error("Suggestions render error:", err);
    contentDiv.innerHTML = '<div style="color: red; padding: 20px;">Error loading suggestions</div>';
  }
}

async function setSuggestionStatus(id, status) {
  try {
    await sb(`suggestions?id=eq.${id}`, "PATCH", { status });
    renderAdminSuggestions();
    loadReportsBadges();
    showToast(status === "read" ? "Marked as read" : status === "rejected" ? "Suggestion rejected" : "Marked as new");
  } catch (err) {
    logApiError(err, "setSuggestionStatus");
    showToast(formatApiError(err, "Failed to update suggestion"), true);
  }
}

async function deleteSuggestion(id) {
  try {
    await sb(`suggestions?id=eq.${id}`, "DELETE");
    renderAdminSuggestions();
    loadReportsBadges();
    showToast("Suggestion deleted");
  } catch (err) {
    logApiError(err, "deleteSuggestion");
    showToast(formatApiError(err, "Failed to delete suggestion"), true);
  }
}

Object.assign(window, {
  submitSuggestion,
  syncSuggestionFormSteps,
  renderAdminSuggestions,
  setAdminSuggestionPage,
  resetAdminSuggestionPage,
  setSuggestionStatus,
  deleteSuggestion,
});

syncSuggestionFormSteps();

export { renderAdminSuggestions, syncSuggestionFormSteps };
