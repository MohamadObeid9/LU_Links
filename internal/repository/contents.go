package repository

import (
	"context"
	"database/sql"
	"fmt"
)

type postgresContentRepository struct {
	db *sql.DB
}

func NewPostgresContentRepository(db *sql.DB) ContentRepository {
	return &postgresContentRepository{db: db}
}

func (c *postgresContentRepository) Get(ctx context.Context) ([]byte, error) {
	var result string
	if err := c.db.QueryRowContext(ctx, getContentQuery).Scan(&result); err != nil {
		return nil, fmt.Errorf("get content: %w", err)
	}
	return []byte(result), nil
}

func (c *postgresContentRepository) GetHierarchy(ctx context.Context) ([]byte, error) {
	var result string
	if err := c.db.QueryRowContext(ctx, getHierarchyQuery).Scan(&result); err != nil {
		return nil, fmt.Errorf("get hierarchy: %w", err)
	}
	return []byte(result), nil
}

func (c *postgresContentRepository) GetOffering(ctx context.Context, offeringID int) ([]byte, error) {
	var result string
	if err := c.db.QueryRowContext(ctx, getOfferingContentQuery, offeringID).Scan(&result); err != nil {
		return nil, fmt.Errorf("get offering content: %w", err)
	}
	return []byte(result), nil
}

func (c *postgresContentRepository) Search(ctx context.Context, q string, limit int) ([]byte, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	var result string
	if err := c.db.QueryRowContext(ctx, searchContentQuery, q, limit).Scan(&result); err != nil {
		return nil, fmt.Errorf("search content: %w", err)
	}
	if result == "" {
		result = "[]"
	}
	return []byte(result), nil
}

func (c *postgresContentRepository) GetCoursesByIDs(ctx context.Context, ids []int) ([]byte, error) {
	if len(ids) == 0 {
		return []byte("[]"), nil
	}
	ids32 := make([]int32, len(ids))
	for i, id := range ids {
		ids32[i] = int32(id)
	}
	var result string
	if err := c.db.QueryRowContext(ctx, getCoursesByIDsQuery, ids32).Scan(&result); err != nil {
		return nil, fmt.Errorf("get courses by ids: %w", err)
	}
	if result == "" {
		result = "[]"
	}
	return []byte(result), nil
}
