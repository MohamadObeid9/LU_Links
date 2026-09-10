package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"lu-links/internal/models"
)

type backup struct {
	models.ContentResponse
	ExportedAt    string          `json:"exported_at"`
	LinkClicks    json.RawMessage `json:"link_clicks"`
	skippedClicks int
}

func loadBackup(path string) (backup, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return backup{}, fmt.Errorf("read %s: %w", path, err)
	}

	var b backup
	if err := json.Unmarshal(raw, &b); err != nil {
		return backup{}, fmt.Errorf("parse %s: %w (need an admin backup with faculties/years/courses arrays)", path, err)
	}
	if err := validateBackup(b); err != nil {
		return backup{}, fmt.Errorf("%s: %w", path, err)
	}
	if len(b.LinkClicks) > 0 && string(b.LinkClicks) != "null" {
		var clicks []json.RawMessage
		if err := json.Unmarshal(b.LinkClicks, &clicks); err == nil {
			b.skippedClicks = len(clicks)
		}
	}
	return b, nil
}

func validateBackup(b backup) error {
	if len(b.Faculties) == 0 {
		return fmt.Errorf("no faculties; export from Admin → Export (or GET /api/content)")
	}
	for i, f := range b.Faculties {
		if f.ID == 0 || f.Name == "" || f.Slug == "" {
			return fmt.Errorf("faculties[%d] needs id, name, slug", i)
		}
	}
	if len(b.Branches) == 0 || len(b.Specialisations) == 0 || len(b.BranchSpecialisations) == 0 {
		return fmt.Errorf("missing branches, specialisations, or branch_specialisations")
	}
	for i, y := range b.Years {
		if y.ID == 0 || y.BranchSpecialisationID == 0 || y.Name == "" {
			return fmt.Errorf("years[%d] needs id, branch_specialisation_id, name", i)
		}
	}
	for i, c := range b.Courses {
		if c.ID == 0 || c.SemesterID == 0 || c.Name == "" {
			return fmt.Errorf("courses[%d] needs id, semester_id, name", i)
		}
	}
	return nil
}

func apply(ctx context.Context, db *sql.DB, b backup) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if _, err := tx.ExecContext(ctx, `TRUNCATE TABLE faculties, branches, extra_sections RESTART IDENTITY CASCADE`); err != nil {
		return fmt.Errorf("truncate content: %w", err)
	}

	if err := insertNamed(ctx, tx, `INSERT INTO faculties (id, name, name_ar, slug, display_order) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5)`, b.Faculties, func(f models.Faculty) []any {
		return []any{f.ID, f.Name, f.NameAr, f.Slug, f.DisplayOrder}
	}); err != nil {
		return err
	}
	if err := insertNamed(ctx, tx, `INSERT INTO branches (id, name, name_ar, slug, display_order) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5)`, b.Branches, func(br models.Branch) []any {
		return []any{br.ID, br.Name, br.NameAr, br.Slug, br.DisplayOrder}
	}); err != nil {
		return err
	}
	for _, fb := range b.FacultyBranches {
		if _, err := tx.ExecContext(ctx, `INSERT INTO faculty_branches (faculty_id, branch_id) VALUES ($1,$2)`, fb.FacultyID, fb.BranchID); err != nil {
			return fmt.Errorf("faculty_branches: %w", err)
		}
	}
	for _, sp := range b.Specialisations {
		if _, err := tx.ExecContext(ctx, `INSERT INTO specialisations (id, faculty_id, name, name_ar, slug, display_order) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6)`,
			sp.ID, sp.FacultyID, sp.Name, sp.NameAr, sp.Slug, sp.DisplayOrder); err != nil {
			return fmt.Errorf("specialisations: %w", err)
		}
	}
	for _, bs := range b.BranchSpecialisations {
		if _, err := tx.ExecContext(ctx, `INSERT INTO branch_specialisations (id, branch_id, specialisation_id, display_order) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4)`,
			bs.ID, bs.BranchID, bs.SpecialisationID, bs.DisplayOrder); err != nil {
			return fmt.Errorf("branch_specialisations: %w", err)
		}
	}
	for _, y := range b.Years {
		if _, err := tx.ExecContext(ctx, `INSERT INTO years (id, branch_specialisation_id, name, display_order) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4)`,
			y.ID, y.BranchSpecialisationID, y.Name, y.DisplayOrder); err != nil {
			return fmt.Errorf("years: %w", err)
		}
	}
	for _, s := range b.Semesters {
		if _, err := tx.ExecContext(ctx, `INSERT INTO semesters (id, year_id, name, display_order) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4)`,
			s.ID, s.YearID, s.Name, s.DisplayOrder); err != nil {
			return fmt.Errorf("semesters: %w", err)
		}
	}
	for _, c := range b.Courses {
		if _, err := tx.ExecContext(ctx, `INSERT INTO courses (id, name, code, is_optional, semester_id, display_order) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6)`,
			c.ID, c.Name, c.Code, c.IsOptional, c.SemesterID, c.DisplayOrder); err != nil {
			return fmt.Errorf("courses: %w", err)
		}
	}
	for _, l := range b.Links {
		langs, _ := json.Marshal(l.Languages)
		if langs == nil {
			langs = []byte("[]")
		}
		if _, err := tx.ExecContext(ctx, `INSERT INTO links (id, course_id, type, url, label, note, content_type, display_order, languages) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
			l.ID, l.CourseID, l.Type, l.URL, l.Label, l.Note, l.ContentType, l.DisplayOrder, string(langs)); err != nil {
			return fmt.Errorf("links: %w", err)
		}
	}
	for _, s := range b.ExtraSections {
		if _, err := tx.ExecContext(ctx, `INSERT INTO extra_sections (id, title, icon, display_order) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4)`,
			s.ID, s.Title, s.Icon, s.DisplayOrder); err != nil {
			return fmt.Errorf("extra_sections: %w", err)
		}
	}
	for _, l := range b.ExtraLinks {
		if _, err := tx.ExecContext(ctx, `INSERT INTO extra_links (id, section_id, type, url, label, note, content_type, display_order) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
			l.ID, l.SectionID, l.Type, l.URL, l.Label, l.Note, l.ContentType, l.DisplayOrder); err != nil {
			return fmt.Errorf("extra_links: %w", err)
		}
	}

	for _, table := range []string{
		"faculties", "branches", "specialisations", "branch_specialisations",
		"years", "semesters", "courses", "links", "extra_sections", "extra_links",
	} {
		if _, err := tx.ExecContext(ctx, fmt.Sprintf(
			`SELECT setval(pg_get_serial_sequence('%s','id'), COALESCE((SELECT MAX(id) FROM %s), 1))`,
			table, table,
		)); err != nil && !strings.Contains(err.Error(), "does not exist") {
			// ignore missing sequence edge cases
			_ = err
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit: %w", err)
	}
	return nil
}

func insertNamed[T any](ctx context.Context, tx *sql.Tx, q string, rows []T, argsFn func(T) []any) error {
	for i, row := range rows {
		if _, err := tx.ExecContext(ctx, q, argsFn(row)...); err != nil {
			return fmt.Errorf("insert row %d: %w", i, err)
		}
	}
	return nil
}
