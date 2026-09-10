import { AppState } from "./state.js";
import { apiRequest, logApiError } from "./supabase.js";
import {
  applyDocumentLang,
  applyStaticI18n,
  normalizeLang,
  t,
} from "./i18n.js";

const LANG_KEY = "lu_prefered_lang";
const THEME_KEY = "lu_prefered_theme";

const LANGS = ["eng", "fr", "ar"];
const THEMES = ["system", "light", "dark"];
const LANG_LABELS = { eng: "EN", fr: "FR", ar: "ع" };
const THEME_ICONS = { system: "💻", light: "☀️", dark: "🌙" };

function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function getPreferedLang() {
  return normalizeLang(readStored(LANG_KEY, "eng"));
}

function getPreferedTheme() {
  const theme = readStored(THEME_KEY, "system");
  return THEMES.includes(theme) ? theme : "system";
}

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveDark(themePref) {
  if (themePref === "dark") return true;
  if (themePref === "light") return false;
  return getSystemDark();
}

function applyThemePreference(themePref = getPreferedTheme()) {
  const pref = THEMES.includes(themePref) ? themePref : "system";
  AppState.themePref = pref;
  const isDark = resolveDark(pref);
  AppState.isDark = isDark;
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");

  const themeBtn = document.getElementById("themeBtn");
  if (themeBtn) {
    themeBtn.textContent = THEME_ICONS[pref] || THEME_ICONS.system;
    themeBtn.title = t(`theme_${pref}`);
    themeBtn.setAttribute("aria-label", t(`theme_${pref}`));
  }
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute("content", isDark ? "#0f0f13" : "#f4f4fb");
  }
}

function applyLanguagePreference(lang = getPreferedLang()) {
  const code = normalizeLang(lang);
  AppState.langPref = code;
  applyDocumentLang(code);
  applyStaticI18n();

  const langBtn = document.getElementById("langBtn");
  if (langBtn) {
    langBtn.textContent = LANG_LABELS[code] || "EN";
    langBtn.title = t("lang_label");
    langBtn.setAttribute("aria-label", t("lang_label"));
  }
}

function refreshLocalizedUI() {
  applyStaticI18n();
  window.updateStarDisplay?.();
  window.renderProgTabs?.();
  window.renderStudentBanner?.();
  const step = AppState.facultyNavStep;
  if (
    AppState.currentProg === "faculties" ||
    step === "branches" ||
    step === "specialisations"
  ) {
    window.renderFacultyBrowser?.();
  } else if (typeof AppState.currentProg === "number") {
    window.syncProgramSectionHeading?.();
    window.renderYearFilters?.();
    window.renderSemFilters?.();
  } else if (AppState.currentProg === "tips") {
    window.selectProg?.("tips");
  } else if (AppState.currentProg === "favorites") {
    window.selectProg?.("favorites");
  }
  window.renderCourses?.();
  if (window.isMobileView?.()) {
    window.renderMobileHome?.();
  }
}

async function persistPreferences(lang, theme) {
  writeStored(LANG_KEY, lang);
  writeStored(THEME_KEY, theme);
  if (!AppState.studentToken) return;
  try {
    const user = await apiRequest("/api/users/me/preferences", {
      method: "PATCH",
      body: { prefered_lang: lang, prefered_theme: theme },
    });
    if (user && AppState.studentUser) {
      AppState.studentUser.prefered_lang = user.prefered_lang;
      AppState.studentUser.prefered_theme = user.prefered_theme;
    }
  } catch (err) {
    logApiError(err, "preferences");
  }
}

function setPreferedLang(lang) {
  const code = normalizeLang(lang);
  writeStored(LANG_KEY, code);
  applyLanguagePreference(code);
  refreshLocalizedUI();
  void persistPreferences(code, getPreferedTheme());
}

function setPreferedTheme(theme) {
  const pref = THEMES.includes(theme) ? theme : "system";
  writeStored(THEME_KEY, pref);
  applyThemePreference(pref);
  void persistPreferences(getPreferedLang(), pref);
}

function cycleTheme() {
  const cur = getPreferedTheme();
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  setPreferedTheme(next);
}

function cycleLang() {
  const cur = getPreferedLang();
  const next = LANGS[(LANGS.indexOf(cur) + 1) % LANGS.length];
  setPreferedLang(next);
}

/** Apply prefs from a /users/me payload (registered or guest). */
function applyUserPreferences(user) {
  if (!user) return;
  // Guests keep browser prefs (and sync them up). Registered students load from DB.
  if (user.is_guest) {
    const lang = getPreferedLang();
    const theme = getPreferedTheme();
    applyLanguagePreference(lang);
    applyThemePreference(theme);
    void persistPreferences(lang, theme);
    return;
  }
  const lang = normalizeLang(user.prefered_lang || getPreferedLang());
  const theme = THEMES.includes(user.prefered_theme)
    ? user.prefered_theme
    : getPreferedTheme();
  writeStored(LANG_KEY, lang);
  writeStored(THEME_KEY, theme);
  applyLanguagePreference(lang);
  applyThemePreference(theme);
  refreshLocalizedUI();
}

function initPreferences() {
  applyLanguagePreference(getPreferedLang());
  applyThemePreference(getPreferedTheme());
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (getPreferedTheme() === "system") applyThemePreference("system");
    });
}

window.toggleTheme = cycleTheme;
window.cycleLang = cycleLang;
window.applyUserPreferences = applyUserPreferences;
window.getPreferedLang = getPreferedLang;
window.getPreferedTheme = getPreferedTheme;

export {
  getPreferedLang,
  getPreferedTheme,
  setPreferedLang,
  setPreferedTheme,
  cycleTheme,
  cycleLang,
  applyThemePreference,
  applyLanguagePreference,
  applyUserPreferences,
  initPreferences,
  refreshLocalizedUI,
};
