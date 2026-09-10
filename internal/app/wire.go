package app

import (
	"database/sql"

	"lu-links/internal/api"
	"lu-links/internal/repository"
	"lu-links/internal/service"
)

// Wire builds repository-backed services for production and integration tests.
func Wire(db *sql.DB) (api.Dependencies, *service.UserService) {
	userRepo := repository.NewPostgresUserRepository(db)
	userService := service.NewUserService(userRepo)

	analyticsRepo := repository.NewPostgresAnalyticsRepository(db)
	analyticsService := service.NewAnalyticsService(analyticsRepo)

	linkRepo := repository.NewPostgresLinkRepository(db)
	linkService := service.NewLinkService(linkRepo)

	courseRepo := repository.NewPostgresCourseRepository(db)
	courseService := service.NewCourseService(courseRepo)

	reportRepo := repository.NewPostgresReportRepository(db)
	reportService := service.NewReportService(reportRepo)

	feedbackRepo := repository.NewPostgresFeedbackRepository(db)
	feedbackService := service.NewFeedbackService(feedbackRepo)

	suggestionRepo := repository.NewPostgresSuggestionRepository(db)
	suggestionService := service.NewSuggestionService(suggestionRepo)

	contentRepo := repository.NewPostgresContentRepository(db)
	contentService := service.NewContentService(contentRepo)

	pageViewRepo := repository.NewPostgresPageViewRepository(db)
	pageViewService := service.NewPageViewService(pageViewRepo)

	linkClickRepo := repository.NewPostgresLinkClickRepository(db)
	linkClickService := service.NewLinkClickService(linkClickRepo)

	contributionsRepo := repository.NewPostgresContributionRepository(db)
	contributionsService := service.NewContributionService(contributionsRepo)

	extraSectionRepo := repository.NewPostgresExtraSectionRepository(db)
	extraSectionService := service.NewExtraSectionService(extraSectionRepo)

	extraLinkRepo := repository.NewPostgresExtraLinkRepository(db)
	extraLinkService := service.NewExtraLinkService(extraLinkRepo)

	hierarchyRepo := repository.NewPostgresHierarchyRepository(db)
	hierarchyService := service.NewHierarchyService(hierarchyRepo)

	return api.Dependencies{
		UserService:         userService,
		AnalyticsService:    analyticsService,
		LinkService:         linkService,
		CourseService:       courseService,
		ReportService:       reportService,
		ContentService:      contentService,
		FeedbackService:     feedbackService,
		SuggestionService:   suggestionService,
		PageViewService:     pageViewService,
		LinkClickService:    linkClickService,
		ContributionService: contributionsService,
		ExtraSectionService: extraSectionService,
		ExtraLinkService:    extraLinkService,
		HierarchyService:    hierarchyService,
	}, userService
}
