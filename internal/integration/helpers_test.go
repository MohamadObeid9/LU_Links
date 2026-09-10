//go:build integration

package integration

import (
	"context"
	"database/sql"
	"io"
	"log/slog"
	"net/http"
	"os"
	"testing"
	"time"

	"lu-links/internal/api"
	"lu-links/internal/app"
	"lu-links/internal/config"
	"lu-links/internal/database"
	"lu-links/internal/repository"
	"lu-links/internal/seo"
	"lu-links/internal/service"
	"lu-links/internal/webbotauth"
)

const (
	testJWTSecret      = "integration-test-jwt-secret"
	testSupabaseURL    = "https://example.supabase.co"
	testSupabaseAnon   = "integration-test-anon-key"
	testSiteBaseURL    = "http://localhost:8080"
)

const truncateTablesQuery = `
TRUNCATE TABLE
	browse_events,
	search_events,
	favorite_events,
	link_clicks,
	page_views,
	feedback,
	contributions,
	reports,
	links,
	extra_links,
	courses,
	extra_sections,
	semesters,
	years,
	branch_specialisations,
	specialisations,
	faculty_branches,
	branches,
	faculties,
	users
RESTART IDENTITY CASCADE
`

func integrationDSN(t *testing.T) string {
	t.Helper()
	dsn := os.Getenv("INTEGRATION_DATABASE_URL")
	if dsn == "" {
		t.Fatal("INTEGRATION_DATABASE_URL is required for integration tests")
	}
	return dsn
}

func openTestDB(t *testing.T) *database.Client {
	t.Helper()
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	client, err := database.New(integrationDSN(t), logger)
	if err != nil {
		t.Fatalf("database.New: %v", err)
	}
	t.Cleanup(func() { _ = client.Close() })
	return client
}

func resetDB(t *testing.T, db *sql.DB) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if _, err := db.ExecContext(ctx, truncateTablesQuery); err != nil {
		t.Fatalf("truncate tables: %v", err)
	}
}

func testConfig() config.Config {
	return config.Config{
		Port:              "8080",
		AppEnv:            "development",
		LogLevel:          "debug",
		JWTSecret:         testJWTSecret,
		DatabaseURL:       "unused-in-router",
		SiteBaseURL:       testSiteBaseURL,
		SupabaseURL:       testSupabaseURL,
		SupabaseAnonKey:   testSupabaseAnon,
		CorsAllowedOrigins: "http://localhost:8080",
	}
}

func newTestHandler(t *testing.T, dbClient *database.Client) *api.Handler {
	t.Helper()
	deps, _ := app.Wire(dbClient.DB)
	webBot, err := webbotauth.NewDirectory(testJWTSecret, testSiteBaseURL)
	if err != nil {
		t.Fatalf("webbotauth.NewDirectory: %v", err)
	}

	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	h, err := api.NewHandler(api.Dependencies{
		DB:                  dbClient,
		JWTSecret:           []byte(testJWTSecret),
		SiteBaseURL:         testSiteBaseURL,
		SupabaseURL:         testSupabaseURL,
		SupabaseAnonKey:     testSupabaseAnon,
		WebBotAuth:          webBot,
		UserService:         deps.UserService,
		AnalyticsService:    deps.AnalyticsService,
		LinkService:         deps.LinkService,
		CourseService:       deps.CourseService,
		ReportService:       deps.ReportService,
		ContentService:      deps.ContentService,
		FeedbackService:     deps.FeedbackService,
		SuggestionService:   deps.SuggestionService,
		PageViewService:     deps.PageViewService,
		LinkClickService:    deps.LinkClickService,
		ExtraLinkService:    deps.ExtraLinkService,
		ContributionService: deps.ContributionService,
		ExtraSectionService: deps.ExtraSectionService,
		HierarchyService:    deps.HierarchyService,
		Logger:              logger,
	})
	if err != nil {
		t.Fatalf("api.NewHandler: %v", err)
	}
	return h
}

func newTestRouter(t *testing.T, dbClient *database.Client) http.Handler {
	t.Helper()
	h := newTestHandler(t, dbClient)
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	seoHandler := seo.NewHandler(
		logger,
		service.NewSEOService(repository.NewPostgresSEORepository(dbClient.DB)),
		testSiteBaseURL,
	)
	return api.NewRouter(testConfig(), logger, h, seoHandler)
}

func newUserRepo(t *testing.T, db *sql.DB) repository.UserRepository {
	t.Helper()
	return repository.NewPostgresUserRepository(db)
}

func newContentRepo(t *testing.T, db *sql.DB) repository.ContentRepository {
	t.Helper()
	return repository.NewPostgresContentRepository(db)
}

