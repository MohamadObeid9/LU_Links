package api

import (
	"context"

	"lu-links/internal/models"
)

type fakeHierarchyService struct{}

func (f *fakeHierarchyService) ListFaculties(ctx context.Context) ([]models.Faculty, error) {
	return nil, nil
}
func (f *fakeHierarchyService) CreateFaculty(ctx context.Context, fac models.Faculty) error {
	return nil
}
func (f *fakeHierarchyService) UpdateFaculty(ctx context.Context, fac models.Faculty, idStr string) error {
	return nil
}
func (f *fakeHierarchyService) DeleteFaculty(ctx context.Context, idStr string) error { return nil }
func (f *fakeHierarchyService) ListBranches(ctx context.Context) ([]models.Branch, error) {
	return nil, nil
}
func (f *fakeHierarchyService) CreateBranch(ctx context.Context, b models.Branch) error { return nil }
func (f *fakeHierarchyService) UpdateBranch(ctx context.Context, b models.Branch, idStr string) error {
	return nil
}
func (f *fakeHierarchyService) DeleteBranch(ctx context.Context, idStr string) error { return nil }
func (f *fakeHierarchyService) ListFacultyBranches(ctx context.Context) ([]models.FacultyBranch, error) {
	return nil, nil
}
func (f *fakeHierarchyService) AddFacultyBranch(ctx context.Context, facultyIDStr, branchIDStr string) error {
	return nil
}
func (f *fakeHierarchyService) RemoveFacultyBranch(ctx context.Context, facultyIDStr, branchIDStr string) error {
	return nil
}
func (f *fakeHierarchyService) ListSpecialisations(ctx context.Context) ([]models.Specialisation, error) {
	return nil, nil
}
func (f *fakeHierarchyService) CreateSpecialisation(ctx context.Context, sp models.Specialisation) error {
	return nil
}
func (f *fakeHierarchyService) UpdateSpecialisation(ctx context.Context, sp models.Specialisation, idStr string) error {
	return nil
}
func (f *fakeHierarchyService) DeleteSpecialisation(ctx context.Context, idStr string) error {
	return nil
}
func (f *fakeHierarchyService) ListBranchSpecialisations(ctx context.Context) ([]models.BranchSpecialisation, error) {
	return nil, nil
}
func (f *fakeHierarchyService) CreateBranchSpecialisation(ctx context.Context, bs models.BranchSpecialisation) error {
	return nil
}
func (f *fakeHierarchyService) UpdateBranchSpecialisation(ctx context.Context, bs models.BranchSpecialisation, idStr string) error {
	return nil
}
func (f *fakeHierarchyService) DeleteBranchSpecialisation(ctx context.Context, idStr string) error {
	return nil
}
func (f *fakeHierarchyService) ListYears(ctx context.Context) ([]models.Year, error) { return nil, nil }
func (f *fakeHierarchyService) CreateYear(ctx context.Context, y models.Year) error  { return nil }
func (f *fakeHierarchyService) UpdateYear(ctx context.Context, y models.Year, idStr string) error {
	return nil
}
func (f *fakeHierarchyService) DeleteYear(ctx context.Context, idStr string) error { return nil }
func (f *fakeHierarchyService) ListSemesters(ctx context.Context) ([]models.Semester, error) {
	return nil, nil
}
func (f *fakeHierarchyService) CreateSemester(ctx context.Context, sem models.Semester) error {
	return nil
}
func (f *fakeHierarchyService) UpdateSemester(ctx context.Context, sem models.Semester, idStr string) error {
	return nil
}
func (f *fakeHierarchyService) DeleteSemester(ctx context.Context, idStr string) error { return nil }
