package service

import (
	"context"
	"regexp"
	"strconv"
	"strings"
	"unicode"

	"lu-links/internal/errs"
	"lu-links/internal/models"
	"lu-links/internal/repository"
)

var nonSlug = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(name, slug string) string {
	s := strings.TrimSpace(strings.ToLower(slug))
	if s == "" {
		s = strings.TrimSpace(strings.ToLower(name))
	}
	var b strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '-' || r == ' ' {
			b.WriteRune(r)
		}
	}
	s = nonSlug.ReplaceAllString(strings.ReplaceAll(b.String(), " ", "-"), "-")
	return strings.Trim(s, "-")
}

type HierarchyService struct {
	repo repository.HierarchyRepository
}

func NewHierarchyService(repo repository.HierarchyRepository) *HierarchyService {
	return &HierarchyService{repo: repo}
}

func parsePositiveID(idStr string) (int, error) {
	id, err := strconv.Atoi(strings.TrimSpace(idStr))
	if err != nil || id <= 0 {
		return 0, errs.ErrInvalidParams
	}
	return id, nil
}

func (s *HierarchyService) ListFaculties(ctx context.Context) ([]models.Faculty, error) {
	return s.repo.ListFaculties(ctx)
}

func (s *HierarchyService) CreateFaculty(ctx context.Context, f models.Faculty) error {
	f.Name = strings.TrimSpace(f.Name)
	f.NameAr = strings.TrimSpace(f.NameAr)
	f.Slug = slugify(f.Name, f.Slug)
	if f.Name == "" || f.Slug == "" {
		return errs.ErrFacultyNameRequired
	}
	return s.repo.CreateFaculty(ctx, f)
}

func (s *HierarchyService) UpdateFaculty(ctx context.Context, f models.Faculty, idStr string) error {
	id, err := parsePositiveID(idStr)
	if err != nil {
		return errs.ErrFacultyInvalidID
	}
	f.Name = strings.TrimSpace(f.Name)
	f.NameAr = strings.TrimSpace(f.NameAr)
	f.Slug = slugify(f.Name, f.Slug)
	if f.Name == "" || f.Slug == "" {
		return errs.ErrFacultyNameRequired
	}
	return s.repo.UpdateFaculty(ctx, f, id)
}

func (s *HierarchyService) DeleteFaculty(ctx context.Context, idStr string) error {
	id, err := parsePositiveID(idStr)
	if err != nil {
		return errs.ErrFacultyInvalidID
	}
	return s.repo.DeleteFaculty(ctx, id)
}

func (s *HierarchyService) ListBranches(ctx context.Context) ([]models.Branch, error) {
	return s.repo.ListBranches(ctx)
}

func (s *HierarchyService) CreateBranch(ctx context.Context, b models.Branch) error {
	b.Name = strings.TrimSpace(b.Name)
	b.NameAr = strings.TrimSpace(b.NameAr)
	b.Slug = slugify(b.Name, b.Slug)
	if b.Name == "" || b.Slug == "" {
		return errs.ErrBranchNameRequired
	}
	return s.repo.CreateBranch(ctx, b)
}

func (s *HierarchyService) UpdateBranch(ctx context.Context, b models.Branch, idStr string) error {
	id, err := parsePositiveID(idStr)
	if err != nil {
		return errs.ErrBranchInvalidID
	}
	b.Name = strings.TrimSpace(b.Name)
	b.NameAr = strings.TrimSpace(b.NameAr)
	b.Slug = slugify(b.Name, b.Slug)
	if b.Name == "" || b.Slug == "" {
		return errs.ErrBranchNameRequired
	}
	return s.repo.UpdateBranch(ctx, b, id)
}

func (s *HierarchyService) DeleteBranch(ctx context.Context, idStr string) error {
	id, err := parsePositiveID(idStr)
	if err != nil {
		return errs.ErrBranchInvalidID
	}
	return s.repo.DeleteBranch(ctx, id)
}

func (s *HierarchyService) ListFacultyBranches(ctx context.Context) ([]models.FacultyBranch, error) {
	return s.repo.ListFacultyBranches(ctx)
}

