package repository

// User Queries
const (
	// favorite_course_ids travels as JSON text so it can be decoded without an array driver.
	userColumns = `id, COALESCE(first_name, ''), COALESCE(last_name, ''), COALESCE(number, 0), is_guest, COALESCE(array_to_json(favorite_course_ids)::text, '[]'), created_at, last_seen_at, prefered_lang, prefered_theme`

	insertNewGuestQuery = `INSERT INTO users (is_guest) VALUES (true) RETURNING id`
	insertNewUserQuery  = `INSERT INTO users (first_name,last_name,number,is_guest) VALUES ($1,$2,$3,false) RETURNING ` + userColumns
	claimGuestQuery     = `UPDATE users SET first_name = $1, last_name = $2, number = $3, is_guest = false, last_seen_at = now() WHERE id = $4 AND is_guest = true RETURNING ` + userColumns

	getUserByIDQuery          = `SELECT ` + userColumns + ` FROM users WHERE id = $1`
	getUserByCredentialsQuery = `SELECT ` + userColumns + ` FROM users WHERE first_name = $1 AND last_name = $2 AND number = $3 AND is_guest = false`
	updatePreferencesQuery    = `UPDATE users SET prefered_lang = $2, prefered_theme = $3, last_seen_at = now() WHERE id = $1 RETURNING ` + userColumns

	// Sign-in cannot claim the guest row (that name already belongs to a student),
	// so activity is moved across and the empty guest is deleted.
	lockGuestForAdoptQuery      = `SELECT id FROM users WHERE id = $1 AND is_guest = true FOR UPDATE`
	reassignPageViewsQuery      = `UPDATE page_views SET user_id = $2 WHERE user_id = $1`
	reassignLinkClicksQuery     = `UPDATE link_clicks SET user_id = $2 WHERE user_id = $1`
	reassignReportsQuery        = `UPDATE reports SET user_id = $2 WHERE user_id = $1`
	reassignContributionsQuery  = `UPDATE contributions SET user_id = $2 WHERE user_id = $1`
	reassignFeedbackQuery       = `UPDATE feedback SET user_id = $2 WHERE user_id = $1`
	reassignSuggestionsQuery    = `UPDATE suggestions SET user_id = $2 WHERE user_id = $1`
	reassignFavoriteEventsQuery = `UPDATE favorite_events SET user_id = $2 WHERE user_id = $1`
	reassignSearchEventsQuery   = `UPDATE search_events SET user_id = $2 WHERE user_id = $1`
	reassignBrowseEventsQuery   = `UPDATE browse_events SET user_id = $2 WHERE user_id = $1`
	deleteGuestQuery            = `DELETE FROM users WHERE id = $1 AND is_guest = true`
	// Guests that never signed up after maxAgeDays — cascade cleans their analytics rows.
	deleteExpiredGuestsQuery = `
		DELETE FROM users
		WHERE is_guest = true
		  AND created_at < now() - make_interval(days => $1)`
	touchLastSeenQuery = `UPDATE users SET last_seen_at = now() WHERE id = $1`
)

// Favorites Queries
const (
	addFavoriteQuery         = `UPDATE users SET favorite_course_ids = array_append(favorite_course_ids, $2), last_seen_at = now() WHERE id = $1 AND NOT (favorite_course_ids @> ARRAY[$2::integer])`
	removeFavoriteQuery      = `UPDATE users SET favorite_course_ids = array_remove(favorite_course_ids, $2), last_seen_at = now() WHERE id = $1 AND favorite_course_ids @> ARRAY[$2::integer]`
	insertFavoriteEventQuery = `INSERT INTO favorite_events (user_id,course_id,action) VALUES ($1,$2,$3)`
)

// Admin Students Queries
const (
	studentColumns = `u.id, COALESCE(u.first_name, ''), COALESCE(u.last_name, ''), COALESCE(u.number, 0), u.created_at, u.last_seen_at,
		       (SELECT COUNT(*) FROM page_views pv WHERE pv.user_id = u.id),
		       (SELECT COUNT(*) FROM link_clicks lc WHERE lc.user_id = u.id)`

	listStudentsBaseQuery  = `SELECT ` + studentColumns + ` FROM users u WHERE u.is_guest = false`
	listStudentsOrderQuery = ` ORDER BY u.first_name ASC, u.last_name ASC LIMIT `

	listStudentsQuery      = listStudentsBaseQuery + listStudentsOrderQuery + `$1 OFFSET $2`
	listStudentsWithQQuery = listStudentsBaseQuery + ` AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1)` + listStudentsOrderQuery + `$2 OFFSET $3`

	// listUserTimelineQuery merges every activity table into one chronological feed.
	// device_type is set on page_views; other event types return ''.
	listUserTimelineQuery = `
		SELECT type, at, summary, ref_id, device_type FROM (
			SELECT 'visit' AS type, pv.visited_at AS at,
			       'visited ' || COALESCE(pv.page, 'home')
			           || CASE WHEN pv.device_type IN ('phone', 'laptop')
			                   THEN ' from ' || pv.device_type ELSE '' END AS summary,
			       pv.id AS ref_id,
			       COALESCE(pv.device_type, '') AS device_type
			FROM page_views pv WHERE pv.user_id = $1
			UNION ALL
			SELECT 'link_click', lc.clicked_at,
			       CASE
			           WHEN lc.extra_link_id IS NOT NULL THEN
			               'opened ' || COALESCE(NULLIF(trim(el.label), ''), initcap(COALESCE(el.type, '')), 'a link')
			                   || COALESCE(' in ' || es.title, '')
			           ELSE
			               'opened ' || COALESCE(NULLIF(trim(l.label), ''), initcap(COALESCE(l.type, '')), 'a link')
			                   || COALESCE(' in ' || c.name, '')
			                   || COALESCE(
			                       (
			                           SELECT ' · ' || f.name || ' · ' || b.name || ' · ' || sp.name
			                           FROM semesters s
			                           JOIN years y ON y.id = s.year_id
			                           JOIN branch_specialisations bs ON bs.id = y.branch_specialisation_id
			                           JOIN branches b ON b.id = bs.branch_id
			                           JOIN specialisations sp ON sp.id = bs.specialisation_id
			                           JOIN faculties f ON f.id = sp.faculty_id
			                           WHERE s.id = c.semester_id
			                       ),
			                       ''
			                   )
			       END,
			       lc.id, ''
			FROM link_clicks lc
			LEFT JOIN links l ON l.id = lc.link_id
			LEFT JOIN courses c ON c.id = l.course_id
			LEFT JOIN extra_links el ON el.id = lc.extra_link_id
			LEFT JOIN extra_sections es ON es.id = el.section_id
			WHERE lc.user_id = $1
			UNION ALL
			SELECT 'report', r.created_at,
			       'reported a link in ' || r.course_name, r.id, ''
			FROM reports r WHERE r.user_id = $1
			UNION ALL
			SELECT 'contribution', c.created_at,
			       'suggested a link for ' || c.course_name, c.id, ''
			FROM contributions c WHERE c.user_id = $1
			UNION ALL
			SELECT 'feedback', f.created_at,
			       'sent ' || f.category || ' feedback rated ' || f.rating || '/5', f.id, ''
			FROM feedback f WHERE f.user_id = $1
			UNION ALL
			SELECT 'suggestion', s.created_at,
			       'suggested ' || s.category || ' improvement', s.id, ''
			FROM suggestions s WHERE s.user_id = $1
			UNION ALL
			SELECT CASE WHEN fe.action = 'added' THEN 'favorite_added' ELSE 'favorite_removed' END,
			       fe.created_at,
			       CASE WHEN fe.action = 'added'
			            THEN 'added ' || co.name || ' to favorites'
			            ELSE 'removed ' || co.name || ' from favorites' END,
			       fe.id, ''
			FROM favorite_events fe
			JOIN courses co ON co.id = fe.course_id
			WHERE fe.user_id = $1
		) timeline
		ORDER BY at DESC
		LIMIT $2 OFFSET $3`

	getLastDeviceTypeQuery = `SELECT device_type FROM page_views WHERE user_id = $1 AND device_type IS NOT NULL ORDER BY visited_at DESC LIMIT 1`
)

