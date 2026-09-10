package api

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"lu-links/internal/errs"
	"lu-links/internal/models"
)

type fakeSuggestionService struct {
	createCalls      int
	createSuggestion models.Suggestion
	createErr        error

	listCalls  int
	listLimit  int
	listOffset int
	listQ      string
	listStatus string
	listResult []models.Suggestion
	listErr    error

	deleteCalls int
	deleteID    string
	deleteErr   error

	updateCalls  int
	updateStatus string
	updateID     string
	updateErr    error
}

func (f *fakeSuggestionService) Create(ctx context.Context, suggestion models.Suggestion) error {
	f.createCalls++
	f.createSuggestion = suggestion
	return f.createErr
}

func (f *fakeSuggestionService) List(ctx context.Context, limit, offset int, q, status string) ([]models.Suggestion, error) {
	f.listCalls++
	f.listLimit = limit
	f.listOffset = offset
	f.listQ = q
	f.listStatus = status
	if f.listErr != nil {
		return nil, f.listErr
	}
	return f.listResult, nil
}

func (f *fakeSuggestionService) Delete(ctx context.Context, id string) error {
	f.deleteCalls++
	f.deleteID = id
	return f.deleteErr
}

func (f *fakeSuggestionService) Update(ctx context.Context, status, idStr string) error {
	f.updateCalls++
	f.updateStatus = status
	f.updateID = idStr
	return f.updateErr
}

func TestHandlePostSuggestion(t *testing.T) {
	svc := &fakeSuggestionService{}
	h := testHandler(t, withSuggestion(svc))
	req := studentRequest(http.MethodPost, "/api/suggestions", `{"category":"feature","description":"dark mode","user_id":999}`)
	rr := httptest.NewRecorder()
	h.handlePostSuggestion(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("status = %d body=%s", rr.Code, rr.Body.String())
	}
	if svc.createCalls != 1 {
		t.Fatalf("createCalls = %d", svc.createCalls)
	}
	if svc.createSuggestion.UserID != testStudentID {
		t.Fatalf("UserID = %d, want %d", svc.createSuggestion.UserID, testStudentID)
	}
	if svc.createSuggestion.Category != "feature" || svc.createSuggestion.Description != "dark mode" {
		t.Fatalf("unexpected payload: %+v", svc.createSuggestion)
	}

	svc.createErr = errs.ErrSuggestionCategoryAndDescRequired
	rr = httptest.NewRecorder()
	h.handlePostSuggestion(rr, studentRequest(http.MethodPost, "/api/suggestions", `{"category":"feature","description":""}`))
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("status = %d", rr.Code)
	}
}

func TestHandleAdminGetSuggestions(t *testing.T) {
	svc := &fakeSuggestionService{
		listResult: []models.Suggestion{{ID: 1, Category: "ux", Description: "simplify nav"}},
	}
	h := testHandler(t, withSuggestion(svc))
	req := httptest.NewRequest(http.MethodGet, "/api/admin/suggestions?limit=10&offset=0&status=new&q=nav", nil)
	rr := httptest.NewRecorder()
	h.handleAdminGetSuggestions(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d", rr.Code)
	}
	var got []models.Suggestion
	if err := json.Unmarshal(rr.Body.Bytes(), &got); err != nil {
		t.Fatalf("json: %v", err)
	}
	if len(got) != 1 || got[0].ID != 1 {
		t.Fatalf("got %+v", got)
	}
	if svc.listStatus != "new" || svc.listQ != "nav" {
		t.Fatalf("list args status=%s q=%s", svc.listStatus, svc.listQ)
	}
}

func TestHandleAdminPatchSuggestion(t *testing.T) {
	svc := &fakeSuggestionService{}
	h := testHandler(t, withSuggestion(svc))
	req := jsonRequest(http.MethodPatch, "/api/admin/suggestions/5", `{"status":"read"}`)
	req.SetPathValue("id", "5")
	rr := httptest.NewRecorder()
	h.handleAdminPatchSuggestion(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d", rr.Code)
	}
	if svc.updateID != "5" || svc.updateStatus != "read" {
		t.Fatalf("update id=%s status=%s", svc.updateID, svc.updateStatus)
	}
}

func TestHandleAdminDeleteSuggestion(t *testing.T) {
	svc := &fakeSuggestionService{}
	h := testHandler(t, withSuggestion(svc))
	req := httptest.NewRequest(http.MethodDelete, "/api/admin/suggestions/9", nil)
	req.SetPathValue("id", "9")
	rr := httptest.NewRecorder()
	h.handleAdminDeleteSuggestion(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d", rr.Code)
	}
	if svc.deleteID != "9" {
		t.Fatalf("deleteID = %s", svc.deleteID)
	}
}
