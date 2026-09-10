// ===================== STUDENT SESSION =====================
// Student identity is name + last name + number (no password). Every browser
// gets a guest session on first load; registering claims that guest row so
// pre-signup activity stays attached to the same student.
import {
  AppState,
  STUDENT_TOKEN_KEY,
  STUDENT_UID_KEY,
  loadFavoritesCache,
  setFavorites,
  clearFavorites,
} from "./state.js";
import { apiRequest, formatApiError, logApiError } from "./supabase.js";
import { openModal, closeModal } from "./modals.js";
import { esc, setBtnLoading } from "./ui.js";
import { showToast } from "./export.js";
import { t } from "./i18n.js";

// Action to replay once the visitor finishes signing up / signing in.
let _pendingAction = null;
// In-flight bootstrap, so gated clicks during startup wait instead of
// prompting a student who is already registered.
let _bootstrapping = null;

function studentHandle() {
  const u = AppState.studentUser;
  if (!u || u.is_guest) return null;
  return u.handle || `${u.first_name}_${u.last_name}_${u.number}`;
}

function isRegisteredStudent() {
  return !!AppState.studentUser && AppState.studentUser.is_guest === false;
}

// ── Token / identity plumbing ───────────────────────────────────────────────
function _setStudentToken(token) {
  AppState.studentToken = token;
  try {
    localStorage.setItem(STUDENT_TOKEN_KEY, token);
  } catch (e) { }
}

function _clearStudentToken() {
  AppState.studentToken = null;
  AppState.studentUser = null;
  try {
    localStorage.removeItem(STUDENT_TOKEN_KEY);
  } catch (e) { }
}

/** Drop the cached favorites + remembered id of whoever was signed in. */
function _forgetStudentIdentity() {
  clearFavorites();
  AppState.studentUserId = null;
  try {
    localStorage.removeItem(STUDENT_UID_KEY);
  } catch (e) { }
}

/** Clear once-per-tab analytics guards so a new guest identity can record activity. */
function _clearSessionAnalyticsGuards() {
  try {
    sessionStorage.removeItem("pv_tracked");
    sessionStorage.removeItem("browse_year");
    sessionStorage.removeItem("browse_list");
  } catch (e) { }
}

function applyStudentUser(user) {
  const previousId = AppState.studentUser?.id ?? AppState.studentUserId;
  if (previousId && user?.id && previousId !== user.id) _forgetStudentIdentity();

  AppState.studentUser = user || null;
  if (user && !user.is_guest) {
    AppState.studentUserId = user.id;
    try {
      localStorage.setItem(STUDENT_UID_KEY, String(user.id));
    } catch (e) { }
    setFavorites(user.favorite_course_ids);
  } else {
    _forgetStudentIdentity();
  }
  if (user) window.applyUserPreferences?.(user);
  renderStudentBanner();
  repaintFavoriteStars();
  // Content may already be on screen (session and /api/content race). Re-paint
  // so link hrefs match the session: real URLs for students, "#" for guests.
  if ((AppState.dbPrograms && AppState.dbPrograms.length) || (AppState.dbExtra && AppState.dbExtra.length)) {
    window.renderCourses?.();
    if (AppState.currentProg === "extra") window.renderExtra?.();
  }
}

async function createGuestSession() {
  const data = await apiRequest("/api/users/guest", { method: "POST" });
  if (!data?.token) throw new Error("Guest session response is missing a token");
  _setStudentToken(data.token);
}

async function refreshStudentProfile() {
  try {
    const user = await apiRequest("/api/users/me");
    applyStudentUser(user);
    return user;
  } catch (err) {
    // 401 = bad/expired token; 404 kept for older backends that returned not-found.
    if (err?.status === 401 || err?.status === 404) {
      await resetToGuest();
      return null;
    }
    throw err;
  }
}

/** Expired / rejected student token: forget it and start a fresh guest. */
async function resetToGuest() {
  _forgetStudentIdentity();
  _clearStudentToken();
  _clearSessionAnalyticsGuards();
  renderStudentBanner();
  repaintFavoriteStars();
  try {
    await createGuestSession();
    // New guest id — record a visit (the old pv_tracked guard would skip this).
    await window.trackVisit?.();
  } catch (err) {
    logApiError(err, "guestBootstrap");
  }
}

async function bootstrapStudentSession() {
  // Always validate/refresh the student token — even when an admin is logged in
  // in the same browser. Otherwise a stale JWT after `docker compose down -v`
  // still authorizes contributions/reports for a deleted user_id.
  if (_bootstrapping) return _bootstrapping;

  _bootstrapping = (async () => {
    try {
      if (AppState.studentUserId) {
        loadFavoritesCache();
        repaintFavoriteStars();
      }
      renderStudentBanner();
      if (!AppState.studentToken) await createGuestSession();
      if (AppState.studentToken) await refreshStudentProfile();
      // Bind or record the visit now that studentUser.id is known.
      if (!AppState.adminLoggedIn) await window.trackVisit?.();
    } catch (err) {
      logApiError(err, "studentSession");
    }
  })();

  try {
    await _bootstrapping;
  } finally {
    _bootstrapping = null;
  }
}