// Admin Analytics Queries
const (
	analyticsCountsQuery = `
		SELECT
			(SELECT COUNT(*) FROM users WHERE is_guest = false),
			(SELECT COUNT(*) FROM users WHERE is_guest = false AND created_at >= now() - interval '7 days'),
			(SELECT COUNT(*) FROM users WHERE is_guest = false AND created_at >= now() - interval '30 days'),
			(SELECT COUNT(*) FROM users WHERE is_guest = false AND created_at >= now() - interval '90 days'),
			(SELECT COUNT(DISTINCT uid) FROM (
				SELECT user_id AS uid FROM page_views
				WHERE user_id IS NOT NULL AND visited_at >= date_trunc('day', now())
				UNION
				SELECT user_id AS uid FROM link_clicks
				WHERE user_id IS NOT NULL AND clicked_at >= date_trunc('day', now())
			) active_today),
			(SELECT COUNT(*) FROM link_clicks WHERE clicked_at >= date_trunc('day', now())),
			(SELECT COUNT(DISTINCT user_id) FROM page_views WHERE user_id IS NOT NULL AND visited_at >= date_trunc('day', now()) AND device_type = 'phone'),
			(SELECT COUNT(DISTINCT user_id) FROM page_views WHERE user_id IS NOT NULL AND visited_at >= date_trunc('day', now()) AND device_type = 'laptop'),
			(SELECT COUNT(*) FROM (
				SELECT user_id FROM page_views
				WHERE user_id IS NOT NULL AND visited_at >= date_trunc('day', now()) AND device_type IS NOT NULL
				GROUP BY user_id HAVING COUNT(DISTINCT device_type) > 1
			) both_today),
			(SELECT COUNT(DISTINCT user_id) FROM page_views WHERE user_id IS NOT NULL AND visited_at >= now() - make_interval(days => $1)),
			(SELECT COUNT(*) FROM link_clicks WHERE clicked_at >= now() - make_interval(days => $1)),
			(SELECT COUNT(DISTINCT user_id) FROM link_clicks WHERE user_id IS NOT NULL AND clicked_at >= now() - make_interval(days => $1)),
			(SELECT COUNT(DISTINCT user_id) FROM page_views WHERE user_id IS NOT NULL AND visited_at >= now() - make_interval(days => $1 * 2) AND visited_at < now() - make_interval(days => $1)),
			(SELECT COUNT(*) FROM link_clicks WHERE clicked_at >= now() - make_interval(days => $1 * 2) AND clicked_at < now() - make_interval(days => $1)),
			(SELECT COUNT(DISTINCT user_id) FROM page_views WHERE user_id IS NOT NULL AND visited_at >= now() - make_interval(days => $1) AND device_type = 'phone'),
			(SELECT COUNT(DISTINCT user_id) FROM page_views WHERE user_id IS NOT NULL AND visited_at >= now() - make_interval(days => $1) AND device_type = 'laptop'),
			(SELECT COUNT(*) FROM (
				SELECT user_id FROM page_views
				WHERE user_id IS NOT NULL AND visited_at >= now() - make_interval(days => $1) AND device_type IS NOT NULL
				GROUP BY user_id HAVING COUNT(DISTINCT device_type) > 1
			) both_range),
			(SELECT COUNT(DISTINCT pv.user_id) FROM page_views pv
				WHERE pv.user_id IS NOT NULL AND pv.visited_at >= now() - make_interval(days => $1)
				AND EXISTS (SELECT 1 FROM page_views older WHERE older.user_id = pv.user_id AND older.visited_at < now() - make_interval(days => $1))),
			(SELECT COUNT(DISTINCT pv.user_id) FROM page_views pv
				WHERE pv.user_id IS NOT NULL AND pv.visited_at >= now() - make_interval(days => $1)
				AND NOT EXISTS (SELECT 1 FROM page_views older WHERE older.user_id = pv.user_id AND older.visited_at < now() - make_interval(days => $1))),
			(SELECT COUNT(*) FROM users WHERE created_at >= now() - make_interval(days => $1)),
			(SELECT COUNT(*) FROM users WHERE is_guest = false AND created_at >= now() - make_interval(days => $1)),
			(SELECT COUNT(*) FROM users WHERE is_guest = false AND created_at >= now() - make_interval(days => $1 * 2) AND created_at < now() - make_interval(days => $1)),
			(SELECT COUNT(*) FROM users WHERE is_guest = true AND created_at >= now() - make_interval(days => $1)),
			(SELECT COUNT(*) FROM users WHERE is_guest = true),
			(SELECT COUNT(*) FROM reports WHERE status = 'open'),
			(SELECT COUNT(*) FROM contributions WHERE status = 'pending'),
			(SELECT COUNT(*) FROM feedback WHERE status = 'new'),
			(SELECT COUNT(*) FROM suggestions WHERE status = 'new'),
			(SELECT COUNT(DISTINCT user_id) FROM browse_events WHERE step = 'year' AND created_at >= now() - make_interval(days => $1)),
			(SELECT COUNT(DISTINCT user_id) FROM browse_events WHERE step = 'list' AND created_at >= now() - make_interval(days => $1)),
			(SELECT COUNT(DISTINCT u.id) FROM users u
				WHERE u.is_guest = false
				AND (
					EXISTS (
						SELECT 1 FROM page_views pv
						WHERE pv.user_id = u.id AND pv.visited_at >= now() - make_interval(days => $1)
					)
					OR EXISTS (
						SELECT 1 FROM link_clicks lc
						WHERE lc.user_id = u.id AND lc.clicked_at >= now() - make_interval(days => $1)
					)
				))`

	analyticsDailyUniqueVisitsQuery = `
		SELECT to_char(visited_at, 'YYYY-MM-DD') AS day, COUNT(DISTINCT user_id)
		FROM page_views
		WHERE user_id IS NOT NULL AND visited_at >= now() - make_interval(days => $1)
		GROUP BY day
		ORDER BY day ASC`

	analyticsTopLinksQuery = `
		SELECT link_id, extra_link_id, COUNT(*) AS clicks
		FROM link_clicks
		WHERE clicked_at >= now() - make_interval(days => $1)
		GROUP BY link_id, extra_link_id
		ORDER BY clicks DESC
		LIMIT 50`

	analyticsTopUsersQuery = `
		SELECT u.id, COALESCE(u.first_name, ''), COALESCE(u.last_name, ''), COALESCE(u.number, 0), COUNT(lc.id) AS clicks
		FROM link_clicks lc
		JOIN users u ON u.id = lc.user_id
		WHERE lc.clicked_at >= now() - make_interval(days => $1)
		GROUP BY u.id, u.first_name, u.last_name, u.number
		ORDER BY clicks DESC, u.first_name ASC
		LIMIT 50`

	analyticsTopLinksTodayQuery = `
		SELECT link_id, extra_link_id, COUNT(*) AS clicks
		FROM link_clicks
		WHERE clicked_at >= date_trunc('day', now())
		GROUP BY link_id, extra_link_id
		ORDER BY clicks DESC
		LIMIT 50`

	analyticsDailyRosterQuery = `
		WITH days AS (
			SELECT generate_series(
				date_trunc('day', now()) - make_interval(days => $1 - 1),
				date_trunc('day', now()),
				interval '1 day'
			) AS day
		)
		SELECT to_char(d.day, 'YYYY-MM-DD'),
		       COUNT(u.id)
		FROM days d
		LEFT JOIN users u ON u.is_guest = false AND u.created_at < d.day + interval '1 day'
		GROUP BY d.day
		ORDER BY d.day ASC`

	// Counts today's student activity (timeline events) except home page visits.
	analyticsUserActivityTodayCountSQL = `(
		SELECT COUNT(*)::bigint FROM (
			SELECT lc.id FROM link_clicks lc
			WHERE lc.user_id = u.id AND lc.clicked_at >= date_trunc('day', now())
			UNION ALL
			SELECT r.id FROM reports r
			WHERE r.user_id = u.id AND r.created_at >= date_trunc('day', now())
			UNION ALL
			SELECT c.id FROM contributions c
			WHERE c.user_id = u.id AND c.created_at >= date_trunc('day', now())
			UNION ALL
			SELECT f.id FROM feedback f
			WHERE f.user_id = u.id AND f.created_at >= date_trunc('day', now())
			UNION ALL
			SELECT fe.id FROM favorite_events fe
			WHERE fe.user_id = u.id AND fe.created_at >= date_trunc('day', now())
			UNION ALL
			SELECT pv.id FROM page_views pv
			WHERE pv.user_id = u.id AND pv.visited_at >= date_trunc('day', now())
			  AND lower(COALESCE(pv.page, 'home')) <> 'home'
		) activity_today
	)`

	// A visitor is anyone with a page view or meaningful activity today. Link opens are
	// gated behind signup, so a click without a page_views row still means the
	// person was on the site (e.g. visit POST failed or session was re-bootstrapped).
	analyticsVisitorsTodayPresenceSQL = `
		EXISTS (SELECT 1 FROM page_views pv WHERE pv.user_id = u.id AND pv.visited_at >= date_trunc('day', now()))
		OR EXISTS (SELECT 1 FROM link_clicks lc WHERE lc.user_id = u.id AND lc.clicked_at >= date_trunc('day', now()))
		OR EXISTS (SELECT 1 FROM reports r WHERE r.user_id = u.id AND r.created_at >= date_trunc('day', now()))
		OR EXISTS (SELECT 1 FROM contributions c WHERE c.user_id = u.id AND c.created_at >= date_trunc('day', now()))
		OR EXISTS (SELECT 1 FROM feedback f WHERE f.user_id = u.id AND f.created_at >= date_trunc('day', now()))
		OR EXISTS (SELECT 1 FROM favorite_events fe WHERE fe.user_id = u.id AND fe.created_at >= date_trunc('day', now()))`

	analyticsVisitorsTodayByClicksQuery = `
		SELECT u.id, COALESCE(u.first_name, ''), COALESCE(u.last_name, ''), COALESCE(u.number, 0),
		       ` + analyticsUserActivityTodayCountSQL + ` AS clicks
		FROM users u
		WHERE ` + analyticsVisitorsTodayPresenceSQL + `
		ORDER BY clicks DESC, u.first_name ASC, u.last_name ASC, u.id ASC
		LIMIT $1 OFFSET $2`

	analyticsVisitorsTodayByNameQuery = `
		SELECT u.id, COALESCE(u.first_name, ''), COALESCE(u.last_name, ''), COALESCE(u.number, 0),
		       ` + analyticsUserActivityTodayCountSQL + ` AS clicks
		FROM users u
		WHERE ` + analyticsVisitorsTodayPresenceSQL + `
		ORDER BY u.first_name ASC, u.last_name ASC, u.id ASC
		LIMIT $1 OFFSET $2`

	// Offering label: Faculty · Branch · Specialisation (kept as program_name in JSON for admin UI).
	courseOfferingLabelSQL = `
		COALESCE(
			(SELECT f.name || ' · ' || b.name || ' · ' || sp.name
			 FROM semesters s
			 JOIN years y ON y.id = s.year_id
			 JOIN branch_specialisations bs ON bs.id = y.branch_specialisation_id
			 JOIN branches b ON b.id = bs.branch_id
			 JOIN specialisations sp ON sp.id = bs.specialisation_id
			 JOIN faculties f ON f.id = sp.faculty_id
			 WHERE s.id = c.semester_id),
			''
		)`

	analyticsTopCoursesQuery = `
		SELECT c.id, c.name, c.code, COUNT(*)::int, ` + courseOfferingLabelSQL + `
		FROM link_clicks lc
		JOIN links l ON l.id = lc.link_id
		JOIN courses c ON c.id = l.course_id
		WHERE lc.clicked_at >= now() - make_interval(days => $1)
		GROUP BY c.id, c.name, c.code, c.semester_id
		ORDER BY COUNT(*) DESC, c.name ASC
		LIMIT 50`

	analyticsZeroClickCoursesQuery = `
		SELECT c.id, c.name, c.code, 0, ` + courseOfferingLabelSQL + `
		FROM courses c
		WHERE EXISTS (SELECT 1 FROM links l WHERE l.course_id = c.id)
		  AND NOT EXISTS (
			SELECT 1 FROM links l
			JOIN link_clicks lc ON lc.link_id = l.id AND lc.clicked_at >= now() - make_interval(days => $1)
			WHERE l.course_id = c.id
		  )
		ORDER BY c.name ASC
		LIMIT 50`

	analyticsZeroClickLinksQuery = `
		SELECT kind, id, label, course_name, program_name FROM (
			SELECT 'link'::text AS kind, l.id, COALESCE(l.label, 'Link') AS label, c.name AS course_name,
			       ` + courseOfferingLabelSQL + ` AS program_name
			FROM links l
			JOIN courses c ON c.id = l.course_id
			WHERE NOT EXISTS (
				SELECT 1 FROM link_clicks lc
				WHERE lc.link_id = l.id AND lc.clicked_at >= now() - make_interval(days => $1)
			)
			UNION ALL
			SELECT 'extra_link', el.id, COALESCE(el.label, 'Link'), es.title, ''
			FROM extra_links el
			JOIN extra_sections es ON es.id = el.section_id
			WHERE NOT EXISTS (
				SELECT 1 FROM link_clicks lc
				WHERE lc.extra_link_id = el.id AND lc.clicked_at >= now() - make_interval(days => $1)
			)
		) gaps
		ORDER BY course_name ASC, label ASC
		LIMIT 50`

	analyticsTopFavoritesQuery = `
		SELECT c.id, c.name, c.code, COUNT(*)::int, ` + courseOfferingLabelSQL + `
		FROM users u
		CROSS JOIN LATERAL unnest(u.favorite_course_ids) AS cid
		JOIN courses c ON c.id = cid
		WHERE u.is_guest = false
		GROUP BY c.id, c.name, c.code, c.semester_id
		ORDER BY COUNT(*) DESC, c.name ASC
		LIMIT 50`

	analyticsVisitHeatmapQuery = `
		SELECT EXTRACT(DOW FROM visited_at)::int, EXTRACT(HOUR FROM visited_at)::int, COUNT(*)::int
		FROM page_views
		WHERE visited_at >= now() - make_interval(days => $1)
		GROUP BY 1, 2`

	analyticsClickHeatmapQuery = `
		SELECT EXTRACT(DOW FROM clicked_at)::int, EXTRACT(HOUR FROM clicked_at)::int, COUNT(*)::int
		FROM link_clicks
		WHERE clicked_at >= now() - make_interval(days => $1)
		GROUP BY 1, 2`

	analyticsSearchTermsQuery = `
		SELECT query, COUNT(*)::int
		FROM search_events
		WHERE created_at >= now() - make_interval(days => $1)
		GROUP BY query
		ORDER BY COUNT(*) DESC, query ASC
		LIMIT 50`

	// Drop recent prefix fragments from the same typer (e.g. "an"/"ang"/"ang32"
	// while finishing "ang320"), then record the settled query.
	insertSearchEventQuery = `
		WITH pruned AS (
			DELETE FROM search_events
			WHERE user_id = $1
			  AND created_at >= now() - interval '90 seconds'
			  AND char_length(query) < char_length($2::text)
			  AND $2::text LIKE query || '%'
			RETURNING id
		)
		INSERT INTO search_events (user_id, query) VALUES ($1, $2)`
	insertBrowseEventQuery = `INSERT INTO browse_events (user_id, step) VALUES ($1, $2)`
)

