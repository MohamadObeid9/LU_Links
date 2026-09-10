package errs

import "errors"

// Users errors
var (
	ErrUserGuestNotFound = errors.New("guest not found")
	ErrUserNotFound      = errors.New("user not found")
	ErrUserInvalidID     = errors.New("invalid user id")
	ErrUsernameTaken     = errors.New("username already taken")
	ErrUserNumberRange   = errors.New("number must be between 1 and 100")
	ErrUserNameRequired  = errors.New("first and last name are required")
	ErrUserInvalidLang   = errors.New("prefered_lang must be eng, fr, or ar")
	ErrUserInvalidTheme  = errors.New("prefered_theme must be system, dark, or light")
)

// Analytics errors
var (
	ErrAnalyticsInvalidRange        = errors.New("range must be 7, 30 or 90")
	ErrAnalyticsInvalidVisitorsSort = errors.New("visitors_sort must be clicks or name")
	ErrAnalyticsInvalidSearchQuery  = errors.New("search query is required")
	ErrAnalyticsInvalidBrowseStep   = errors.New("browse step must be year or list")
)

// Link clicks errors
var (
	ErrLinkClickLinkIDAndExtraLinkIDRequired = errors.New("link id and extra link id are required")
	ErrLinkClickLinkIDAndExtraLinkIDSet      = errors.New("link id and extra link id cannot be set at the same time")
)

// Reports Errors
var (
	ErrReportNotFound      = errors.New("report not found")
	ErrReportInvalidID     = errors.New("invalid report id")
	ErrReportInvalidStatus = errors.New("status must be open, resolved, or rejected")
)

// Links Errors
var (
	ErrLinkNotFound            = errors.New("link not found")
	ErrLinkInvalidID           = errors.New("invalid link id")
	ErrLinkURLAndLabelRequired = errors.New("link url and link label are required")
	ErrLinkURLTaken            = errors.New("this course already has that URL")
)

// Extra section errors
var (
	ErrExtraSectionNotFound      = errors.New("extra section not found")
	ErrExtraSectionInvalidID     = errors.New("invalid extra section id")
	ErrExtraSectionTitleRequired = errors.New("extra section title is required")
)

// Extra link errors
var (
	ErrExtraLinkNotFound            = errors.New("extra link not found")
	ErrExtraLinkInvalidID           = errors.New("invalid extra link id")
	ErrExtraLinkURLAndLabelRequired = errors.New("extra link url and label are required")
	ErrExtraLinkInvalidSectionID    = errors.New("extra link invalid section id")
)

// Course Errors
var (
	ErrCourseNotFound            = errors.New("course not found")
	ErrCourseInvalidID           = errors.New("course invalid id")
	ErrCourseInvalidSemestreID   = errors.New("course invalid semestre id")
	ErrCoursePatchEmpty          = errors.New("course invalid update parameters")
	ErrCourseCodeAndNameRequired = errors.New("course code and course name are required")
)

// Hierarchy Errors
var (
	ErrFacultyNotFound              = errors.New("faculty not found")
	ErrFacultyInvalidID             = errors.New("invalid faculty id")
	ErrFacultyNameRequired          = errors.New("faculty name is required")
	ErrBranchNotFound               = errors.New("branch not found")
	ErrBranchInvalidID              = errors.New("invalid branch id")
	ErrBranchNameRequired           = errors.New("branch name is required")
	ErrFacultyBranchNotFound        = errors.New("faculty branch link not found")
	ErrFacultyBranchRequired        = errors.New("faculty is not offered at that branch")
	ErrSpecialisationNotFound       = errors.New("specialisation not found")
	ErrSpecialisationInvalidID      = errors.New("invalid specialisation id")
	ErrSpecialisationNameRequired   = errors.New("specialisation name is required")
	ErrSpecialisationFacultyRequired = errors.New("specialisation faculty_id is required")
	ErrBranchSpecialisationNotFound = errors.New("branch specialisation not found")
	ErrBranchSpecialisationInvalidID = errors.New("invalid branch specialisation id")
	ErrYearNotFound                 = errors.New("year not found")
	ErrYearInvalidID                = errors.New("invalid year id")
	ErrYearNameRequired             = errors.New("year name is required")
	ErrYearOfferingRequired         = errors.New("year branch_specialisation_id is required")
	ErrSemesterNotFound             = errors.New("semester not found")
	ErrSemesterInvalidID            = errors.New("invalid semester id")
	ErrSemesterNameRequired         = errors.New("semester name is required")
	ErrSemesterYearRequired         = errors.New("semester year_id is required")
	ErrLinkInvalidLanguages         = errors.New("link languages must be ar, fr, and/or en")
)

// Contributions Errors
var (
	ErrContributionNotFound      = errors.New("contribution not found")
	ErrContributionInvalidID     = errors.New("invalid contribution id")
	ErrContributionInvalidStatus = errors.New("status must be pending, approved, or rejected")
)

// Common Errors
var (
	ErrDatabaseDown                 = errors.New("db is down")
	ErrStatusRequired               = errors.New("status is required")
	ErrCourseNameAndLinkUrlRequired = errors.New("course_name and link_url are required")
	ErrInvalidParams                = errors.New("limit should be between 1-100 and offset >= 0")
)

// Feedback Errors
var (
	ErrFeedbackNotFound                  = errors.New("feedback not found")
	ErrFeedbackInvalidID                 = errors.New("invalid feedback id")
	ErrFeedbackInvalidStatus             = errors.New("status must be new, read, or rejected")
	ErrFeedbackInvalidRating             = errors.New("rating should be between 1 and 5")
	ErrFeedbackCategoryAndRatingRequired = errors.New("category and rating are required")
	ErrFeedbackInvalidCategory           = errors.New("category must be one of the following : ui/ux or content or functionality or performance or accessibility or other")

	ErrSuggestionNotFound                   = errors.New("suggestion not found")
	ErrSuggestionInvalidID                  = errors.New("invalid suggestion id")
	ErrSuggestionInvalidStatus              = errors.New("status must be new, read, or rejected")
	ErrSuggestionCategoryAndDescRequired    = errors.New("category and description are required")
	ErrSuggestionInvalidCategory            = errors.New("category must be one of the following : feature or ux or content or performance or other")
)
