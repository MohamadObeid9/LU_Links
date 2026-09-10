package repository

import (
	"context"
	"database/sql"
	"fmt"

	"lu-links/internal/errs"
	"lu-links/internal/models"
)

type postgresHierarchyRepository struct {
	db *sql.DB
}

func NewPostgresHierarchyRepository(db *sql.DB) HierarchyRepository {
	return &postgresHierarchyRepository{db: db}
}

func (r *postgresHierarchyRepository) ListFaculties(ctx context.Context) ([]models.Faculty, error) {
	rows, err := r.db.QueryContext(ctx, listFacultiesQuery)
	if err != nil {
		return nil, fmt.Errorf("list faculties: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var out []models.Faculty
	for rows.Next() {
		var f models.Faculty
		if err := rows.Scan(&f.ID, &f.Name, &f.NameAr, &f.Slug, &f.DisplayOrder); err != nil {
			return nil, fmt.Errorf("scan faculty: %w", err)
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

func (r *postgresHierarchyRepository) CreateFaculty(ctx context.Context, f models.Faculty) error {
	if _, err := r.db.ExecContext(ctx, insertFacultyQuery, f.Name, f.NameAr, f.Slug, f.DisplayOrder); err != nil {
		return fmt.Errorf("insert faculty: %w", err)
	}
	return nil
}

func (r *postgresHierarchyRepository) UpdateFaculty(ctx context.Context, f models.Faculty, id int) error {
	resp, err := r.db.ExecContext(ctx, updateFacultyQuery, f.Name, f.NameAr, f.Slug, f.DisplayOrder, id)
	if err != nil {
		return fmt.Errorf("update faculty: %w", err)
	}
	n, err := resp.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return errs.ErrFacultyNotFound
	}
	return nil
}

func (r *postgresHierarchyRepository) DeleteFaculty(ctx context.Context, id int) error {
	resp, err := r.db.ExecContext(ctx, deleteFacultyQuery, id)
	if err != nil {
		return fmt.Errorf("delete faculty: %w", err)
	}
	n, err := resp.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return errs.ErrFacultyNotFound
	}
	return nil
}

func (r *postgresHierarchyRepository) ListBranches(ctx context.Context) ([]models.Branch, error) {
	rows, err := r.db.QueryContext(ctx, listBranchesQuery)
	if err != nil {
		return nil, fmt.Errorf("list branches: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var out []models.Branch
	for rows.Next() {
		var b models.Branch
		if err := rows.Scan(&b.ID, &b.Name, &b.NameAr, &b.Slug, &b.DisplayOrder); err != nil {
			return nil, fmt.Errorf("scan branch: %w", err)
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

func (r *postgresHierarchyRepository) CreateBranch(ctx context.Context, b models.Branch) error {
	if _, err := r.db.ExecContext(ctx, insertBranchQuery, b.Name, b.NameAr, b.Slug, b.DisplayOrder); err != nil {
		return fmt.Errorf("insert branch: %w", err)
	}
	return nil
}

func (r *postgresHierarchyRepository) UpdateBranch(ctx context.Context, b models.Branch, id int) error {
	resp, err := r.db.ExecContext(ctx, updateBranchQuery, b.Name, b.NameAr, b.Slug, b.DisplayOrder, id)
	if err != nil {
		return fmt.Errorf("update branch: %w", err)
	}
	n, err := resp.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return errs.ErrBranchNotFound
	}
	return nil
}

func (r *postgresHierarchyRepository) DeleteBranch(ctx context.Context, id int) error {
	resp, err := r.db.ExecContext(ctx, deleteBranchQuery, id)
	if err != nil {
		return fmt.Errorf("delete branch: %w", err)
	}
	n, err := resp.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return errs.ErrBranchNotFound
	}
	return nil
}

func (r *postgresHierarchyRepository) ListFacultyBranches(ctx context.Context) ([]models.FacultyBranch, error) {
	rows, err := r.db.QueryContext(ctx, listFacultyBranchesQuery)
	if err != nil {
		return nil, fmt.Errorf("list faculty branches: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var out []models.FacultyBranch
	for rows.Next() {
		var fb models.FacultyBranch
		if err := rows.Scan(&fb.FacultyID, &fb.BranchID); err != nil {
			return nil, fmt.Errorf("scan faculty branch: %w", err)
		}
		out = append(out, fb)
	}
	return out, rows.Err()
}

func (r *postgresHierarchyRepository) AddFacultyBranch(ctx context.Context, facultyID, branchID int) error {
	if _, err := r.db.ExecContext(ctx, insertFacultyBranchQuery, facultyID, branchID); err != nil {
		return fmt.Errorf("insert faculty branch: %w", err)
	}
	return nil
}

func (r *postgresHierarchyRepository) RemoveFacultyBranch(ctx context.Context, facultyID, branchID int) error {
	resp, err := r.db.ExecContext(ctx, deleteFacultyBranchQuery, facultyID, branchID)
	if err != nil {
		return fmt.Errorf("delete faculty branch: %w", err)
	}
	n, err := resp.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return errs.ErrFacultyBranchNotFound
	}
	return nil
}

func (r *postgresHierarchyRepository) FacultyBranchExists(ctx context.Context, facultyID, branchID int) (bool, error) {
	var ok bool
	if err := r.db.QueryRowContext(ctx, facultyBranchExistsQuery, facultyID, branchID).Scan(&ok); err != nil {
		return false, fmt.Errorf("faculty branch exists: %w", err)
	}
	return ok, nil
}

func (r *postgresHierarchyRepository) ListSpecialisations(ctx context.Context) ([]models.Specialisation, error) {
	rows, err := r.db.QueryContext(ctx, listSpecialisationsQuery)
	if err != nil {
		return nil, fmt.Errorf("list specialisations: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var out []models.Specialisation
	for rows.Next() {
		var s models.Specialisation
		if err := rows.Scan(&s.ID, &s.FacultyID, &s.Name, &s.NameAr, &s.Slug, &s.DisplayOrder); err != nil {
			return nil, fmt.Errorf("scan specialisation: %w", err)
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r *postgresHierarchyRepository) CreateSpecialisation(ctx context.Context, s models.Specialisation) error {
	if _, err := r.db.ExecContext(ctx, insertSpecialisationQuery, s.FacultyID, s.Name, s.NameAr, s.Slug, s.DisplayOrder); err != nil {
		return fmt.Errorf("insert specialisation: %w", err)
	}
	return nil
}

func (r *postgresHierarchyRepository) UpdateSpecialisation(ctx context.Context, s models.Specialisation, id int) error {
	resp, err := r.db.ExecContext(ctx, updateSpecialisationQuery, s.FacultyID, s.Name, s.NameAr, s.Slug, s.DisplayOrder, id)
	if err != nil {
		return fmt.Errorf("update specialisation: %w", err)
	}
	n, err := resp.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return errs.ErrSpecialisationNotFound
	}
	return nil
}

func (r *postgresHierarchyRepository) DeleteSpecialisation(ctx context.Context, id int) error {
	resp, err := r.db.ExecContext(ctx, deleteSpecialisationQuery, id)
	if err != nil {
		return fmt.Errorf("delete specialisation: %w", err)
	}
	n, err := resp.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return errs.ErrSpecialisationNotFound
	}
	return nil
}

func (r *postgresHierarchyRepository) GetSpecialisationFacultyID(ctx context.Context, id int) (int, error) {
	var facultyID int
	err := r.db.QueryRowContext(ctx, getSpecialisationFacultyQuery, id).Scan(&facultyID)
	if err == sql.ErrNoRows {
		return 0, errs.ErrSpecialisationNotFound
	}
	if err != nil {
		return 0, fmt.Errorf("get specialisation faculty: %w", err)
	}
	return facultyID, nil
}

func (r *postgresHierarchyRepository) ListBranchSpecialisations(ctx context.Context) ([]models.BranchSpecialisation, error) {
	rows, err := r.db.QueryContext(ctx, listBranchSpecialisationsQuery)
	if err != nil {
		return nil, fmt.Errorf("list branch specialisations: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var out []models.BranchSpecialisation
	for rows.Next() {
		var bs models.BranchSpecialisation
		if err := rows.Scan(&bs.ID, &bs.BranchID, &bs.SpecialisationID, &bs.DisplayOrder); err != nil {
			return nil, fmt.Errorf("scan branch specialisation: %w", err)
		}
		out = append(out, bs)
	}
	return out, rows.Err()
}

func (r *postgresHierarchyRepository) CreateBranchSpecialisation(ctx context.Context, bs models.BranchSpecialisation) error {
	if _, err := r.db.ExecContext(ctx, insertBranchSpecialisationQuery, bs.BranchID, bs.SpecialisationID, bs.DisplayOrder); err != nil {
		return fmt.Errorf("insert branch specialisation: %w", err)
	}
	return nil
}

func (r *postgresHierarchyRepository) UpdateBranchSpecialisation(ctx context.Context, bs models.BranchSpecialisation, id int) error {
	resp, err := r.db.ExecContext(ctx, updateBranchSpecialisationQuery, bs.BranchID, bs.SpecialisationID, bs.DisplayOrder, id)
	if err != nil {
		return fmt.Errorf("update branch specialisation: %w", err)
	}
	n, err := resp.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return errs.ErrBranchSpecialisationNotFound
	}
	return nil
}

func (r *postgresHierarchyRepository) DeleteBranchSpecialisation(ctx context.Context, id int) error {
	resp, err := r.db.ExecContext(ctx, deleteBranchSpecialisationQuery, id)
	if err != nil {
		return fmt.Errorf("delete branch specialisation: %w", err)
	}
	n, err := resp.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return errs.ErrBranchSpecialisationNotFound
	}
	return nil
}

func (r *postgresHierarchyRepository) ListYears(ctx context.Context) ([]models.Year, error) {
	rows, err := r.db.QueryContext(ctx, listYearsQuery)
	if err != nil {
		return nil, fmt.Errorf("list years: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var out []models.Year
	for rows.Next() {
		var y models.Year
		if err := rows.Scan(&y.ID, &y.BranchSpecialisationID, &y.Name, &y.DisplayOrder); err != nil {
			return nil, fmt.Errorf("scan year: %w", err)
		}
		out = append(out, y)
	}
	return out, rows.Err()
}

func (r *postgresHierarchyRepository) CreateYear(ctx context.Context, y models.Year) error {
	if _, err := r.db.ExecContext(ctx, insertYearQuery, y.BranchSpecialisationID, y.Name, y.DisplayOrder); err != nil {
		return fmt.Errorf("insert year: %w", err)
	}
	return nil
}

func (r *postgresHierarchyRepository) UpdateYear(ctx context.Context, y models.Year, id int) error {
	resp, err := r.db.ExecContext(ctx, updateYearQuery, y.BranchSpecialisationID, y.Name, y.DisplayOrder, id)
	if err != nil {
		return fmt.Errorf("update year: %w", err)
	}
	n, err := resp.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return errs.ErrYearNotFound
	}
	return nil
}

func (r *postgresHierarchyRepository) DeleteYear(ctx context.Context, id int) error {
	resp, err := r.db.ExecContext(ctx, deleteYearQuery, id)
	if err != nil {
		return fmt.Errorf("delete year: %w", err)
	}
	n, err := resp.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return errs.ErrYearNotFound
	}
	return nil
}

func (r *postgresHierarchyRepository) ListSemesters(ctx context.Context) ([]models.Semester, error) {
	rows, err := r.db.QueryContext(ctx, listSemestersQuery)
	if err != nil {
		return nil, fmt.Errorf("list semesters: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var out []models.Semester
	for rows.Next() {
		var s models.Semester
		if err := rows.Scan(&s.ID, &s.YearID, &s.Name, &s.DisplayOrder); err != nil {
			return nil, fmt.Errorf("scan semester: %w", err)
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r *postgresHierarchyRepository) CreateSemester(ctx context.Context, s models.Semester) error {
	if _, err := r.db.ExecContext(ctx, insertSemesterQuery, s.YearID, s.Name, s.DisplayOrder); err != nil {
		return fmt.Errorf("insert semester: %w", err)
	}
	return nil
}

func (r *postgresHierarchyRepository) UpdateSemester(ctx context.Context, s models.Semester, id int) error {
	resp, err := r.db.ExecContext(ctx, updateSemesterQuery, s.YearID, s.Name, s.DisplayOrder, id)
	if err != nil {
		return fmt.Errorf("update semester: %w", err)
	}
	n, err := resp.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return errs.ErrSemesterNotFound
	}
	return nil
}

func (r *postgresHierarchyRepository) DeleteSemester(ctx context.Context, id int) error {
	resp, err := r.db.ExecContext(ctx, deleteSemesterQuery, id)
	if err != nil {
		return fmt.Errorf("delete semester: %w", err)
	}
	n, err := resp.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return errs.ErrSemesterNotFound
	}
	return nil
}