// Page Views Queries
const (
	// One statement keeps the visit row and the last_seen_at touch atomic.
	insertPageViewQuery = `WITH visit AS (INSERT INTO page_views (page,user_id,device_type) VALUES ($1,$2,$3)) UPDATE users SET last_seen_at = now() WHERE id = $2`
	GetPageViewQuery    = `SELECT id, page, visited_at FROM page_views ORDER BY visited_at DESC`
)

// Link Clicks Queries
const (
	insertLinkClickQuery = `WITH click AS (INSERT INTO link_clicks (link_id,extra_link_id,user_id) VALUES ($1,$2,$3)) UPDATE users SET last_seen_at = now() WHERE id = $3`
	GetLinkClickQuery    = `SELECT id, link_id, extra_link_id, clicked_at FROM link_clicks ORDER BY clicked_at DESC`
)

// Courses Queries
const (
	getCourseByIDQuery = `SELECT id, name, code, is_optional, semester_id, display_order FROM courses WHERE id = $1`
	deleteCourseQuery  = `DELETE FROM courses WHERE id = $1`
	updateCourseQuery  = `UPDATE courses SET name = $1, code = $2, is_optional = $3, semester_id = $4, display_order = $5 WHERE id = $6`
	insertCourseQuery  = `INSERT INTO courses (name, code, is_optional, semester_id, display_order) VALUES ($1, $2, $3, $4, $5)`
)