function onStudentTokenRejected() {
  if (_bootstrapping) return;
  resetToGuest().catch((err) => logApiError(err, "guestBootstrap"));
}

// ── Gating ──────────────────────────────────────────────────────────────────
/**
 * True when the visitor may perform a registered-only action. Otherwise the
 * signup/login modal opens and `retry` runs after a successful sign-in.
 */
function requireStudent(retry) {
  // Admin chrome must not skip student identity — contribute/report use the
  // student JWT, which must refer to a row that still exists.
  if (isRegisteredStudent()) return true;

  if (_bootstrapping) {
    _bootstrapping.then(() => {
      if (isRegisteredStudent()) {
        if (typeof retry === "function") retry();
      } else {
        promptStudentAuth({ retry });
      }
    });
    return false;
  }

  promptStudentAuth({ retry });
  return false;
}

/** 401/403 on a gated request → recover the session and prompt. */
function handleStudentAuthError(err, retry) {
  const status = err?.status;
  if (status !== 401 && status !== 403) return false;
  if (status === 401) resetToGuest().catch((e) => logApiError(e, "guestBootstrap"));
  promptStudentAuth({ retry });
  return true;
}

// ── Signup / login modal ────────────────────────────────────────────────────
function _randomNumber() {
  return Math.floor(Math.random() * 100) + 1;
}

/** Next number to suggest after a collision (55 → 65, wrapping past 100). */
function _suggestNumber(taken) {
  const next = Number(taken) + 10;
  return next > 100 ? next - 100 : next;
}

function promptStudentAuth({ retry = null, mode = "signup" } = {}) {
  _pendingAction = typeof retry === "function" ? retry : null;
  _renderAuthModal({ mode });
}

function _renderAuthModal({ mode = "signup", error = "", values = {} } = {}) {
  const isSignup = mode !== "signin";
  const first = values.first_name || "";
  const last = values.last_name || "";
  const number = values.number || (isSignup ? String(_randomNumber()) : "");

  openModal(`<h2>${esc(isSignup ? t("auth_signup_title") : t("auth_signin_title"))}</h2>
  <div class="auth-mode-toggle" role="tablist" aria-label="${esc(t("auth_mode_aria"))}">
    <button type="button" role="tab" class="auth-mode-btn ${isSignup ? "active" : ""}" aria-selected="${isSignup}" onclick="switchStudentAuthMode('signup')">${esc(t("auth_tab_signup"))}</button>
    <button type="button" role="tab" class="auth-mode-btn ${isSignup ? "" : "active"}" aria-selected="${!isSignup}" onclick="switchStudentAuthMode('signin')">${esc(t("auth_tab_signin"))}</button>
  </div>
  <p class="auth-hint">${esc(isSignup ? t("auth_signup_hint") : t("auth_signin_hint"))}</p>
  <label for="stFirst">${esc(t("auth_label_first"))}</label>
  <input type="text" id="stFirst" autocomplete="given-name" placeholder="${esc(t("auth_ph_first"))}" value="${esc(first)}"/>
  <label for="stLast">${esc(t("auth_label_last"))}</label>
  <input type="text" id="stLast" autocomplete="family-name" placeholder="${esc(t("auth_ph_last"))}" value="${esc(last)}"/>
  <label for="stNumber">${esc(t("auth_label_number"))}</label>
  <input type="number" id="stNumber" min="1" max="100" step="1" placeholder="${esc(t("auth_ph_number"))}" value="${esc(number)}"/>
  <div class="err" id="stAuthErr">${error ? esc(error) : ""}</div>
  <div class="modal-actions">
    <button class="btn btn-ghost" onclick="closeModal()">${esc(t("btn_cancel"))}</button>
    <button class="btn btn-primary" onclick="submitStudentAuth('${isSignup ? "signup" : "signin"}')">${esc(isSignup ? t("auth_btn_create") : t("auth_btn_signin"))}</button>
  </div>`);
}

function _readAuthValues() {
  return {
    first_name: document.getElementById("stFirst")?.value.trim() || "",
    last_name: document.getElementById("stLast")?.value.trim() || "",
    number: document.getElementById("stNumber")?.value.trim() || "",
  };
}

function _setAuthError(message) {
  const el = document.getElementById("stAuthErr");
  if (el) el.textContent = message || "";
}

function switchStudentAuthMode(mode) {
  _renderAuthModal({ mode, values: _readAuthValues() });
}

