package service

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"lu-links/internal/errs"
	"lu-links/internal/models"
)

type fakeSuggestionRepo struct {
	createCalls      int
	createSuggestion models.Suggestion
	createErr        error

	listCalls  int
	listLimit  int
	listOffset int
	listQ      string
	listStatus string
	listErr    error

	deleteCalls int
	deleteID    int
	deleteErr   error

	updateCalls  int
	updateID     int
	updateStatus string
	updateErr    error
}

func (f *fakeSuggestionRepo) Create(ctx context.Context, suggestion models.Suggestion) error {
	f.createCalls++
	f.createSuggestion = suggestion
	return f.createErr
}

func (f *fakeSuggestionRepo) List(ctx context.Context, limit, offset int, q, status string) ([]models.Suggestion, error) {
	f.listCalls++
	f.listLimit = limit
	f.listOffset = offset
	f.listQ = q
	f.listStatus = status
	return nil, f.listErr
}

func (f *fakeSuggestionRepo) Update(ctx context.Context, status string, id int) error {
	f.updateCalls++
	f.updateStatus = status
	f.updateID = id
	return f.updateErr
}

func (f *fakeSuggestionRepo) Delete(ctx context.Context, id int) error {
	f.deleteCalls++
	f.deleteID = id
	return f.deleteErr
}

func TestSuggestionService_Create(t *testing.T) {
	tests := []struct {
		name         string
		suggestion   models.Suggestion
		createErr    error
		wantErr      error
		resultWanted *models.Suggestion
	}{
		{
			name:         "accept a normal suggestion",
			suggestion:   models.Suggestion{Category: "feature", Description: "dark mode"},
			resultWanted: &models.Suggestion{Category: "feature", Description: "dark mode"},
		},
		{
			name:       "reject empty description",
			suggestion: models.Suggestion{Category: "ux", Description: "   "},
			wantErr:    errs.ErrSuggestionCategoryAndDescRequired,
		},
		{
			name:       "reject empty category",
			suggestion: models.Suggestion{Category: "", Description: "add filters"},
			wantErr:    errs.ErrSuggestionCategoryAndDescRequired,
		},
		{
			name:       "reject invalid category",
			suggestion: models.Suggestion{Category: "hello", Description: "add filters"},
			wantErr:    errs.ErrSuggestionInvalidCategory,
		},
		{
			name:         "accept other category",
			suggestion:   models.Suggestion{Category: "other", Description: "misc idea"},
			resultWanted: &models.Suggestion{Category: "other", Description: "misc idea"},
		},
		{
			name:       "wrap repo error",
			suggestion: models.Suggestion{Category: "content", Description: "more tips"},
			createErr:  errors.New("db down"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := &fakeSuggestionRepo{createErr: tt.createErr}
			svc := NewSuggestionService(repo)
			err := svc.Create(context.Background(), tt.suggestion)
			if tt.wantErr == nil && tt.createErr == nil {
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if repo.createCalls != 1 {
					t.Fatalf("createCalls = %d, want 1", repo.createCalls)
				}
				if !reflect.DeepEqual(repo.createSuggestion, *tt.resultWanted) {
					t.Fatalf("got %+v want %+v", repo.createSuggestion, *tt.resultWanted)
				}
				return
			}
			if err == nil {
				t.Fatal("expected error")
			}
			if tt.wantErr != nil && !errors.Is(err, tt.wantErr) {
				t.Fatalf("err = %v, want %v", err, tt.wantErr)
			}
			if tt.createErr != nil && !errors.Is(err, tt.createErr) {
				t.Fatalf("err = %v, want wrap of %v", err, tt.createErr)
			}
			if tt.wantErr != nil && repo.createCalls != 0 {
				t.Fatalf("createCalls = %d, want 0", repo.createCalls)
			}
		})
	}
}

func TestSuggestionService_Update(t *testing.T) {
	repo := &fakeSuggestionRepo{}
	svc := NewSuggestionService(repo)
	if err := svc.Update(context.Background(), "read", "7"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.updateID != 7 || repo.updateStatus != "read" {
		t.Fatalf("update got id=%d status=%s", repo.updateID, repo.updateStatus)
	}
	if err := svc.Update(context.Background(), "nope", "7"); !errors.Is(err, errs.ErrSuggestionInvalidStatus) {
		t.Fatalf("err = %v", err)
	}
}

func TestSuggestionService_Delete(t *testing.T) {
	repo := &fakeSuggestionRepo{}
	svc := NewSuggestionService(repo)
	if err := svc.Delete(context.Background(), "3"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.deleteID != 3 {
		t.Fatalf("deleteID = %d", repo.deleteID)
	}
	if err := svc.Delete(context.Background(), "0"); !errors.Is(err, errs.ErrSuggestionInvalidID) {
		t.Fatalf("err = %v", err)
	}
}

func TestSuggestionService_List(t *testing.T) {
	repo := &fakeSuggestionRepo{}
	svc := NewSuggestionService(repo)
	if _, err := svc.List(context.Background(), 10, 0, "q", "new"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.listLimit != 10 || repo.listOffset != 0 || repo.listQ != "q" || repo.listStatus != "new" {
		t.Fatalf("list args mismatch: %+v", repo)
	}
	if _, err := svc.List(context.Background(), 0, 0, "", ""); !errors.Is(err, errs.ErrInvalidParams) {
		t.Fatalf("err = %v", err)
	}
}
