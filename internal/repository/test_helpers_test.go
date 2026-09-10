package repository

import (
	"errors"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func assertRepoErr(t *testing.T, mock sqlmock.Sqlmock, err, want error) {
	t.Helper()
	if want != nil {
		if !errors.Is(err, want) {
			t.Fatalf("got %v, want %v", err, want)
		}
	} else if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("expectations: %v", err)
	}
}