async function submitStudentAuth(mode) {
  const isSignup = mode !== "signin";
  const values = _readAuthValues();

  if (!values.first_name || !values.last_name) {
    _setAuthError(t("auth_err_names"));
    return;
  }
  const number = parseInt(values.number, 10);
  if (!Number.isInteger(number) || number < 1 || number > 100) {
    _setAuthError(t("auth_err_number"));
    return;
  }

  const btn = document.querySelector("#modalBox .btn-primary");
  setBtnLoading(btn, true, isSignup ? t("auth_loading_create") : t("auth_loading_signin"));
  try {
    // The guest token rides along automatically: register claims that row,
    // login reassigns its page views onto the existing student.
    const data = await apiRequest(
      isSignup ? "/api/users/register" : "/api/users/login",
      {
        method: "POST",
        body: {
          first_name: values.first_name,
          last_name: values.last_name,
          number,
        },
      },
    );
    if (!data?.token) throw new Error("Sign-in response is missing a token");

    _setStudentToken(data.token);
    if (data.user) applyStudentUser(data.user);
    else await refreshStudentProfile();

    closeModal();
    const handle = studentHandle();
    showToast(
      isSignup
        ? t("toast_profile_created", { handle: handle || t("auth_fallback_student") })
        : t("toast_signed_in", { handle: handle || t("auth_fallback_student") }),
    );

    if (isSignup) {
      // Claim keeps the same id (visit already recorded). Fallthrough create is a
      // new id with no page_views yet — trackVisit records one when needed.
      await window.trackVisit?.();
    } else {
      // Login adopts guest page_views onto the student; bind the guard so this
      // tab does not insert a duplicate visit for the same session.
      const id = AppState.studentUser?.id;
      if (id != null) {
        try {
          sessionStorage.setItem("pv_tracked", String(id));
        } catch (e) { }
      }
    }

    const action = _pendingAction;
    _pendingAction = null;
    if (typeof action === "function") action();
  } catch (err) {
    if (isSignup && err?.status === 409) {
      const suggestion = _suggestNumber(number);
      _renderAuthModal({
        mode: "signup",
        values: { ...values, number: String(suggestion) },
        error: t("auth_err_taken", {
          first: values.first_name,
          last: values.last_name,
          number,
          suggestion,
        }),
      });
      return;
    }
    if (!isSignup && err?.status === 404) {
      _renderAuthModal({
        mode: "signup",
        values,
        error: t("auth_err_not_found"),
      });
      return;
    }
    if (err?.status === 400) {
      _setAuthError(formatApiError(err, t("auth_err_check")));
      return;
    }
    logApiError(err, isSignup ? "studentRegister" : "studentLogin");
    _setAuthError(formatApiError(err, t("auth_err_generic")));
  } finally {
    setBtnLoading(btn, false);
  }
}

async function signOutStudent() {
  await resetToGuest();
  if (AppState.currentProg === "favorites") window.selectProg?.("all");
  showToast(t("toast_signed_out"));
  if (AppState.studentToken) {
    await refreshStudentProfile().catch((err) =>
      logApiError(err, "studentSession"),
    );
  }
}

// ── Welcome banner ──────────────────────────────────────────────────────────
function renderStudentBanner() {
  const el = document.getElementById("studentWelcome");
  if (!el) return;
  const handle = studentHandle();
  if (!handle && AppState.adminLoggedIn) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }
  el.innerHTML = handle
    ? `<span class="student-welcome-text">👋 ${esc(t("welcome_hi", { handle }))}</span>
       <button type="button" class="student-welcome-btn" data-action="studentSignOut">${esc(t("sign_out"))}</button>`
    : `<span class="student-welcome-text">${esc(t("guest_banner"))}</span>
       <button type="button" class="student-welcome-btn" data-action="studentSignIn">${esc(t("sign_in"))}</button>`;
  el.hidden = false;
}

// ── Favorites ───────────────────────────────────────────────────────────────
/** Sync a single toggle. Throws so callers can roll back their optimistic UI. */
async function syncFavorite(courseId, added) {
  await apiRequest(`/api/users/me/favorites/${encodeURIComponent(courseId)}`, {
    method: added ? "POST" : "DELETE",
  });
  const user = AppState.studentUser;
  if (user) {
    const ids = new Set((user.favorite_course_ids || []).map(Number));
    if (added) ids.add(Number(courseId));
    else ids.delete(Number(courseId));
    user.favorite_course_ids = [...ids];
  }
}

/** Re-sync star buttons already on screen with AppState.favorites. */
function repaintFavoriteStars() {
  document.querySelectorAll(".course-card").forEach((card) => {
    const btn = card.querySelector(".fav-btn");
    if (!btn) return;
    const id = card.id.replace("course-card-", "");
    const isFav = AppState.favorites.has(String(id));
    btn.classList.toggle("active", isFav);
    btn.title = isFav ? t("fav_remove") : t("fav_add");
  });
  if (AppState.currentProg === "favorites") window.renderCourses?.();
}

Object.assign(window, {
  bootstrapStudentSession,
  requireStudent,
  promptStudentAuth,
  handleStudentAuthError,
  onStudentTokenRejected,
  submitStudentAuth,
  switchStudentAuthMode,
  signOutStudent,
  syncFavorite,
  studentHandle,
  isRegisteredStudent,
  renderStudentBanner,
  repaintFavoriteStars,
});

export {
  bootstrapStudentSession,
  requireStudent,
  promptStudentAuth,
  handleStudentAuthError,
  signOutStudent,
  syncFavorite,
  studentHandle,
  isRegisteredStudent,
  renderStudentBanner,
  repaintFavoriteStars,
};
