package api

import (
	"net/http"
	"strconv"
	"strings"
)

const (
	contentCachePublic = "public, max-age=3600, stale-while-revalidate=600"
	contentCacheAdmin  = "private, no-store"
	contentCacheSearch = "private, max-age=30"
)

func writeContentBytes(w http.ResponseWriter, body []byte, etag, cacheControl string) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", cacheControl)
	if etag != "" {
		w.Header().Set("ETag", etag)
		w.Header().Set("Vary", "Accept-Encoding")
	}
	_, _ = w.Write(body)
}

func writeContentNotModified(w http.ResponseWriter, etag, cacheControl string) {
	w.Header().Set("Cache-Control", cacheControl)
	if etag != "" {
		w.Header().Set("ETag", etag)
	}
	w.WriteHeader(http.StatusNotModified)
}

// HandleGetContent fetches all navigation data using a single optimized query.
func (h *Handler) handleGetContent(w http.ResponseWriter, r *http.Request) {
	body, etag, err := h.contentService.GetWithETag(r.Context(), r.Header.Get("If-None-Match"))
	if err != nil {
		h.LoggerWithID(r).Error("get content failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
		return
	}
	if body == nil {
		writeContentNotModified(w, etag, contentCachePublic)
		return
	}
	writeContentBytes(w, body, etag, contentCachePublic)
}

func (h *Handler) handleGetContentHierarchy(w http.ResponseWriter, r *http.Request) {
	body, etag, err := h.contentService.GetHierarchy(r.Context(), r.Header.Get("If-None-Match"))
	if err != nil {
		h.LoggerWithID(r).Error("get hierarchy failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
		return
	}
	if body == nil {
		writeContentNotModified(w, etag, contentCachePublic)
		return
	}
	writeContentBytes(w, body, etag, contentCachePublic)
}

func (h *Handler) handleGetContentOffering(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		writeJSONError(w, r, http.StatusBadRequest, "Invalid offering id")
		return
	}
	body, etag, err := h.contentService.GetOffering(r.Context(), id, r.Header.Get("If-None-Match"))
	if err != nil {
		h.LoggerWithID(r).Error("get offering content failed", "error", err, "offering_id", id)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
		return
	}
	if body == nil {
		writeContentNotModified(w, etag, contentCachePublic)
		return
	}
	writeContentBytes(w, body, etag, contentCachePublic)
}

func (h *Handler) handleGetContentSearch(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if len(q) < 2 {
		writeJSON(w, http.StatusOK, []any{})
		return
	}
	limit := 50
	if n, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && n > 0 {
		limit = n
	}
	body, err := h.contentService.Search(r.Context(), q, limit)
	if err != nil {
		h.LoggerWithID(r).Error("search content failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
		return
	}
	writeContentBytes(w, body, "", contentCacheSearch)
}

func (h *Handler) handleGetContentCourses(w http.ResponseWriter, r *http.Request) {
	raw := strings.TrimSpace(r.URL.Query().Get("ids"))
	if raw == "" {
		writeJSON(w, http.StatusOK, []any{})
		return
	}
	parts := strings.Split(raw, ",")
	ids := make([]int, 0, len(parts))
	seen := map[int]struct{}{}
	for _, p := range parts {
		id, err := strconv.Atoi(strings.TrimSpace(p))
		if err != nil || id <= 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		ids = append(ids, id)
		if len(ids) >= 100 {
			break
		}
	}
	body, err := h.contentService.GetCoursesByIDs(r.Context(), ids)
	if err != nil {
		h.LoggerWithID(r).Error("get courses by ids failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
		return
	}
	writeContentBytes(w, body, "", contentCacheSearch)
}

// handleGetAdminContent is the same payload as GET /api/content, but never
// CDN-cached or served from the in-memory student cache. Admin edits must
// not wait on stale-while-revalidate at the edge or origin RAM.
func (h *Handler) handleGetAdminContent(w http.ResponseWriter, r *http.Request) {
	result, err := h.contentService.GetUncached(r.Context())
	if err != nil {
		h.LoggerWithID(r).Error("get content failed", "error", err)
		writeJSONError(w, r, http.StatusInternalServerError, "Internal server error")
		return
	}

	writeContentBytes(w, result, "", contentCacheAdmin)
}

func (h *Handler) invalidateContent() {
	h.contentService.Invalidate()
}
