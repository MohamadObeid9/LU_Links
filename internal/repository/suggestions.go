package repository

import (
	"context"
	"database/sql"
	"fmt"

	"lu-links/internal/errs"
	"lu-links/internal/models"
)

type postgresSuggestionRepository struct {
	db *sql.DB
}

func NewPostgresSuggestionRepository(db *sql.DB) SuggestionRepository {
	return &postgresSuggestionRepository{db: db}
}

func (r *postgresSuggestionRepository) Delete(ctx context.Context, id int) error {
	resp, err := r.db.ExecContext(ctx, deleteSuggestionQuery, id)
	if err != nil {
		return fmt.Errorf("delete suggestion: %w", err)
	}
	affected, err := resp.RowsAffected()
	if err != nil {
		return fmt.Errorf("delete suggestion rows affected: %w", err)
	}
	if affected == 0 {
		return errs.ErrSuggestionNotFound
	}
	return nil
}

func (r *postgresSuggestionRepository) Update(ctx context.Context, status string, id int) error {
	res, err := r.db.ExecContext(ctx, updateSuggestionQuery, status, id)
	if err != nil {
		return fmt.Errorf("update suggestion: %w", err)
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("update suggestion rows affected: %w", err)
	}
	if affected == 0 {
		return errs.ErrSuggestionNotFound
	}
	return nil
}

func (r *postgresSuggestionRepository) Create(ctx context.Context, suggestion models.Suggestion) error {
	if _, err := r.db.ExecContext(ctx, insertSuggestionQuery, suggestion.Category, suggestion.Description, suggestion.UserID); err != nil {
		return fmt.Errorf("insert suggestion: %w", err)
	}
	return nil
}

func (r *postgresSuggestionRepository) List(ctx context.Context, limit int, offset int, q string, status string) ([]models.Suggestion, error) {
	query, args := buildFilteredListQuery(listQueries{
		noFilter:    listSuggestionsNoFilterQuery,
		withQ:       listSuggestionsWithQQuery,
		withStatus:  listSuggestionsWithStatusQuery,
		withQStatus: listSuggestionsWithQStatusQuery,
	}, limit, offset, q, status)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list suggestions query: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var suggestions []models.Suggestion
	for rows.Next() {
		var suggestion models.Suggestion
		var userID sql.NullInt64
		if err := rows.Scan(&suggestion.ID, &suggestion.Category, &suggestion.Description, &suggestion.Status, &suggestion.CreatedAt, &userID); err != nil {
			return nil, fmt.Errorf("list suggestions rows scan: %w", err)
		}
		if userID.Valid {
			suggestion.UserID = int(userID.Int64)
		}
		suggestions = append(suggestions, suggestion)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list suggestions rows err: %w", err)
	}

	return suggestions, nil
}