// Links Queries
const (
	deleteLinkQuery = `DELETE FROM links WHERE id = $1`
	updateLinkQuery = `UPDATE links SET type = $1, url = $2, label = $3, note = $4, content_type = $5, languages = $6::jsonb WHERE id = $7`
	insertLinkQuery = `INSERT INTO links (course_id, type, url, label, note, content_type, display_order, languages) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`
)

// Hierarchy Queries
const (
	listFacultiesQuery  = `SELECT id, name, name_ar, slug, display_order FROM faculties ORDER BY display_order ASC, id ASC`
	insertFacultyQuery  = `INSERT INTO faculties (name, name_ar, slug, display_order) VALUES ($1, $2, $3, $4)`
	updateFacultyQuery  = `UPDATE faculties SET name = $1, name_ar = $2, slug = $3, display_order = $4 WHERE id = $5`
	deleteFacultyQuery  = `DELETE FROM faculties WHERE id = $1`

	listBranchesQuery = `SELECT id, name, name_ar, slug, display_order FROM branches ORDER BY display_order ASC, id ASC`
	insertBranchQuery = `INSERT INTO branches (name, name_ar, slug, display_order) VALUES ($1, $2, $3, $4)`
	updateBranchQuery = `UPDATE branches SET name = $1, name_ar = $2, slug = $3, display_order = $4 WHERE id = $5`
	deleteBranchQuery = `DELETE FROM branches WHERE id = $1`

	listFacultyBranchesQuery  = `SELECT faculty_id, branch_id FROM faculty_branches`
	insertFacultyBranchQuery  = `INSERT INTO faculty_branches (faculty_id, branch_id) VALUES ($1, $2)`
	deleteFacultyBranchQuery  = `DELETE FROM faculty_branches WHERE faculty_id = $1 AND branch_id = $2`
	facultyBranchExistsQuery  = `SELECT EXISTS(SELECT 1 FROM faculty_branches WHERE faculty_id = $1 AND branch_id = $2)`

	listSpecialisationsQuery = `SELECT id, faculty_id, name, name_ar, slug, display_order FROM specialisations ORDER BY display_order ASC, id ASC`
	insertSpecialisationQuery = `INSERT INTO specialisations (faculty_id, name, name_ar, slug, display_order) VALUES ($1, $2, $3, $4, $5)`
	updateSpecialisationQuery = `UPDATE specialisations SET faculty_id = $1, name = $2, name_ar = $3, slug = $4, display_order = $5 WHERE id = $6`
	deleteSpecialisationQuery = `DELETE FROM specialisations WHERE id = $1`
	getSpecialisationFacultyQuery = `SELECT faculty_id FROM specialisations WHERE id = $1`

	listBranchSpecialisationsQuery = `SELECT id, branch_id, specialisation_id, display_order FROM branch_specialisations ORDER BY display_order ASC, id ASC`
	insertBranchSpecialisationQuery = `INSERT INTO branch_specialisations (branch_id, specialisation_id, display_order) VALUES ($1, $2, $3)`
	updateBranchSpecialisationQuery = `UPDATE branch_specialisations SET branch_id = $1, specialisation_id = $2, display_order = $3 WHERE id = $4`
	deleteBranchSpecialisationQuery = `DELETE FROM branch_specialisations WHERE id = $1`

	listYearsQuery   = `SELECT id, branch_specialisation_id, name, display_order FROM years ORDER BY display_order ASC, id ASC`
	insertYearQuery  = `INSERT INTO years (branch_specialisation_id, name, display_order) VALUES ($1, $2, $3)`
	updateYearQuery  = `UPDATE years SET branch_specialisation_id = $1, name = $2, display_order = $3 WHERE id = $4`
	deleteYearQuery  = `DELETE FROM years WHERE id = $1`

	listSemestersQuery  = `SELECT id, year_id, name, display_order FROM semesters ORDER BY display_order ASC, id ASC`
	insertSemesterQuery = `INSERT INTO semesters (year_id, name, display_order) VALUES ($1, $2, $3)`
	updateSemesterQuery = `UPDATE semesters SET year_id = $1, name = $2, display_order = $3 WHERE id = $4`
	deleteSemesterQuery = `DELETE FROM semesters WHERE id = $1`
)

