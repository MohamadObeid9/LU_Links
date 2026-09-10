package service

import (
	"context"
	"testing"

	"lu-links/internal/errs"
	"lu-links/internal/models"
)

type fakeCourseRepo struct {
	createCourse models.Course
	createErr    error
	deleteID     int
	deleteErr    error
	getByIDResult models.Course
	getByIDErr    error
	updateCourse  models.Course
	updateID      int
	updateErr     error
}

func (f *fakeCourseRepo) Create(ctx context.Context, course models.Course) error {
	f.createCourse = course
	return f.createErr
}
func (f *fakeCourseRepo) Delete(ctx context.Context, id int) error {
	f.deleteID = id
	return f.deleteErr
}
func (f *fakeCourseRepo) GetByID(ctx context.Context, id int) (models.Course, error) {
	if f.getByIDErr != nil {
		return models.Course{}, f.getByIDErr
	}
	return f.getByIDResult, nil
}
func (f *fakeCourseRepo) Update(ctx context.Context, course models.Course, id int) error {
	f.updateCourse = course
	f.updateID = id
	return f.updateErr
}

func TestCourseService_Create(t *testing.T) {
	repo := &fakeCourseRepo{}
	svc := NewCourseService(repo)
	if err := svc.Create(context.Background(), models.Course{Name: "Algo", Code: "CS1", SemesterID: 2}); err != nil {
		t.Fatal(err)
	}
	if repo.createCourse.SemesterID != 2 {
		t.Fatalf("semester = %d", repo.createCourse.SemesterID)
	}
	if err := svc.Create(context.Background(), models.Course{Code: "CS1", SemesterID: 2}); err != errs.ErrCourseCodeAndNameRequired {
		t.Fatalf("err = %v", err)
	}
}

func TestCourseService_Delete(t *testing.T) {
	repo := &fakeCourseRepo{}
	svc := NewCourseService(repo)
	if err := svc.Delete(context.Background(), "5"); err != nil {
		t.Fatal(err)
	}
	if repo.deleteID != 5 {
		t.Fatalf("id = %d", repo.deleteID)
	}
}

func TestCourseService_Update(t *testing.T) {
	name := "New"
	repo := &fakeCourseRepo{getByIDResult: models.Course{ID: 1, Name: "Old", Code: "C1", SemesterID: 3}}
	svc := NewCourseService(repo)
	if err := svc.Update(context.Background(), models.CoursePatch{Name: &name}, "1"); err != nil {
		t.Fatal(err)
	}
	if repo.updateCourse.Name != "New" {
		t.Fatalf("name = %s", repo.updateCourse.Name)
	}
}
