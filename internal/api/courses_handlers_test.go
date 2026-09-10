package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	"lu-links/internal/errs"
	"lu-links/internal/models"
)

type fakeCourseService struct {
	createCalls  int
	createCourse models.Course
	createErr    error

	deleteCalls int
	deleteID    string
	deleteErr   error

	updateCalls int
	updatePatch models.CoursePatch
	updateID    string
	updateErr   error
}

func (f *fakeCourseService) Create(ctx context.Context, course models.Course) error {
	f.createCalls++
	f.createCourse = course
	return f.createErr
}

func (f *fakeCourseService) Delete(ctx context.Context, idStr string) error {
	f.deleteCalls++
	f.deleteID = idStr
	return f.deleteErr
}

func (f *fakeCourseService) Update(ctx context.Context, patch models.CoursePatch, idStr string) error {
	f.updateCalls++
	f.updatePatch = patch
	f.updateID = idStr
	return f.updateErr
}

func TestHandleAdminPostCourse(t *testing.T) {
	tests := []struct {
		name         string
		body         string
		createErr    error
		wantStatus   int
		wantCreate   *models.Course
		wantCreateN  int
	}{
		{
			name:       "creates course",
			body:       `{"name":"Algo","code":"CS101","semester_id":3,"is_optional":false}`,
			wantStatus: http.StatusCreated,
			wantCreate: &models.Course{Name: "Algo", Code: "CS101", SemesterID: 3},
			wantCreateN: 1,
		},
		{
			name:       "missing name",
			body:       `{"name":"","code":"CS101","semester_id":3}`,
			createErr:  errs.ErrCourseCodeAndNameRequired,
			wantStatus: http.StatusBadRequest,
			wantCreateN: 1,
		},
		{
			name:       "bad semester",
			body:       `{"name":"Algo","code":"CS101","semester_id":0}`,
			createErr:  errs.ErrCourseInvalidSemestreID,
			wantStatus: http.StatusBadRequest,
			wantCreateN: 1,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fake := &fakeCourseService{createErr: tt.createErr}
			h := testHandler(t, withCourse(fake))
			rr := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, "/api/admin/courses", bytes.NewBufferString(tt.body))
			h.handleAdminPostCourse(rr, req)
			if rr.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d body=%s", rr.Code, tt.wantStatus, rr.Body.String())
			}
			if fake.createCalls != tt.wantCreateN {
				t.Fatalf("createCalls = %d, want %d", fake.createCalls, tt.wantCreateN)
			}
			if tt.wantCreate != nil && !reflect.DeepEqual(fake.createCourse, *tt.wantCreate) {
				t.Fatalf("createCourse = %+v, want %+v", fake.createCourse, *tt.wantCreate)
			}
		})
	}
}

func TestHandleAdminDeleteCourse(t *testing.T) {
	fake := &fakeCourseService{}
	h := testHandler(t, withCourse(fake))
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/api/admin/courses/9", nil)
	req.SetPathValue("id", "9")
	h.handleAdminDeleteCourse(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d", rr.Code)
	}
	if fake.deleteID != "9" {
		t.Fatalf("deleteID = %q", fake.deleteID)
	}
}

func TestHandleAdminPatchCourse(t *testing.T) {
	fake := &fakeCourseService{}
	h := testHandler(t, withCourse(fake))
	body := `{"name":"Renamed"}`
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPatch, "/api/admin/courses/4", bytes.NewBufferString(body))
	req.SetPathValue("id", "4")
	h.handleAdminPatchCourse(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d body=%s", rr.Code, rr.Body.String())
	}
	if fake.updateID != "4" {
		t.Fatalf("updateID = %q", fake.updateID)
	}
	_ = json.Unmarshal
}