func (s *HierarchyService) AddFacultyBranch(ctx context.Context, facultyIDStr, branchIDStr string) error {
	facultyID, err := parsePositiveID(facultyIDStr)
	if err != nil {
		return errs.ErrFacultyInvalidID
	}
	branchID, err := parsePositiveID(branchIDStr)
	if err != nil {
		return errs.ErrBranchInvalidID
	}
	return s.repo.AddFacultyBranch(ctx, facultyID, branchID)
}

func (s *HierarchyService) RemoveFacultyBranch(ctx context.Context, facultyIDStr, branchIDStr string) error {
	facultyID, err := parsePositiveID(facultyIDStr)
	if err != nil {
		return errs.ErrFacultyInvalidID
	}
	branchID, err := parsePositiveID(branchIDStr)
	if err != nil {
		return errs.ErrBranchInvalidID
	}
	return s.repo.RemoveFacultyBranch(ctx, facultyID, branchID)
}

func (s *HierarchyService) ListSpecialisations(ctx context.Context) ([]models.Specialisation, error) {
	return s.repo.ListSpecialisations(ctx)
}

func (s *HierarchyService) CreateSpecialisation(ctx context.Context, sp models.Specialisation) error {
	sp.Name = strings.TrimSpace(sp.Name)
	sp.NameAr = strings.TrimSpace(sp.NameAr)
	sp.Slug = slugify(sp.Name, sp.Slug)
	if sp.FacultyID <= 0 {
		return errs.ErrSpecialisationFacultyRequired
	}
	if sp.Name == "" || sp.Slug == "" {
		return errs.ErrSpecialisationNameRequired
	}
	return s.repo.CreateSpecialisation(ctx, sp)
}

func (s *HierarchyService) UpdateSpecialisation(ctx context.Context, sp models.Specialisation, idStr string) error {
	id, err := parsePositiveID(idStr)
	if err != nil {
		return errs.ErrSpecialisationInvalidID
	}
	sp.Name = strings.TrimSpace(sp.Name)
	sp.NameAr = strings.TrimSpace(sp.NameAr)
	sp.Slug = slugify(sp.Name, sp.Slug)
	if sp.FacultyID <= 0 {
		return errs.ErrSpecialisationFacultyRequired
	}
	if sp.Name == "" || sp.Slug == "" {
		return errs.ErrSpecialisationNameRequired
	}
	return s.repo.UpdateSpecialisation(ctx, sp, id)
}

func (s *HierarchyService) DeleteSpecialisation(ctx context.Context, idStr string) error {
	id, err := parsePositiveID(idStr)
	if err != nil {
		return errs.ErrSpecialisationInvalidID
	}
	return s.repo.DeleteSpecialisation(ctx, id)
}

func (s *HierarchyService) ListBranchSpecialisations(ctx context.Context) ([]models.BranchSpecialisation, error) {
	return s.repo.ListBranchSpecialisations(ctx)
}

func (s *HierarchyService) CreateBranchSpecialisation(ctx context.Context, bs models.BranchSpecialisation) error {
	if bs.BranchID <= 0 || bs.SpecialisationID <= 0 {
		return errs.ErrBranchSpecialisationInvalidID
	}
	facultyID, err := s.repo.GetSpecialisationFacultyID(ctx, bs.SpecialisationID)
	if err != nil {
		return err
	}
	ok, err := s.repo.FacultyBranchExists(ctx, facultyID, bs.BranchID)
	if err != nil {
		return err
	}
	if !ok {
		return errs.ErrFacultyBranchRequired
	}
	return s.repo.CreateBranchSpecialisation(ctx, bs)
}

