package service

import (
	"context"
	"fmt"

	"lu-links/internal/errs"
	"lu-links/internal/models"
	"lu-links/internal/repository"
)

type LinkClickService struct {
	repo repository.LinkClickRepository
}

func NewLinkClickService(repo repository.LinkClickRepository) *LinkClickService {
	return &LinkClickService{repo: repo}
}

func (s *LinkClickService) Create(ctx context.Context, lc models.LinkClick) error {
	if lc.LinkID == nil && lc.ExtraLinkID == nil {
		return errs.ErrLinkClickLinkIDAndExtraLinkIDRequired
	}
	if lc.LinkID != nil && lc.ExtraLinkID != nil {
		return errs.ErrLinkClickLinkIDAndExtraLinkIDSet
	}
	if err := s.repo.Create(ctx, lc); err != nil {
		return fmt.Errorf("create link click: %w", err)
	}
	return nil
}

func (s *LinkClickService) List(ctx context.Context) ([]models.LinkClick, error) {
	views, err := s.repo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("list link clicks: %w", err)
	}
	return views, nil
}
