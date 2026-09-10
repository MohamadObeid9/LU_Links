package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"lu-links/internal/errs"
	"lu-links/internal/models"
)

type postgresCourseRepository struct {
	db *sql.DB
}

func NewPostgresCourseRepository(db *sql.DB) CourseRepository {
	return &postgresCourseRepository{db: db}
}

func (r *postgresCourseRepository) Delete(ctx context.Context, id int) error {
	resp, err := r.db.ExecContext(ctx, deleteCourseQuery, id)
	if err != nil {
		return fmt.Errorf("delete course: %w", err)
	}
	affected, err := resp.RowsAffected()
	if err != nil {
		return fmt.Errorf("delete course rows affected: %w", err)
	}
	if affected == 0 {
		return errs.ErrCourseNotFound
	}
	return nil
}

func (r *postgresCourseRepository) Create(ctx context.Context, course models.Course) error {
	if _, err := r.db.ExecContext(ctx, insertCourseQuery,
		course.Name, course.Code, course.IsOptional, course.SemesterID, course.DisplayOrder,
	); err != nil {
		return fmt.Errorf("insert course: %w", err)
	}
	return nil
}

func (r *postgresCourseRepository) GetByID(ctx context.Context, id int) (models.Course, error) {
	var c models.Course
	err := r.db.QueryRowContext(ctx, getCourseByIDQuery, id).Scan(
		&c.ID, &c.Name, &c.Code, &c.IsOptional, &c.SemesterID, &c.DisplayOrder,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Course{}, errs.ErrCourseNotFound
		}
		return models.Course{}, fmt.Errorf("get course: %w", err)
	}
	return c, nil
}

func (r *postgresCourseRepository) Update(ctx context.Context, course models.Course, id int) error {
	resp, err := r.db.ExecContext(ctx, updateCourseQuery,
		course.Name, course.Code, course.IsOptional, course.SemesterID, course.DisplayOrder, id,
	)
	if err != nil {
		return fmt.Errorf("update course: %w", err)
	}
	affected, err := resp.RowsAffected()
	if err != nil {
		return fmt.Errorf("update course rows affected: %w", err)
	}
	if affected == 0 {
		return errs.ErrCourseNotFound
	}
	return nil
}
