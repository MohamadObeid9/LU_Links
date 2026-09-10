package service

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"lu-links/internal/errs"
	"lu-links/internal/models"
	"lu-links/internal/repository"
)

type SuggestionService struct {
	repo repository.SuggestionRepository
}

func NewSuggestionService(repo repository.SuggestionRepository) *SuggestionService {
	return &SuggestionService{repo: repo}
}

func (s *SuggestionService) Create(ctx context.Context, suggestion models.Suggestion) error {
	suggestion.Category = strings.TrimSpace(suggestion.Category)
	suggestion.Description = strings.TrimSpace(suggestion.Description)
	if suggestion.Category == "" || suggestion.Description == "" {
		return errs.ErrSuggestionCategoryAndDescRequired
	}

	switch suggestion.Category {
	case "feature", "ux", "content", "performance", "other":
	default:
		return errs.ErrSuggestionInvalidCategory
	}

	if err := s.repo.Create(ctx, suggestion); err != nil {
		return fmt.Errorf("create suggestion: %w", err)
	}
	return nil
}

func (s *SuggestionService) Update(ctx context.Context, status string, idStr string) error {
	idStr = strings.TrimSpace(idStr)
	status = strings.TrimSpace(status)

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return errs.ErrSuggestionInvalidID
	}

	switch status {
	case "new", "read", "rejected":
	case "":
		return errs.ErrStatusRequired
	default:
		return errs.ErrSuggestionInvalidStatus
	}

	if err := s.repo.Update(ctx, status, id); err != nil {
		return fmt.Errorf("update suggestion: %w", err)
	}
	return nil
}

func (s *SuggestionService) Delete(ctx context.Context, idStr string) error {
	idStr = strings.TrimSpace(idStr)
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return errs.ErrSuggestionInvalidID
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		return fmt.Errorf("delete suggestion: %w", err)
	}
	return nil
}

func (s *SuggestionService) List(ctx context.Context, limit int, offset int, q string, status string) ([]models.Suggestion, error) {
	if limit <= 0 || limit > 100 || offset < 0 {
		return nil, errs.ErrInvalidParams
	}

	switch status {
	case "new", "read", "rejected", "":
	default:
		return nil, errs.ErrSuggestionInvalidStatus
	}

	suggestions, err := s.repo.List(ctx, limit, offset, q, status)
	if err != nil {
		return nil, fmt.Errorf("list suggestions: %w", err)
	}

	return suggestions, nil
}