// Extra sections queries
const (
	listExtraSectionsQuery         = `SELECT id, title, icon, display_order FROM extra_sections ORDER BY display_order ASC`
	insertExtraSectionQuery        = `INSERT INTO extra_sections (title, icon, display_order) VALUES ($1, $2, $3)`
	updateExtraSectionQuery        = `UPDATE extra_sections SET title = $1, icon = $2 WHERE id = $3`
	deleteExtraSectionQuery        = `DELETE FROM extra_sections WHERE id = $1`
	deleteExtraLinksBySectionQuery = `DELETE FROM extra_links WHERE section_id = $1`
)

// Extra links queries
const (
	listExtraLinksQuery  = `SELECT id, section_id, type, url, label, note, content_type, display_order FROM extra_links ORDER BY display_order ASC`
	insertExtraLinkQuery = `INSERT INTO extra_links (section_id, type, url, label, note, content_type, display_order) VALUES ($1, $2, $3, $4, $5, $6, $7)`
	updateExtraLinkQuery = `UPDATE extra_links SET type = $1, url = $2, label = $3, note = $4, content_type = $5 WHERE id = $6`
	deleteExtraLinkQuery = `DELETE FROM extra_links WHERE id = $1`
)

// Feedbacks Queries
const (
	deleteFeedbackQuery = `DELETE FROM feedback WHERE id = $1`
	updateFeedbackQuery = `UPDATE feedback SET status = $1 WHERE id = $2`
	insertFeedbackQuery = `INSERT INTO feedback (category, rating, message, user_id) VALUES ($1, $2, $3, $4)`

	listFeedbackBaseQuery        = `SELECT id, category, rating, message, status, created_at, user_id FROM feedback`
	listFeedbackNoFilterQuery    = listFeedbackBaseQuery + ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	listFeedbackWithStatusQuery  = listFeedbackBaseQuery + ` WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	listFeedbackWithQQuery       = listFeedbackBaseQuery + ` WHERE (category ILIKE $1 OR message ILIKE $1) ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	listFeedbackWithQStatusQuery = listFeedbackBaseQuery + ` WHERE (category ILIKE $1 OR message ILIKE $1) AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4`
)

