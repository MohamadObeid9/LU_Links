import { AppState } from "./state.js";
import { esc } from "./ui.js";
import { t, localizedName } from "./i18n.js";

const STEP_ORDER = ["faculty", "campus", "spec", "year", "sem", "course"];

const PLACEHOLDERS = {
  faculty: "ph_select_faculty",
  campus: "ph_select_campus",
  spec: "ph_select_spec",
  year: "ph_select_year",
  sem: "ph_select_semester",
  course: "ph_select_course",
};

function placeholderKey(level) {
  return PLACEHOLDERS[level] || "select_ellipsis";
}

function shortFacultyLabel(entityOrName) {
  const name =
    entityOrName && typeof entityOrName === "object"
      ? localizedName(entityOrName)
      : String(entityOrName || "");
  return (
    name
      .replace(/^Faculty of\s+/i, "")
      .replace(/^Institute of\s+/i, "")
      .replace(/^كلية\s+/, "")
      .replace(/^معهد\s+/, "")
      .trim() || name
  );
}

function faculties() {
  return AppState.dbFaculties || [];
}

function offerings() {
  return AppState.dbPrograms || [];
}

function facultyById(id) {
  return faculties().find((f) => f.id === Number(id));
}

function offeringsFor(facultyId, branchId) {
  return offerings().filter((p) => {
    if (facultyId && p.faculty_id !== Number(facultyId)) return false;
    if (branchId && p.branch_id !== Number(branchId)) return false;
    return true;
  });
}

function stepEl(prefix, level) {
  return document.getElementById(`${prefix}Step-${level}`);
}

function selectEl(prefix, level) {
  const ids = {
    faculty: `${prefix}Faculty`,
    campus: `${prefix}Campus`,
    spec: `${prefix}Spec`,
    year: `${prefix}Year`,
    sem: `${prefix}Sem`,
    course: `${prefix}CoursePick`,
  };
  return document.getElementById(ids[level]);
}

function setStepVisible(prefix, level, visible) {
  const wrap = stepEl(prefix, level);
  if (!wrap) return;
  wrap.hidden = !visible;
  if (!visible) {
    const sel = selectEl(prefix, level);
    if (sel) {
      fillSelect(sel, [], { placeholderKey: placeholderKey(level), disabled: true });
    }
  }
}

function hideStepsAfter(prefix, level) {
  const start = STEP_ORDER.indexOf(level);
  for (let i = start + 1; i < STEP_ORDER.length; i++) {
    setStepVisible(prefix, STEP_ORDER[i], false);
  }
}

function showStep(prefix, level, options, phKey) {
  const wrap = stepEl(prefix, level);
  const sel = selectEl(prefix, level);
  if (!wrap || !sel) return;
  wrap.hidden = false;
  fillSelect(sel, options, { placeholderKey: phKey || placeholderKey(level), disabled: false });
  // Focus the newly revealed control so the flow feels step-by-step.
  queueMicrotask(() => {
    try {
      sel.focus({ preventScroll: false });
    } catch {
      sel.focus();
    }
  });
}

function fillSelect(el, options, { placeholderKey: phKey, placeholder, disabled = false, selected = "" } = {}) {
  if (!el) return;
  const opts = [];
  const key = phKey || null;
  const label = key ? t(key) : placeholder;
  if (label != null) {
    const i18nAttr = key ? ` data-i18n="${esc(key)}"` : "";
    opts.push(`<option value=""${i18nAttr}>${esc(label)}</option>`);
  }
  options.forEach(([value, label]) => {
    const sel = String(selected) === String(value) ? " selected" : "";
    opts.push(`<option value="${esc(String(value))}"${sel}>${esc(label)}</option>`);
  });
  el.innerHTML = opts.join("");
  el.disabled = disabled || (options.length === 0 && !selected);
  if (!el.disabled && selected !== "" && selected != null) {
    el.value = String(selected);
  }
}

function notifyCourseChange(prefix) {
  if (typeof window.onHierarchyCourseChange === "function") {
    window.onHierarchyCourseChange(prefix);
  }
}

