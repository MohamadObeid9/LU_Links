package main

import (
	"testing"

	"lu-links/internal/models"
)

func TestValidateBackup_OK(t *testing.T) {
	b := backup{ContentResponse: models.ContentResponse{
		Faculties:             []models.Faculty{{ID: 1, Name: "Sciences", Slug: "sciences"}},
		Branches:              []models.Branch{{ID: 1, Name: "Beirut", Slug: "beirut"}},
		FacultyBranches:       []models.FacultyBranch{{FacultyID: 1, BranchID: 1}},
		Specialisations:       []models.Specialisation{{ID: 1, FacultyID: 1, Name: "CS", Slug: "cs"}},
		BranchSpecialisations: []models.BranchSpecialisation{{ID: 1, BranchID: 1, SpecialisationID: 1}},
	}}
	if err := validateBackup(b); err != nil {
		t.Fatal(err)
	}
}

func TestValidateBackup_NoFaculties(t *testing.T) {
	if err := validateBackup(backup{}); err == nil {
		t.Fatal("want error")
	}
}