// Suggestions Queries
const (
	deleteSuggestionQuery = `DELETE FROM suggestions WHERE id = $1`
	updateSuggestionQuery = `UPDATE suggestions SET status = $1 WHERE id = $2`
	insertSuggestionQuery = `INSERT INTO suggestions (category, description, user_id) VALUES ($1, $2, $3)`

	listSuggestionsBaseQuery        = `SELECT id, category, description, status, created_at, user_id FROM suggestions`
	listSuggestionsNoFilterQuery    = listSuggestionsBaseQuery + ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	listSuggestionsWithStatusQuery  = listSuggestionsBaseQuery + ` WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	listSuggestionsWithQQuery       = listSuggestionsBaseQuery + ` WHERE (category ILIKE $1 OR description ILIKE $1) ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	listSuggestionsWithQStatusQuery = listSuggestionsBaseQuery + ` WHERE (category ILIKE $1 OR description ILIKE $1) AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4`
)

// Reports Queries
const (
	deleteReportQuery = `DELETE FROM reports WHERE id = $1`
	updateReportQuery = `UPDATE reports SET status = $1 WHERE id = $2`
	insertReportQuery = `INSERT INTO reports (course_name, link_url, description, user_id) VALUES ($1, $2, $3, $4)`

	listReportsBaseQuery        = `SELECT id, course_name, link_url, description, status, created_at, user_id FROM reports`
	listReportsNoFilterQuery    = listReportsBaseQuery + ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	listReportsWithStatusQuery  = listReportsBaseQuery + ` WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	listReportsWithQQuery       = listReportsBaseQuery + ` WHERE (course_name ILIKE $1 OR description ILIKE $1 OR link_url ILIKE $1) ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	listReportsWithQStatusQuery = listReportsBaseQuery + ` WHERE (course_name ILIKE $1 OR description ILIKE $1 OR link_url ILIKE $1) AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4`
)

// Contributions Queries
const (
	deleteContributionQuery = `DELETE FROM contributions WHERE id = $1`
	updateContributionQuery = `UPDATE contributions SET status = $1 WHERE id = $2`
	insertContributionQuery = `INSERT INTO contributions (course_name, link_url, note, user_id) VALUES ($1, $2, $3, $4)`

	listContributionsBaseQuery        = `SELECT id, course_name, link_url, note, status, created_at, user_id FROM contributions`
	listContributionsNoFilterQuery    = listContributionsBaseQuery + ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	listContributionsWithStatusQuery  = listContributionsBaseQuery + ` WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	listContributionsWithQQuery       = listContributionsBaseQuery + ` WHERE (course_name ILIKE $1 OR link_url ILIKE $1 OR note ILIKE $1 ) ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	listContributionsWithQStatusQuery = listContributionsBaseQuery + ` WHERE (course_name ILIKE $1 OR link_url ILIKE $1 OR note ILIKE $1) AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4`
)

