package api

import (
	"errors"
	"net/http"
	"strings"

	"lu-links/internal/errs"
	"lu-links/internal/models"
)

func (h *Handler) handlePostSuggestion(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireUserID(w, r)
	if !ok {
		return
	}

	var suggestion models.Suggestion
	if !decodeJSONBody(w, r, &suggestion) {
		return
	}
	suggestion.UserID = userID
	if err := h.suggestionService.Create(r.Context(), suggestion); err != nil {
		mapPostSuggestionErr(h, w, r, err)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *Handler) handleAdminGetSuggestions(w http.ResponseWriter, r *http.Request) {
	limit, offset, q := parsePaginationParams(r, 25)
	status := strings.TrimSpace(r.URL.Query().Get("status"))

	suggestions, err := h.suggestionService.List(r.Context(), limit, offset, q, status)
	if err != nil {
		mapListSuggestionErr(h, w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, suggestions)
}

func (h *Handler) handleAdminPatchSuggestion(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	var body struct {
		Status string `json:"status"`
	}
	if !decodeJSONBody(w, r, &body) {
		return
	}
	if err := h.suggestionService.Update(r.Context(), body.Status, idStr); err != nil {
		mapUpdateSuggestionErr(h, w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleAdminDeleteSuggestion(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	if err := h.suggestionService.Delete(r.Context(), idStr); err != nil {
		mapDeleteSuggestionErr(h, w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func mapPostSuggestionErr(h *Handler, w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, errs.ErrSuggestionCategoryAndDescRequired):
		writeJSONError(w, r, http.StatusBadRequest, "Category and description are required")
	case errors.Is(err, errs.ErrSuggestionInvalidCategory):
		writeJSONError(w, r, http.StatusBadRequest, "Category must be one of the following : feature or ux or content or performance or other")
	default:
		h.LoggerWithID(r).Error("create suggestion failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
	}
}

func mapUpdateSuggestionErr(h *Handler, w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, errs.ErrSuggestionNotFound):
		writeJSONError(w, r, http.StatusNotFound, "Suggestion not found")
	case errors.Is(err, errs.ErrSuggestionInvalidID):
		writeJSONError(w, r, http.StatusBadRequest, "Invalid suggestion id")
	case errors.Is(err, errs.ErrStatusRequired):
		writeJSONError(w, r, http.StatusBadRequest, "Status is required")
	case errors.Is(err, errs.ErrSuggestionInvalidStatus):
		writeJSONError(w, r, http.StatusBadRequest, "Status must be new, read, or rejected")
	default:
		h.LoggerWithID(r).Error("update suggestion failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
	}
}

func mapDeleteSuggestionErr(h *Handler, w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, errs.ErrSuggestionInvalidID):
		writeJSONError(w, r, http.StatusBadRequest, "Invalid suggestion id")
	case errors.Is(err, errs.ErrSuggestionNotFound):
		writeJSONError(w, r, http.StatusNotFound, "Suggestion not found")
	default:
		h.LoggerWithID(r).Error("delete suggestion failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
	}
}

func mapListSuggestionErr(h *Handler, w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, errs.ErrSuggestionInvalidStatus):
		writeJSONError(w, r, http.StatusBadRequest, "Status must be new, read, or rejected")
	case errors.Is(err, errs.ErrInvalidParams):
		writeJSONError(w, r, http.StatusBadRequest, "Limit should be between 1-100 and Offset >= 0")
	default:
		h.LoggerWithID(r).Error("list suggestions failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
	}
}