func (s *HierarchyService) UpdateBranchSpecialisation(ctx context.Context, bs models.BranchSpecialisation, idStr string) error {
	id, err := parsePositiveID(idStr)
	if err != nil {
		return errs.ErrBranchSpecialisationInvalidID
	}
	if bs.BranchID <= 0 || bs.SpecialisationID <= 0 {
		return errs.ErrBranchSpecialisationInvalidID
	}
	facultyID, err := s.repo.GetSpecialisationFacultyID(ctx, bs.SpecialisationID)
	if err != nil {
		return err
	}
	ok, err := s.repo.FacultyBranchExists(ctx, facultyID, bs.BranchID)
	if err != nil {
		return err
	}
	if !ok {
		return errs.ErrFacultyBranchRequired
	}
	return s.repo.UpdateBranchSpecialisation(ctx, bs, id)
}

func (s *HierarchyService) DeleteBranchSpecialisation(ctx context.Context, idStr string) error {
	id, err := parsePositiveID(idStr)
	if err != nil {
		return errs.ErrBranchSpecialisationInvalidID
	}
	return s.repo.DeleteBranchSpecialisation(ctx, id)
}

func (s *HierarchyService) ListYears(ctx context.Context) ([]models.Year, error) {
	return s.repo.ListYears(ctx)
}

func (s *HierarchyService) CreateYear(ctx context.Context, y models.Year) error {
	y.Name = strings.TrimSpace(y.Name)
	if y.BranchSpecialisationID <= 0 {
		return errs.ErrYearOfferingRequired
	}
	if y.Name == "" {
		return errs.ErrYearNameRequired
	}
	return s.repo.CreateYear(ctx, y)
}

func (s *HierarchyService) UpdateYear(ctx context.Context, y models.Year, idStr string) error {
	id, err := parsePositiveID(idStr)
	if err != nil {
		return errs.ErrYearInvalidID
	}
	y.Name = strings.TrimSpace(y.Name)
	if y.BranchSpecialisationID <= 0 {
		return errs.ErrYearOfferingRequired
	}
	if y.Name == "" {
		return errs.ErrYearNameRequired
	}
	return s.repo.UpdateYear(ctx, y, id)
}

func (s *HierarchyService) DeleteYear(ctx context.Context, idStr string) error {
	id, err := parsePositiveID(idStr)
	if err != nil {
		return errs.ErrYearInvalidID
	}
	return s.repo.DeleteYear(ctx, id)
}

func (s *HierarchyService) ListSemesters(ctx context.Context) ([]models.Semester, error) {
	return s.repo.ListSemesters(ctx)
}

func (s *HierarchyService) CreateSemester(ctx context.Context, sem models.Semester) error {
	sem.Name = strings.TrimSpace(sem.Name)
	if sem.YearID <= 0 {
		return errs.ErrSemesterYearRequired
	}
	if sem.Name == "" {
		return errs.ErrSemesterNameRequired
	}
	return s.repo.CreateSemester(ctx, sem)
}

func (s *HierarchyService) UpdateSemester(ctx context.Context, sem models.Semester, idStr string) error {
	id, err := parsePositiveID(idStr)
	if err != nil {
		return errs.ErrSemesterInvalidID
	}
	sem.Name = strings.TrimSpace(sem.Name)
	if sem.YearID <= 0 {
		return errs.ErrSemesterYearRequired
	}
	if sem.Name == "" {
		return errs.ErrSemesterNameRequired
	}
	return s.repo.UpdateSemester(ctx, sem, id)
}

func (s *HierarchyService) DeleteSemester(ctx context.Context, idStr string) error {
	id, err := parsePositiveID(idStr)
	if err != nil {
		return errs.ErrSemesterInvalidID
	}
	return s.repo.DeleteSemester(ctx, id)
}

// NormalizeLinkLanguages validates and dedupes ar/fr/en codes.
func NormalizeLinkLanguages(langs []string) ([]string, error) {
	if langs == nil {
		return nil, nil
	}
	seen := map[string]bool{}
	var out []string
	for _, raw := range langs {
		lang := strings.ToLower(strings.TrimSpace(raw))
		switch lang {
		case "ar", "fr", "en":
			if !seen[lang] {
				seen[lang] = true
				out = append(out, lang)
			}
		case "":
			continue
		default:
			return nil, errs.ErrLinkInvalidLanguages
		}
	}
	if len(out) == 0 {
		return nil, nil
	}
	return out, nil
}