// SEO Queries
const (
	getSEOCoursePlacementsQuery = `
		SELECT c.id, c.name, c.code, c.is_optional,
		       f.id, f.name || ' · ' || b.name || ' · ' || sp.name, y.name, s.name
		FROM courses c
		JOIN semesters s ON s.id = c.semester_id
		JOIN years y ON y.id = s.year_id
		JOIN branch_specialisations bs ON bs.id = y.branch_specialisation_id
		JOIN branches b ON b.id = bs.branch_id
		JOIN specialisations sp ON sp.id = bs.specialisation_id
		JOIN faculties f ON f.id = sp.faculty_id
		WHERE LOWER(TRIM(c.code)) = LOWER(TRIM($1))
		ORDER BY f.display_order, b.display_order, sp.display_order, y.display_order, s.display_order, c.display_order`

	listSEOLinksByCourseIDsQuery = `
		SELECT l.id, l.label, l.url, COALESCE(l.note, ''),
		       COALESCE(l.content_type, ''), COALESCE(l.type, '')
		FROM links l
		WHERE l.course_id IN (%s)
		ORDER BY l.display_order ASC`

	listSEOCourseCodesForSitemapQuery = `
		SELECT DISTINCT LOWER(TRIM(code))
		FROM courses
		WHERE code IS NOT NULL AND TRIM(code) <> ''
		ORDER BY 1`

	listSEOProgramsQuery = `SELECT id, name FROM faculties ORDER BY display_order ASC`

	listSEOCoursesIndexQuery = `
		SELECT DISTINCT ON (LOWER(TRIM(c.code)))
		       LOWER(TRIM(c.code)), c.name, f.name || ' · ' || b.name || ' · ' || sp.name
		FROM courses c
		JOIN semesters s ON s.id = c.semester_id
		JOIN years y ON y.id = s.year_id
		JOIN branch_specialisations bs ON bs.id = y.branch_specialisation_id
		JOIN branches b ON b.id = bs.branch_id
		JOIN specialisations sp ON sp.id = bs.specialisation_id
		JOIN faculties f ON f.id = sp.faculty_id
		WHERE c.code IS NOT NULL AND TRIM(c.code) <> ''
		ORDER BY LOWER(TRIM(c.code)), f.display_order, c.display_order`

	listSEOProgramCoursesQuery = `
		SELECT DISTINCT ON (LOWER(TRIM(c.code))) LOWER(TRIM(c.code)), c.name
		FROM courses c
		JOIN semesters s ON s.id = c.semester_id
		JOIN years y ON y.id = s.year_id
		JOIN branch_specialisations bs ON bs.id = y.branch_specialisation_id
		JOIN specialisations sp ON sp.id = bs.specialisation_id
		WHERE sp.faculty_id = $1 AND c.code IS NOT NULL AND TRIM(c.code) <> ''
		ORDER BY LOWER(TRIM(c.code)), c.display_order`
)

