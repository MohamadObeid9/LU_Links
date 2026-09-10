package api

import (
	"errors"
	"net/http"

	"lu-links/internal/errs"
	"lu-links/internal/models"
)

func (h *Handler) handleAdminGetFaculties(w http.ResponseWriter, r *http.Request) {
	items, err := h.hierarchyService.ListFaculties(r.Context())
	if err != nil {
		h.LoggerWithID(r).Error("list faculties failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) handleAdminPostFaculty(w http.ResponseWriter, r *http.Request) {
	var body models.Faculty
	if !decodeJSONBody(w, r, &body) {
		return
	}
	if err := h.hierarchyService.CreateFaculty(r.Context(), body); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "create faculty")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusCreated, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminPatchFaculty(w http.ResponseWriter, r *http.Request) {
	var body models.Faculty
	if !decodeJSONBody(w, r, &body) {
		return
	}
	if err := h.hierarchyService.UpdateFaculty(r.Context(), body, r.PathValue("id")); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "update faculty")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminDeleteFaculty(w http.ResponseWriter, r *http.Request) {
	if err := h.hierarchyService.DeleteFaculty(r.Context(), r.PathValue("id")); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "delete faculty")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminGetBranches(w http.ResponseWriter, r *http.Request) {
	items, err := h.hierarchyService.ListBranches(r.Context())
	if err != nil {
		h.LoggerWithID(r).Error("list branches failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) handleAdminPostBranch(w http.ResponseWriter, r *http.Request) {
	var body models.Branch
	if !decodeJSONBody(w, r, &body) {
		return
	}
	if err := h.hierarchyService.CreateBranch(r.Context(), body); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "create branch")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusCreated, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminPatchBranch(w http.ResponseWriter, r *http.Request) {
	var body models.Branch
	if !decodeJSONBody(w, r, &body) {
		return
	}
	if err := h.hierarchyService.UpdateBranch(r.Context(), body, r.PathValue("id")); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "update branch")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminDeleteBranch(w http.ResponseWriter, r *http.Request) {
	if err := h.hierarchyService.DeleteBranch(r.Context(), r.PathValue("id")); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "delete branch")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminPostFacultyBranch(w http.ResponseWriter, r *http.Request) {
	if err := h.hierarchyService.AddFacultyBranch(r.Context(), r.PathValue("id"), r.PathValue("branch_id")); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "add faculty branch")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusCreated, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminDeleteFacultyBranch(w http.ResponseWriter, r *http.Request) {
	if err := h.hierarchyService.RemoveFacultyBranch(r.Context(), r.PathValue("id"), r.PathValue("branch_id")); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "remove faculty branch")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminGetSpecialisations(w http.ResponseWriter, r *http.Request) {
	items, err := h.hierarchyService.ListSpecialisations(r.Context())
	if err != nil {
		h.LoggerWithID(r).Error("list specialisations failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) handleAdminPostSpecialisation(w http.ResponseWriter, r *http.Request) {
	var body models.Specialisation
	if !decodeJSONBody(w, r, &body) {
		return
	}
	if err := h.hierarchyService.CreateSpecialisation(r.Context(), body); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "create specialisation")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusCreated, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminPatchSpecialisation(w http.ResponseWriter, r *http.Request) {
	var body models.Specialisation
	if !decodeJSONBody(w, r, &body) {
		return
	}
	if err := h.hierarchyService.UpdateSpecialisation(r.Context(), body, r.PathValue("id")); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "update specialisation")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminDeleteSpecialisation(w http.ResponseWriter, r *http.Request) {
	if err := h.hierarchyService.DeleteSpecialisation(r.Context(), r.PathValue("id")); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "delete specialisation")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminGetBranchSpecialisations(w http.ResponseWriter, r *http.Request) {
	items, err := h.hierarchyService.ListBranchSpecialisations(r.Context())
	if err != nil {
		h.LoggerWithID(r).Error("list branch specialisations failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) handleAdminPostBranchSpecialisation(w http.ResponseWriter, r *http.Request) {
	var body models.BranchSpecialisation
	if !decodeJSONBody(w, r, &body) {
		return
	}
	if err := h.hierarchyService.CreateBranchSpecialisation(r.Context(), body); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "create branch specialisation")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusCreated, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminPatchBranchSpecialisation(w http.ResponseWriter, r *http.Request) {
	var body models.BranchSpecialisation
	if !decodeJSONBody(w, r, &body) {
		return
	}
	if err := h.hierarchyService.UpdateBranchSpecialisation(r.Context(), body, r.PathValue("id")); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "update branch specialisation")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminDeleteBranchSpecialisation(w http.ResponseWriter, r *http.Request) {
	if err := h.hierarchyService.DeleteBranchSpecialisation(r.Context(), r.PathValue("id")); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "delete branch specialisation")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminGetYears(w http.ResponseWriter, r *http.Request) {
	items, err := h.hierarchyService.ListYears(r.Context())
	if err != nil {
		h.LoggerWithID(r).Error("list years failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) handleAdminPostYear(w http.ResponseWriter, r *http.Request) {
	var body models.Year
	if !decodeJSONBody(w, r, &body) {
		return
	}
	if err := h.hierarchyService.CreateYear(r.Context(), body); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "create year")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusCreated, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminPatchYear(w http.ResponseWriter, r *http.Request) {
	var body models.Year
	if !decodeJSONBody(w, r, &body) {
		return
	}
	if err := h.hierarchyService.UpdateYear(r.Context(), body, r.PathValue("id")); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "update year")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminDeleteYear(w http.ResponseWriter, r *http.Request) {
	if err := h.hierarchyService.DeleteYear(r.Context(), r.PathValue("id")); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "delete year")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminGetSemesters(w http.ResponseWriter, r *http.Request) {
	items, err := h.hierarchyService.ListSemesters(r.Context())
	if err != nil {
		h.LoggerWithID(r).Error("list semesters failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) handleAdminPostSemester(w http.ResponseWriter, r *http.Request) {
	var body models.Semester
	if !decodeJSONBody(w, r, &body) {
		return
	}
	if err := h.hierarchyService.CreateSemester(r.Context(), body); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "create semester")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusCreated, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminPatchSemester(w http.ResponseWriter, r *http.Request) {
	var body models.Semester
	if !decodeJSONBody(w, r, &body) {
		return
	}
	if err := h.hierarchyService.UpdateSemester(r.Context(), body, r.PathValue("id")); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "update semester")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminDeleteSemester(w http.ResponseWriter, r *http.Request) {
	if err := h.hierarchyService.DeleteSemester(r.Context(), r.PathValue("id")); err != nil {
		mapHierarchyWriteErr(h, w, r, err, "delete semester")
		return
	}
	h.invalidateContent()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func mapHierarchyWriteErr(h *Handler, w http.ResponseWriter, r *http.Request, err error, op string) {
	switch {
	case errors.Is(err, errs.ErrFacultyNameRequired),
		errors.Is(err, errs.ErrBranchNameRequired),
		errors.Is(err, errs.ErrSpecialisationNameRequired),
		errors.Is(err, errs.ErrSpecialisationFacultyRequired),
		errors.Is(err, errs.ErrYearNameRequired),
		errors.Is(err, errs.ErrYearOfferingRequired),
		errors.Is(err, errs.ErrSemesterNameRequired),
		errors.Is(err, errs.ErrSemesterYearRequired),
		errors.Is(err, errs.ErrFacultyInvalidID),
		errors.Is(err, errs.ErrBranchInvalidID),
		errors.Is(err, errs.ErrSpecialisationInvalidID),
		errors.Is(err, errs.ErrBranchSpecialisationInvalidID),
		errors.Is(err, errs.ErrYearInvalidID),
		errors.Is(err, errs.ErrSemesterInvalidID),
		errors.Is(err, errs.ErrFacultyBranchRequired):
		writeJSONError(w, r, http.StatusBadRequest, err.Error())
	case errors.Is(err, errs.ErrFacultyNotFound),
		errors.Is(err, errs.ErrBranchNotFound),
		errors.Is(err, errs.ErrFacultyBranchNotFound),
		errors.Is(err, errs.ErrSpecialisationNotFound),
		errors.Is(err, errs.ErrBranchSpecialisationNotFound),
		errors.Is(err, errs.ErrYearNotFound),
		errors.Is(err, errs.ErrSemesterNotFound):
		writeJSONError(w, r, http.StatusNotFound, err.Error())
	default:
		h.LoggerWithID(r).Error(op+" failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
	}
}