/** Populate cascading selects for a form prefix (r / c / m / e). */
function hierarchyCascade(prefix, changed) {
  const facEl = selectEl(prefix, "faculty");
  const campEl = selectEl(prefix, "campus");
  const specEl = selectEl(prefix, "spec");
  const yearEl = selectEl(prefix, "year");
  const semEl = selectEl(prefix, "sem");
  const courseEl = selectEl(prefix, "course");

  if (changed === "init") {
    if (facEl) {
      fillSelect(
        facEl,
        faculties().map((f) => [f.id, shortFacultyLabel(f)]),
        { placeholderKey: "ph_select_faculty", disabled: false },
      );
    }
    hideStepsAfter(prefix, "faculty");
    // Faculty step always visible
    const facStep = stepEl(prefix, "faculty");
    if (facStep) facStep.hidden = false;
    notifyCourseChange(prefix);
    return;
  }

  if (changed === "faculty") {
    hideStepsAfter(prefix, "faculty");
    const facId = facEl?.value;
    if (!facId) {
      notifyCourseChange(prefix);
      return;
    }
    const fac = facultyById(facId);
    const campuses = (fac?.branches || []).map((b) => [b.id, localizedName(b)]);
    showStep(prefix, "campus", campuses, PLACEHOLDERS.campus);
    notifyCourseChange(prefix);
    return;
  }

  if (changed === "campus") {
    hideStepsAfter(prefix, "campus");
    const facId = facEl?.value;
    const branchId = campEl?.value;
    if (!facId || !branchId) {
      notifyCourseChange(prefix);
      return;
    }
    const offs = offeringsFor(facId, branchId);
    showStep(
      prefix,
      "spec",
      offs.map((p) => {
        const full = localizedName(p);
        return [p.id, full.split(" · ")[0] || full];
      }),
      PLACEHOLDERS.spec,
    );
    notifyCourseChange(prefix);
    return;
  }

  if (changed === "spec") {
    hideStepsAfter(prefix, "spec");
    const offeringId = parseInt(specEl?.value, 10);
    if (!offeringId) {
      notifyCourseChange(prefix);
      return;
    }
    const afterLoad = () => {
      const prog = offerings().find((p) => p.id === offeringId);
      if (!prog) {
        notifyCourseChange(prefix);
        return;
      }
      showStep(
        prefix,
        "year",
        (prog.years || []).map((y) => [y.id, y.name]),
        PLACEHOLDERS.year,
      );
      notifyCourseChange(prefix);
    };
    if (window.ensureOfferingLoaded) {
      window.ensureOfferingLoaded(offeringId).then(afterLoad).catch(afterLoad);
      return;
    }
    afterLoad();
    return;
  }

  if (changed === "year") {
    hideStepsAfter(prefix, "year");
    const offeringId = parseInt(specEl?.value, 10);
    const yearId = parseInt(yearEl?.value, 10);
    const prog = offerings().find((p) => p.id === offeringId);
    const year = prog?.years?.find((y) => y.id === yearId);
    if (!year) {
      notifyCourseChange(prefix);
      return;
    }
    showStep(
      prefix,
      "sem",
      (year.sems || []).map((s) => [s.id, s.name]),
      PLACEHOLDERS.sem,
    );
    notifyCourseChange(prefix);
    return;
  }

  if (changed === "sem") {
    hideStepsAfter(prefix, "sem");
    if (courseEl) {
      const offeringId = parseInt(specEl?.value, 10);
      const yearId = parseInt(yearEl?.value, 10);
      const semId = parseInt(semEl?.value, 10);
      const prog = offerings().find((p) => p.id === offeringId);
      const year = prog?.years?.find((y) => y.id === yearId);
      const sem = year?.sems?.find((s) => s.id === semId);
      if (!sem) {
        notifyCourseChange(prefix);
        return;
      }
      const courses = (sem.courses || []).map((c) => [
        c.id,
        c.code ? `${c.code} — ${c.name}` : c.name,
      ]);
      showStep(prefix, "course", courses, PLACEHOLDERS.course);
    }
    notifyCourseChange(prefix);
  }

  if (changed === "course") {
    notifyCourseChange(prefix);
  }
}