// Contents Queries — explicit json_build_object projections (no SELECT * row dumps).
const (
	facultyJSON       = `json_build_object('id', f.id, 'name', f.name, 'name_ar', f.name_ar, 'slug', f.slug, 'display_order', f.display_order)`
	branchJSON        = `json_build_object('id', b.id, 'name', b.name, 'name_ar', b.name_ar, 'slug', b.slug, 'display_order', b.display_order)`
	facultyBranchJSON = `json_build_object('faculty_id', fb.faculty_id, 'branch_id', fb.branch_id)`
	specJSON          = `json_build_object('id', sp.id, 'faculty_id', sp.faculty_id, 'name', sp.name, 'name_ar', sp.name_ar, 'slug', sp.slug, 'display_order', sp.display_order)`
	offeringJSON      = `json_build_object('id', bs.id, 'branch_id', bs.branch_id, 'specialisation_id', bs.specialisation_id, 'display_order', bs.display_order)`
	yearJSON          = `json_build_object('id', y.id, 'branch_specialisation_id', y.branch_specialisation_id, 'name', y.name, 'display_order', y.display_order)`
	semesterJSON      = `json_build_object('id', s.id, 'year_id', s.year_id, 'name', s.name, 'display_order', s.display_order)`
	courseJSON        = `json_build_object('id', c.id, 'name', c.name, 'code', c.code, 'is_optional', c.is_optional, 'semester_id', c.semester_id, 'display_order', c.display_order)`
	linkJSON          = `json_build_object('id', l.id, 'course_id', l.course_id, 'type', l.type, 'url', l.url, 'label', l.label, 'note', COALESCE(l.note, ''), 'content_type', l.content_type, 'display_order', l.display_order, 'languages', COALESCE(l.languages, '[]'::jsonb))`
	extraSectionJSON  = `json_build_object('id', ex.id, 'title', ex.title, 'icon', ex.icon, 'display_order', ex.display_order)`
	extraLinkJSON     = `json_build_object('id', el.id, 'section_id', el.section_id, 'type', el.type, 'url', el.url, 'label', el.label, 'note', COALESCE(el.note, ''), 'content_type', el.content_type, 'display_order', el.display_order)`

	getContentQuery = `
	WITH content AS (
		SELECT
			(SELECT COALESCE(json_agg(` + facultyJSON + ` ORDER BY f.display_order ASC), '[]') FROM faculties f) AS faculties,
			(SELECT COALESCE(json_agg(` + branchJSON + ` ORDER BY b.display_order ASC), '[]') FROM branches b) AS branches,
			(SELECT COALESCE(json_agg(` + facultyBranchJSON + `), '[]') FROM faculty_branches fb) AS faculty_branches,
			(SELECT COALESCE(json_agg(` + specJSON + ` ORDER BY sp.display_order ASC), '[]') FROM specialisations sp) AS specialisations,
			(SELECT COALESCE(json_agg(` + offeringJSON + ` ORDER BY bs.display_order ASC), '[]') FROM branch_specialisations bs) AS branch_specialisations,
			(SELECT COALESCE(json_agg(` + yearJSON + ` ORDER BY y.display_order ASC), '[]') FROM years y) AS years,
			(SELECT COALESCE(json_agg(` + semesterJSON + ` ORDER BY s.display_order ASC), '[]') FROM semesters s) AS semesters,
			(SELECT COALESCE(json_agg(` + courseJSON + ` ORDER BY c.display_order ASC), '[]') FROM courses c) AS courses,
			(SELECT COALESCE(json_agg(` + linkJSON + ` ORDER BY l.display_order ASC), '[]') FROM links l WHERE l.course_id IS NOT NULL) AS links,
			(SELECT COALESCE(json_agg(` + extraLinkJSON + ` ORDER BY el.display_order ASC), '[]') FROM extra_links el) AS extra_links,
			(SELECT COALESCE(json_agg(` + extraSectionJSON + ` ORDER BY ex.display_order ASC), '[]') FROM extra_sections ex) AS extra_sections
	)
	SELECT json_build_object(
		'faculties', faculties,
		'branches', branches,
		'faculty_branches', faculty_branches,
		'specialisations', specialisations,
		'branch_specialisations', branch_specialisations,
		'years', years,
		'semesters', semesters,
		'courses', courses,
		'links', links,
		'extra_links', extra_links,
		'extra_sections', extra_sections
	) FROM content;
    `

	// Hierarchy bootstrap: everything except courses/links (keeps first paint tiny).
	getHierarchyQuery = `
	WITH content AS (
		SELECT
			(SELECT COALESCE(json_agg(` + facultyJSON + ` ORDER BY f.display_order ASC), '[]') FROM faculties f) AS faculties,
			(SELECT COALESCE(json_agg(` + branchJSON + ` ORDER BY b.display_order ASC), '[]') FROM branches b) AS branches,
			(SELECT COALESCE(json_agg(` + facultyBranchJSON + `), '[]') FROM faculty_branches fb) AS faculty_branches,
			(SELECT COALESCE(json_agg(` + specJSON + ` ORDER BY sp.display_order ASC), '[]') FROM specialisations sp) AS specialisations,
			(SELECT COALESCE(json_agg(` + offeringJSON + ` ORDER BY bs.display_order ASC), '[]') FROM branch_specialisations bs) AS branch_specialisations,
			(SELECT COALESCE(json_agg(` + yearJSON + ` ORDER BY y.display_order ASC), '[]') FROM years y) AS years,
			(SELECT COALESCE(json_agg(` + semesterJSON + ` ORDER BY s.display_order ASC), '[]') FROM semesters s) AS semesters,
			(SELECT COALESCE(json_agg(` + extraLinkJSON + ` ORDER BY el.display_order ASC), '[]') FROM extra_links el) AS extra_links,
			(SELECT COALESCE(json_agg(` + extraSectionJSON + ` ORDER BY ex.display_order ASC), '[]') FROM extra_sections ex) AS extra_sections
	)
	SELECT json_build_object(
		'faculties', faculties,
		'branches', branches,
		'faculty_branches', faculty_branches,
		'specialisations', specialisations,
		'branch_specialisations', branch_specialisations,
		'years', years,
		'semesters', semesters,
		'courses', '[]'::json,
		'links', '[]'::json,
		'extra_links', extra_links,
		'extra_sections', extra_sections
	) FROM content;
    `

	getOfferingContentQuery = `
	SELECT json_build_object(
		'years', (
			SELECT COALESCE(json_agg(` + yearJSON + ` ORDER BY y.display_order ASC), '[]')
			FROM years y WHERE y.branch_specialisation_id = $1
		),
		'semesters', (
			SELECT COALESCE(json_agg(` + semesterJSON + ` ORDER BY s.display_order ASC), '[]')
			FROM semesters s
			JOIN years y ON y.id = s.year_id
			WHERE y.branch_specialisation_id = $1
		),
		'courses', (
			SELECT COALESCE(json_agg(` + courseJSON + ` ORDER BY c.display_order ASC), '[]')
			FROM courses c
			JOIN semesters s ON s.id = c.semester_id
			JOIN years y ON y.id = s.year_id
			WHERE y.branch_specialisation_id = $1
		),
		'links', (
			SELECT COALESCE(json_agg(` + linkJSON + ` ORDER BY l.display_order ASC), '[]')
			FROM links l
			JOIN courses c ON c.id = l.course_id
			JOIN semesters s ON s.id = c.semester_id
			JOIN years y ON y.id = s.year_id
			WHERE y.branch_specialisation_id = $1 AND l.course_id IS NOT NULL
		)
	);
    `

	searchContentQuery = `
	SELECT COALESCE(json_agg(course_row ORDER BY course_row->>'code'), '[]')
	FROM (
		SELECT json_build_object(
			'id', c.id,
			'name', c.name,
			'code', c.code,
			'is_optional', c.is_optional,
			'semester_id', c.semester_id,
			'display_order', c.display_order,
			'path', fac.name || ' · ' || br.name || ' · ' || sp.name || ' · ' || y.name || ' · ' || s.name,
			'links', (
				SELECT COALESCE(json_agg(` + linkJSON + ` ORDER BY l.display_order ASC), '[]')
				FROM links l WHERE l.course_id = c.id
			)
		) AS course_row
		FROM courses c
		JOIN semesters s ON s.id = c.semester_id
		JOIN years y ON y.id = s.year_id
		JOIN branch_specialisations bs ON bs.id = y.branch_specialisation_id
		JOIN branches br ON br.id = bs.branch_id
		JOIN specialisations sp ON sp.id = bs.specialisation_id
		JOIN faculties fac ON fac.id = sp.faculty_id
		WHERE ($1 = '') OR c.name ILIKE '%' || $1 || '%' OR c.code ILIKE '%' || $1 || '%'
		ORDER BY LOWER(TRIM(c.code)), c.display_order
		LIMIT $2
	) q;
    `

	getCoursesByIDsQuery = `
	SELECT COALESCE(json_agg(course_row ORDER BY course_row->>'code'), '[]')
	FROM (
		SELECT json_build_object(
			'id', c.id,
			'name', c.name,
			'code', c.code,
			'is_optional', c.is_optional,
			'semester_id', c.semester_id,
			'display_order', c.display_order,
			'path', fac.name || ' · ' || br.name || ' · ' || sp.name || ' · ' || y.name || ' · ' || s.name,
			'links', (
				SELECT COALESCE(json_agg(` + linkJSON + ` ORDER BY l.display_order ASC), '[]')
				FROM links l WHERE l.course_id = c.id
			)
		) AS course_row
		FROM courses c
		JOIN semesters s ON s.id = c.semester_id
		JOIN years y ON y.id = s.year_id
		JOIN branch_specialisations bs ON bs.id = y.branch_specialisation_id
		JOIN branches br ON br.id = bs.branch_id
		JOIN specialisations sp ON sp.id = bs.specialisation_id
		JOIN faculties fac ON fac.id = sp.faculty_id
		WHERE c.id = ANY($1::int[])
		ORDER BY LOWER(TRIM(c.code)), c.display_order
	) q;
    `
)
