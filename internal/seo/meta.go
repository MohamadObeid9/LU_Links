package seo

import (
	"fmt"
	"strings"

	"lu-links/internal/repository"
)

// BuildCourseTitle builds the HTML title for a course page (~60 chars target).
func BuildCourseTitle(name, code string, links []repository.SEOLink) string {
	types := presentContentLabels(links)
	typeStr := "matériaux"
	if len(types) > 0 {
		typeStr = strings.Join(types, ", ")
	}
	title := fmt.Sprintf("%s (%s) — %s | LU Links", name, strings.ToUpper(code), typeStr)
	if len(title) > 65 {
		title = fmt.Sprintf("%s (%s) | LU Links", name, strings.ToUpper(code))
	}
	return title
}

// BuildCourseDescription builds meta description (~155 chars).
func BuildCourseDescription(data *repository.CoursePageData) string {
	types := presentContentLabels(data.Links)
	programs := uniqueProgramNames(data.Placements)
	progStr := strings.Join(programs, ", ")
	typeStr := "TD, cours, examens, sessions, vidéos"
	if len(types) > 0 {
		typeStr = strings.Join(types, ", ")
	}
	desc := fmt.Sprintf(
		"Ressources étudiants Université Libanaise pour %s (%s) — %s. Liens %s (Drive, Telegram, Classroom). Parcours: %s.",
		data.Name, strings.ToUpper(data.Code), typeStr, typeStr, progStr,
	)
	if len(desc) > 160 {
		desc = fmt.Sprintf(
			"Matériaux %s (%s) — LU Links. %s. Liens étudiants Drive, Telegram, Classroom.",
			data.Name, strings.ToUpper(data.Code), typeStr,
		)
	}
	if len(desc) > 160 {
		desc = desc[:157] + "..."
	}
	return desc
}

func presentContentLabels(links []repository.SEOLink) []string {
	seen := make(map[string]bool)
	var labels []string
	order := []struct {
		token string
		label string
	}{
		{"exams", "examens"}, {"examens", "examens"}, {"exam", "examens"},
		{"td", "TD"}, {"tp", "TP"},
		{"cours", "cours"},
		{"sessions", "sessions"}, {"session", "sessions"},
		{"videos", "vidéos"}, {"video", "vidéos"},
	}
	for _, l := range links {
		for _, part := range stringsSplitComma(l.ContentType) {
			part = normalizeTypeToken(part)
			for _, o := range order {
				if part == o.token && !seen[o.label] {
					seen[o.label] = true
					labels = append(labels, o.label)
				}
			}
		}
	}
	return labels
}

func uniqueProgramNames(placements []repository.CoursePlacement) []string {
	seen := make(map[string]bool)
	var out []string
	for _, p := range placements {
		if !seen[p.ProgramName] {
			seen[p.ProgramName] = true
			out = append(out, p.ProgramName)
		}
	}
	return out
}

// GroupLinksBySection maps links to section IDs.
func GroupLinksBySection(links []repository.SEOLink) map[string][]repository.SEOLink {
	m := make(map[string][]repository.SEOLink)
	for _, l := range links {
		sec := ClassifyLinkSection(l.ContentType)
		m[sec] = append(m[sec], l)
	}
	return m
}