function hierarchyStepHtml(prefix, level, label, selectId, onchange, { hidden = false } = {}) {
  const key = placeholderKey(level);
  return `<div class="hierarchy-step" id="${prefix}Step-${level}" ${hidden ? "hidden" : ""}>
    <label for="${selectId}">${esc(label)}</label>
    <select id="${selectId}" ${hidden ? "disabled" : ""} onchange="${onchange}">
      <option value="" data-i18n="${esc(key)}">${esc(t(key))}</option>
    </select>
  </div>`;
}

function hierarchySelectHtml(prefix, { includeCourse = false } = {}) {
  const courseBlock = includeCourse
    ? hierarchyStepHtml(
        prefix,
        "course",
        "Course",
        `${prefix}CoursePick`,
        `hierarchyCascade('${prefix}','course')`,
        { hidden: true },
      )
    : "";
  return `<div class="hierarchy-fields" id="${prefix}Hierarchy">
    ${hierarchyStepHtml(prefix, "faculty", "Faculty", `${prefix}Faculty`, `hierarchyCascade('${prefix}','faculty')`)}
    ${hierarchyStepHtml(prefix, "campus", "Campus", `${prefix}Campus`, `hierarchyCascade('${prefix}','campus')`, { hidden: true })}
    ${hierarchyStepHtml(prefix, "spec", "Specialisation", `${prefix}Spec`, `hierarchyCascade('${prefix}','spec')`, { hidden: true })}
    ${hierarchyStepHtml(prefix, "year", "Year", `${prefix}Year`, `hierarchyCascade('${prefix}','year')`, { hidden: true })}
    ${hierarchyStepHtml(prefix, "sem", "Semester", `${prefix}Sem`, `hierarchyCascade('${prefix}','sem')`, { hidden: true })}
    ${courseBlock}
  </div>`;
}

function initHierarchyPicker(prefix, { includeCourse = false, selected = null } = {}) {
  hierarchyCascade(prefix, "init");
  if (!selected) return;

  const { facultyId, branchId, offeringId, yearId, semesterId, courseId } = selected;
  const facEl = selectEl(prefix, "faculty");
  if (facultyId && facEl) {
    facEl.value = String(facultyId);
    hierarchyCascade(prefix, "faculty");
  }
  const campEl = selectEl(prefix, "campus");
  if (branchId && campEl) {
    campEl.value = String(branchId);
    hierarchyCascade(prefix, "campus");
  }
  const specEl = selectEl(prefix, "spec");
  if (offeringId && specEl) {
    specEl.value = String(offeringId);
    hierarchyCascade(prefix, "spec");
  }
  const yearEl = selectEl(prefix, "year");
  if (yearId && yearEl) {
    yearEl.value = String(yearId);
    hierarchyCascade(prefix, "year");
  }
  const semEl = selectEl(prefix, "sem");
  if (semesterId && semEl) {
    semEl.value = String(semesterId);
    hierarchyCascade(prefix, "sem");
  }
  if (includeCourse && courseId) {
    const courseEl = selectEl(prefix, "course");
    if (courseEl) {
      courseEl.value = String(courseId);
      hierarchyCascade(prefix, "course");
    }
  }
}

function selectedSemesterId(prefix) {
  const v = selectEl(prefix, "sem")?.value;
  return v ? parseInt(v, 10) : null;
}

function selectedCourseId(prefix) {
  const v = selectEl(prefix, "course")?.value;
  return v ? parseInt(v, 10) : null;
}

function selectedCourse(prefix) {
  const id = selectedCourseId(prefix);
  if (!id) return null;
  return AppState.courseById?.get(id) || null;
}

function findCoursePath(courseId) {
  for (const prog of offerings()) {
    for (const year of prog.years || []) {
      for (const sem of year.sems || []) {
        if ((sem.courses || []).some((c) => c.id === courseId)) {
          return {
            facultyId: prog.faculty_id,
            branchId: prog.branch_id,
            offeringId: prog.id,
            yearId: year.id,
            semesterId: sem.id,
            courseId,
          };
        }
      }
    }
  }
  return null;
}

window.hierarchyCascade = hierarchyCascade;
window.initHierarchyPicker = initHierarchyPicker;

export {
  hierarchySelectHtml,
  hierarchyCascade,
  initHierarchyPicker,
  selectedSemesterId,
  selectedCourseId,
  selectedCourse,
  findCoursePath,
  shortFacultyLabel,
};
