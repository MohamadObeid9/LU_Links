package repository

import (
	"context"
	"testing"

	"lu-links/internal/models"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestCourseRepository_Create(t *testing.T) {
	db, mock, err := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherEqual))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	repo := NewPostgresCourseRepository(db)
	mock.ExpectExec(insertCourseQuery).
		WithArgs("Algo", "CS1", false, 3, 0).
		WillReturnResult(sqlmock.NewResult(1, 1))
	if err := repo.Create(context.Background(), models.Course{
		Name: "Algo", Code: "CS1", SemesterID: 3,
	}); err != nil {
		t.Fatal(err)
	}
	assertRepoErr(t, mock, nil, nil)
}

func TestCourseRepository_Delete(t *testing.T) {
	db, mock, err := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherEqual))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	repo := NewPostgresCourseRepository(db)
	mock.ExpectExec(deleteCourseQuery).WithArgs(9).WillReturnResult(sqlmock.NewResult(0, 1))
	if err := repo.Delete(context.Background(), 9); err != nil {
		t.Fatal(err)
	}
	assertRepoErr(t, mock, nil, nil)
}
