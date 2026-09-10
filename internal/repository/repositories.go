package repository

import (
	"context"

	"lu-links/internal/models"
)

type ContentRepository interface {
	Get(ctx context.Context) ([]byte, error)
	GetHierarchy(ctx context.Context) ([]byte, error)
	GetOffering(ctx context.Context, offeringID int) ([]byte, error)
	Search(ctx context.Context, q string, limit int) ([]byte, error)
	GetCoursesByIDs(ctx context.Context, ids []int) ([]byte, error)
}

type UserRepository interface {
	CreateGuest(ctx context.Context) (int, error)
	CreateUser(ctx context.Context, u models.User) (models.User, error)
	ClaimGuest(ctx context.Context, guestID int, u models.User) (models.User, error)
	AdoptGuest(ctx context.Context, guestID int, userID int) error
	DeleteExpiredGuests(ctx context.Context, maxAgeDays int) (int64, error)
	GetByID(ctx context.Context, id int) (models.User, error)
	GetByCredentials(ctx context.Context, u models.User) (models.User, error)
	UpdatePreferences(ctx context.Context, userID int, lang, theme string) (models.User, error)
	AddFavorite(ctx context.Context, userID int, courseID int) error
	RemoveFavorite(ctx context.Context, userID int, courseID int) error
	ListStudents(ctx context.Context, limit int, offset int, q string) ([]models.UserListItem, error)
	ListActivity(ctx context.Context, userID int, limit int, offset int) ([]models.UserActivityEvent, error)
	GetLastDeviceType(ctx context.Context, userID int) (string, error)
}

type AnalyticsSummaryParams struct {
	Days           int
	VisitorsLimit  int
	VisitorsOffset int
	VisitorsSort   string // "clicks" or "name"
}

type AnalyticsRepository interface {
	GetSummary(ctx context.Context, params AnalyticsSummaryParams) (models.AnalyticsSummary, error)
	InsertSearch(ctx context.Context, userID int, query string) error
	InsertBrowse(ctx context.Context, userID int, step string) error
}

type SEORepository interface {
	GetCoursePageByCode(ctx context.Context, code string) (*CoursePageData, error)
	ListCourseCodesForSitemap(ctx context.Context) ([]string, error)
	ListProgramsForSitemap(ctx context.Context, slugFn func(string) string) ([]ProgramSitemapEntry, error)
	ListCoursesIndex(ctx context.Context) ([]CourseIndexEntry, error)
	GetProgramBySlug(ctx context.Context, slug string, slugFn func(string) string) (*ProgramPageData, error)
}

type LinkClickRepository interface {
	List(ctx context.Context) ([]models.LinkClick, error)
	Create(ctx context.Context, lc models.LinkClick) error
}

type PageViewRepository interface {
	List(ctx context.Context) ([]models.PageView, error)
	Create(ctx context.Context, pv models.PageView) error
}

type LinkRepository interface {
	Delete(ctx context.Context, id int) error
	Create(ctx context.Context, link models.Link) error
	Update(ctx context.Context, link models.Link, id int) error
}

type ExtraSectionRepository interface {
	List(ctx context.Context) ([]models.ExtraSection, error)
	Create(ctx context.Context, section models.ExtraSection) error
	Update(ctx context.Context, section models.ExtraSection, id int) error
	Delete(ctx context.Context, id int) error
}

type ExtraLinkRepository interface {
	List(ctx context.Context) ([]models.ExtraLink, error)
	Create(ctx context.Context, link models.ExtraLink) error
	Update(ctx context.Context, link models.ExtraLink, id int) error
	Delete(ctx context.Context, id int) error
}

type CourseRepository interface {
	Delete(ctx context.Context, id int) error
	Create(ctx context.Context, course models.Course) error
	GetByID(ctx context.Context, id int) (models.Course, error)
	Update(ctx context.Context, course models.Course, id int) error
}

type HierarchyRepository interface {
	ListFaculties(ctx context.Context) ([]models.Faculty, error)
	CreateFaculty(ctx context.Context, f models.Faculty) error
	UpdateFaculty(ctx context.Context, f models.Faculty, id int) error
	DeleteFaculty(ctx context.Context, id int) error

	ListBranches(ctx context.Context) ([]models.Branch, error)
	CreateBranch(ctx context.Context, b models.Branch) error
	UpdateBranch(ctx context.Context, b models.Branch, id int) error
	DeleteBranch(ctx context.Context, id int) error

	ListFacultyBranches(ctx context.Context) ([]models.FacultyBranch, error)
	AddFacultyBranch(ctx context.Context, facultyID, branchID int) error
	RemoveFacultyBranch(ctx context.Context, facultyID, branchID int) error
	FacultyBranchExists(ctx context.Context, facultyID, branchID int) (bool, error)

	ListSpecialisations(ctx context.Context) ([]models.Specialisation, error)
	CreateSpecialisation(ctx context.Context, s models.Specialisation) error
	UpdateSpecialisation(ctx context.Context, s models.Specialisation, id int) error
	DeleteSpecialisation(ctx context.Context, id int) error
	GetSpecialisationFacultyID(ctx context.Context, id int) (int, error)

	ListBranchSpecialisations(ctx context.Context) ([]models.BranchSpecialisation, error)
	CreateBranchSpecialisation(ctx context.Context, bs models.BranchSpecialisation) error
	UpdateBranchSpecialisation(ctx context.Context, bs models.BranchSpecialisation, id int) error
	DeleteBranchSpecialisation(ctx context.Context, id int) error

	ListYears(ctx context.Context) ([]models.Year, error)
	CreateYear(ctx context.Context, y models.Year) error
	UpdateYear(ctx context.Context, y models.Year, id int) error
	DeleteYear(ctx context.Context, id int) error

	ListSemesters(ctx context.Context) ([]models.Semester, error)
	CreateSemester(ctx context.Context, s models.Semester) error
	UpdateSemester(ctx context.Context, s models.Semester, id int) error
	DeleteSemester(ctx context.Context, id int) error
}

type ReportRepository interface {
	Delete(ctx context.Context, id int) error
	Create(ctx context.Context, report models.Report) error
	Update(ctx context.Context, status string, id int) error
	List(ctx context.Context, limit int, offset int, q string, status string) ([]models.Report, error)
}

type ContributionRepository interface {
	Delete(ctx context.Context, id int) error
	Update(ctx context.Context, status string, id int) error
	Create(ctx context.Context, contribution models.Contribution) error
	List(ctx context.Context, limit int, offset int, q string, status string) ([]models.Contribution, error)
}

type FeedbackRepository interface {
	Delete(ctx context.Context, id int) error
	Update(ctx context.Context, status string, id int) error
	Create(ctx context.Context, feedback models.Feedback) error
	List(ctx context.Context, limit int, offset int, q string, status string) ([]models.Feedback, error)
}

type SuggestionRepository interface {
	Delete(ctx context.Context, id int) error
	Update(ctx context.Context, status string, id int) error
	Create(ctx context.Context, suggestion models.Suggestion) error
	List(ctx context.Context, limit int, offset int, q string, status string) ([]models.Suggestion, error)
}
