package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"lu-links/internal/errs"
	"lu-links/internal/models"
)

type postgresLinkRepository struct {
	db *sql.DB
}

func NewPostgresLinkRepository(db *sql.DB) LinkRepository {
	return &postgresLinkRepository{db: db}
}

func languagesJSON(langs []string) (string, error) {
	if langs == nil {
		langs = []string{}
	}
	b, err := json.Marshal(langs)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func (r *postgresLinkRepository) Delete(ctx context.Context, id int) error {
	resp, err := r.db.ExecContext(ctx, deleteLinkQuery, id)
	if err != nil {
		return fmt.Errorf("delete link: %w", err)
	}
	affected, err := resp.RowsAffected()
	if err != nil {
		return fmt.Errorf("delete link rows affected: %w", err)
	}
	if affected == 0 {
		return errs.ErrLinkNotFound
	}
	return nil
}

func (r *postgresLinkRepository) Create(ctx context.Context, link models.Link) error {
	langs, err := languagesJSON(link.Languages)
	if err != nil {
		return fmt.Errorf("marshal link languages: %w", err)
	}
	if _, err := r.db.ExecContext(ctx, insertLinkQuery, link.CourseID, link.Type, link.URL, link.Label, link.Note, link.ContentType, link.DisplayOrder, langs); err != nil {
		if isUniqueViolation(err) {
			return errs.ErrLinkURLTaken
		}
		return fmt.Errorf("insert link: %w", err)
	}
	return nil
}

func (r *postgresLinkRepository) Update(ctx context.Context, link models.Link, id int) error {
	langs, err := languagesJSON(link.Languages)
	if err != nil {
		return fmt.Errorf("marshal link languages: %w", err)
	}
	resp, err := r.db.ExecContext(ctx, updateLinkQuery, link.Type, link.URL, link.Label, link.Note, link.ContentType, langs, id)
	if err != nil {
		if isUniqueViolation(err) {
			return errs.ErrLinkURLTaken
		}
		return fmt.Errorf("update link: %w", err)
	}
	affected, err := resp.RowsAffected()
	if err != nil {
		return fmt.Errorf("update link rows affected: %w", err)
	}
	if affected == 0 {
		return errs.ErrLinkNotFound
	}
	return nil
}
