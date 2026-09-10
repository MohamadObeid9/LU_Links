// UI locale strings. Codes match users.prefered_lang: eng | fr | ar.
// Link resource tags stay ar/fr/en — different namespace.

const STRINGS = {
  eng: {
    nav_home: "Home",
    nav_about: "About",
    nav_report: "Report / Contribute",
    nav_feedback: "Feedback / Suggestion",
    nav_admin: "Admin",
    hero_title: "LU Links",
    hero_sub: "All courses, materials & links — organized by faculty, campus & specialisation.",
    search_placeholder: "Search by course name or code…",
    filters_toggle: "🔎 Filters & Faculties",
    tab_all: "All",
    tab_search_all: "Search All",
    tab_faculties: "🏛 Faculties",
    tab_extra: "📦 Extra",
    tab_tips: "💡 Tips",
    tab_favorites: "⭐ My Courses",
    filter_year: "Year",
    filter_semester: "Semester",
    filter_all: "All",
    faculties_title: "🏛 Faculties",
    faculties_sub: "Browse by faculty, then pick a campus and specialisation.",
    faculties_empty: "No faculties yet — add them in Admin → Structure.",
    back_all_faculties: "← All faculties",
    back_campuses: "← {name} campuses",
    back_specialisations: "← Specialisations",
    campus_sub: "Which campus?",
    campuses_empty: "No campuses linked to this faculty yet.",
    spec_sub: "Pick a specialisation.",
    specs_empty: "No specialisations at this campus yet.",
    campus_one: "campus",
    campus_many: "campuses",
    spec_one: "specialisation",
    spec_many: "specialisations",
    year_courses_one: "year of courses",
    year_courses_many: "years of courses",
    courses_coming: "Courses coming soon",
    no_courses: "No courses found.",
    all_search_hint:
      "Search by course name or code to browse across all faculties. Or use Faculties to drill down.",
    search_all_title: "Search All",
    extra_resources: "Extra Resources",
    extra_empty: "No extra resources yet.",
    my_courses: "⭐ My Courses",
    tips_title: "💡 Tips",
    sign_out: "Sign out",
    sign_in: "Sign up / Sign in",
    footer_tagline: "Built by students, for students.",
    footer_about: "About",
    footer_telegram: "Telegram",
    footer_github: "GitHub",
    footer_linkedin: "LinkedIn",
    theme_system: "System theme",
    theme_light: "Light theme",
    theme_dark: "Dark theme",
    lang_label: "Language",
    welcome_hi: "Hi, {handle}",

    // Shared
    btn_cancel: "Cancel",
    btn_submitting: "Submitting…",
    copy_link: "Copy link",
    no_links_yet: "No links yet — contribute!",
    loading: "Loading…",
    searching: "Searching…",
    search_failed: "Search failed",
    optional_tag: "OPTIONAL",
    select_ellipsis: "Select…",
    link_fallback: "Link",

    // Labels / placeholders (report & contribute)
    label_faculty: "Faculty",
    label_campus: "Campus",
    label_spec: "Specialisation",
    label_year: "Year",
    label_semester: "Semester",
    label_course: "Course",
    label_link: "Link",
    label_link_url: "Link URL",
    label_link_type: "Link type",
    label_content_types: "Content type(s)",
    label_languages: "Language(s)",
    label_what_wrong: "What went wrong?",
    label_note_optional: "Note (optional)",
    ph_select_faculty: "Select faculty…",
    ph_select_campus: "Select campus…",
    ph_select_spec: "Select specialisation…",
    ph_select_year: "Select year…",
    ph_select_semester: "Select semester…",
    ph_select_course: "Select course…",
    ph_select_link: "Select a link…",
    ph_select_link_type: "Select link type…",
    ph_describe_issue: "Describe the issue…",
    ph_https: "https://…",
    ph_note_optional: "Note (optional)",
    ph_select_category: "Select a category...",
    link_type_telegram: "Telegram",
    link_type_drive: "Google Drive",
    link_type_classroom: "Google Classroom",
    link_type_other: "Other",
    ct_td: "TD",
    ct_cours: "Cours",
    ct_videos: "Videos",
    ct_sessions: "Sessions",
    ct_exams: "Exams",
    ct_other: "Other",

    // Report / Contribute
    report_title: "Report / Contribute",
    report_sub: "Help keep the hub accurate and growing.",
    report_card_title: "Report a broken link",
    contrib_card_title: "Contribute a new link",
    report_placeholder: "Pick faculty → campus → … → course to report a link.",
    contrib_placeholder: "Pick faculty → campus → … → course to add a link.",
    btn_submit_report: "Submit Report",
    btn_submit_contrib: "Submit Contribution",
    toast_report_incomplete: "Please pick faculty → campus → … → course and describe the issue.",
    toast_report_ok: "Report submitted! Thank you.",
    toast_submit_fail: "Failed to submit: {message}",
    toast_contrib_incomplete: "Please pick a course path and enter a link.",
    toast_bad_url: "Please enter a valid URL (https://… or http://…).",
    toast_contrib_ok: "Contribution submitted! Thank you.",

    // About
    about_title: "About LU Links",
    about_sub: "Built by students, for students — starting from zero.",
    about_problem_h: "The root problem",
    about_problem_p1:
      "Have you ever needed course materials — a Drive link, a Telegram group, an old exam — so you ask in a group chat… and everybody ghosts you? The biggest percentage is yes, you've been there. I faced the exact same challenge, and so have most students at the Lebanese University.",
    about_problem_punch: "From that exact problem, <strong>LU Links</strong> was born.",
    about_what_h: "What is LU Links",
    about_what_p1:
      "An initiative to gather all those useful links randomly scattered everywhere — Telegram groups, Google Drive folders, Classroom pages — and put them <strong>in one central place</strong>, easily reachable by all students.",
    about_what_p2:
      "We're starting from zero, with a clear goal: a single hub where any LU student can find what they need without begging in group chats.",
    about_built_h: "How it's built",
    about_built_p1:
      "A production-grade <strong>Go REST API</strong> backed by PostgreSQL — clean architecture, proper migrations, and a structured codebase designed to grow with the community.",
    about_built_p2:
      "The frontend is lightweight vanilla JS, no heavy frameworks, so pages load fast even on slow connections.",
    about_free_h: "Free, always",
    about_free_p:
      "If I was a broke student looking for course materials, I wouldn't pay. So this stays free. LU Links exists because of the community — and it will always belong to it.",
    about_help_h: "Help us build this from day one",
    about_help_p:
      "We're literally starting from scratch — and that means <strong>every single link you submit matters</strong>. You know that Drive folder your friend shared at 2 AM before the exam? That Telegram group that saved your semester? Submit it here and help the next student find it without the struggle.",
    about_li_submit:
      "<strong>Submit a link</strong> — use {{btn:nav_report:report-submit}} to add any course material you have. Even one link helps.",
    about_li_feedback:
      "<strong>Leave feedback</strong> — tell us what works and what doesn't via {{btn:nav_feedback:feedback-suggestion}}.",
    about_li_suggest:
      "<strong>Suggest improvements</strong> — got an idea? We're building this <em>for</em> you, so your input shapes what comes next.",
    about_li_code:
      "<strong>Contribute code</strong> — the project is open source; issues and PRs are welcome.",
    about_li_spread:
      "<strong>Spread the word</strong> — share with classmates so more people know this exists.",
    about_star_github: "⭐ Star on GitHub",
    about_telegram_channel: "📢 Telegram Channel",
    about_contribute_btn: "➕ Contribute a link",

    // Feedback / Suggestion
    feedback_title: "Feedback / Suggestion",
    feedback_sub: "Rate your experience or suggest an improvement.",
    feedback_card_title: "Share your feedback",
    suggestion_card_title: "Suggest an improvement",
    feedback_rate_label: "What would you like to rate?",
    suggestion_kind_label: "What kind of suggestion?",
    fb_cat_uiux: "UI/UX Design",
    fb_cat_content: "Content Quality",
    fb_cat_functionality: "Functionality",
    fb_cat_performance: "Performance",
    fb_cat_accessibility: "Accessibility",
    fb_cat_other: "Other",
    sug_cat_feature: "New feature",
    sug_cat_ux: "UX / usability",
    sug_cat_content: "Content",
    sug_cat_performance: "Performance",
    sug_cat_other: "Other",
    feedback_rating_placeholder: "Select a category to rate your experience.",
    feedback_rate_heading: "Rate Your Experience",
    feedback_rating_aria: "Rating",
    feedback_star_n: "{n} star",
    feedback_star_n_plural: "{n} stars",
    feedback_select_rating: "Select a rating",
    feedback_msg_placeholder_hint: "Select a rating to leave an optional note.",
    ph_feedback_optional: "Your feedback (optional)…",
    suggestion_desc_placeholder: "Select a category to describe your idea.",
    ph_suggestion_desc: "Describe your improvement…",
    btn_submit_feedback: "Submit Feedback",
    btn_submit_suggestion: "Submit Suggestion",
    toast_need_category: "Please select a category",
    toast_need_rating: "Please select a rating",
    toast_feedback_ok: "Thank you for your feedback!",
    toast_feedback_fail: "Failed to submit feedback",
    rating_out_of_5: "{n} out of 5 stars",
    toast_need_suggestion_desc: "Please describe your improvement",
    toast_suggestion_ok: "Thanks for the suggestion!",
    toast_suggestion_fail: "Failed to submit suggestion",

    // Mobile hub
    mobile_change: "Change",
    mobile_courses_one: "{n} course",
    mobile_courses_many: "{n} courses",
    mobile_search_empty: "No course matches that. Try a code like NFA035.",
    mobile_extra_label: "Extra resources",
    mobile_hub_hint: "Search if you know the code — or browse by faculty.",
    mobile_pick_faculties_sub: "Faculty → branch → specialisation",
    mobile_pick_extra_sub: "Outside the course tree",
    mobile_pick_favorites_sub: "Saved on this account",
    mobile_pick_tips_sub: "How to use LU Links and how you can help",
    no_semesters: "No semesters yet.",
    mobile_sem_empty: "No courses in this semester — try another, or search.",
    chip_tips: "Tips",
    chip_extra: "Extra resources",

    // Favorites empty states
    fav_signup_empty: "Sign up to save courses here — it takes a name and a number.",
    fav_empty_tap: "No favorites yet — tap ★ on a course to save it here.",
    fav_empty_click: "No favorites yet — click ★ on any course card to save it here.",
    fav_no_match: "No matching favorites found.",
    load_fav_fail: "Failed to load favorites",
    loading_courses: "Loading courses…",
    load_courses_fail: "Failed to load courses",
    fav_add: "Add to My Courses",
    fav_remove: "Remove from My Courses",
    fav_aria: "Favorite",
    toast_fav_save_fail: "Could not save your favorites.",
    toast_link_copied: "Link copied to clipboard! 📋",
    toast_copy_failed: "Copy failed — try manually.",

    // Tips
    tip_fav_title: "Favorites",
    tip_fav_body:
      "Mark the courses you use most with ★ to reach them more easily in the My Courses section.",
    tip_contrib_title: "Contributing",
    tip_contrib_body:
      "Want to help and contribute to LU Links? Visit our {{link}} to know more on how you can help us make LU Links better.",
    tip_contrib_link_label: "Telegram guide",
    tip_types_title: "Link types",
    tip_legend_other: "Other Type",
    tip_legend_optional: "Optional course",

    // Auth
    auth_signup_title: "🎓 Create your student profile",
    auth_signin_title: "👋 Welcome back",
    auth_mode_aria: "Account mode",
    auth_tab_signup: "Sign up",
    auth_tab_signin: "Sign in",
    auth_signup_hint:
      "No email, no password — your first name, last name and a number between 1 and 100 are your login. Use the same name + number on your phone and laptop — no need for separate accounts.",
    auth_signin_hint:
      "Enter the name and number you signed up with. The same login works on phone and laptop.",
    auth_label_first: "First name",
    auth_label_last: "Last name",
    auth_label_number: "Your number (1–100)",
    auth_ph_first: "e.g. ziad",
    auth_ph_last: "e.g. baroudi",
    auth_ph_number: "e.g. 33",
    auth_btn_create: "Create profile",
    auth_btn_signin: "Sign in",
    auth_err_names: "Please enter both your first and last name.",
    auth_err_number: "Pick a whole number between 1 and 100.",
    auth_loading_create: "Creating…",
    auth_loading_signin: "Signing in…",
    toast_profile_created: "Profile created — welcome, {handle}!",
    toast_signed_in: "Signed in as {handle}",
    auth_fallback_student: "student",
    auth_err_taken:
      "{first} {last} {number} is already taken — that name + number pair must be unique. Try another number, e.g. {suggestion}.",
    auth_err_not_found:
      "No student with that name and number yet. Sign up instead — your details are already filled in.",
    auth_err_check: "Please check your details and try again.",
    auth_err_generic: "Something went wrong. Please try again.",
    toast_signed_out: "Signed out.",
    guest_banner: "Browsing as a guest — sign up to open links, report issues and save courses.",

    // Open link modal
    modal_open_link_title: "🔗 Open External Link",
    modal_open_link_body: "You're leaving LU Links to visit:",
    btn_open_link: "Open Link ↗",
    toast_invalid_url: "Invalid link URL.",
    toast_unsafe_url: "Blocked unsafe URL scheme.",

    // Admin gate (student-facing entry only)
    admin_login_title: "Admin Login",
    admin_login_sub: "Enter your credentials to access the dashboard.",
    ph_admin_email: "Email",
    ph_admin_password: "Password",
    btn_login: "Login",
  },
  fr: {
    nav_home: "Accueil",
    nav_about: "À propos",
    nav_report: "Signaler / Contribuer",
    nav_feedback: "Avis / Suggestion",
    nav_admin: "Admin",
    hero_title: "LU Links",
    hero_sub: "Tous les cours, supports et liens — par faculté, campus et spécialisation.",
    search_placeholder: "Rechercher par nom ou code de cours…",
    filters_toggle: "🔎 Filtres & Facultés",
    tab_all: "Tout",
    tab_search_all: "Rechercher tout",
    tab_faculties: "🏛 Facultés",
    tab_extra: "📦 Extra",
    tab_tips: "💡 Astuces",
    tab_favorites: "⭐ Mes cours",
    filter_year: "Année",
    filter_semester: "Semestre",
    filter_all: "Tout",
    faculties_title: "🏛 Facultés",
    faculties_sub: "Choisissez une faculté, puis un campus et une spécialisation.",
    faculties_empty: "Aucune faculté — ajoutez-les dans Admin → Structure.",
    back_all_faculties: "← Toutes les facultés",
    back_campuses: "← Campus de {name}",
    back_specialisations: "← Spécialisations",
    campus_sub: "Quel campus ?",
    campuses_empty: "Aucun campus lié à cette faculté.",
    spec_sub: "Choisissez une spécialisation.",
    specs_empty: "Aucune spécialisation sur ce campus.",
    campus_one: "campus",
    campus_many: "campus",
    spec_one: "spécialisation",
    spec_many: "spécialisations",
    year_courses_one: "année de cours",
    year_courses_many: "années de cours",
    courses_coming: "Cours bientôt disponibles",
    no_courses: "Aucun cours trouvé.",
    all_search_hint:
      "Recherchez par nom ou code de cours pour parcourir toutes les facultés. Ou utilisez Facultés pour naviguer.",
    search_all_title: "Rechercher tout",
    extra_resources: "Ressources Extra",
    extra_empty: "Aucune ressource extra pour le moment.",
    my_courses: "⭐ Mes cours",
    tips_title: "💡 Astuces",
    sign_out: "Se déconnecter",
    sign_in: "S'inscrire / Se connecter",
    footer_tagline: "Fait par des étudiants, pour des étudiants.",
    footer_about: "À propos",
    footer_telegram: "Telegram",
    footer_github: "GitHub",
    footer_linkedin: "LinkedIn",
    theme_system: "Thème système",
    theme_light: "Thème clair",
    theme_dark: "Thème sombre",
    lang_label: "Langue",
    welcome_hi: "Bonjour, {handle}",

    btn_cancel: "Annuler",
    btn_submitting: "Envoi…",
    copy_link: "Copier le lien",
    no_links_yet: "Pas encore de liens — contribuez !",
    loading: "Chargement…",
    searching: "Recherche…",
    search_failed: "Échec de la recherche",
    optional_tag: "OPTIONNEL",
    select_ellipsis: "Choisir…",
    link_fallback: "Lien",

    label_faculty: "Faculté",
    label_campus: "Campus",
    label_spec: "Spécialisation",
    label_year: "Année",
    label_semester: "Semestre",
    label_course: "Cours",
    label_link: "Lien",
    label_link_url: "URL du lien",
    label_link_type: "Type de lien",
    label_content_types: "Type(s) de contenu",
    label_languages: "Langue(s)",
    label_what_wrong: "Quel est le problème ?",
    label_note_optional: "Note (optionnel)",
    ph_select_faculty: "Choisir une faculté…",
    ph_select_campus: "Choisir un campus…",
    ph_select_spec: "Choisir une spécialisation…",
    ph_select_year: "Choisir une année…",
    ph_select_semester: "Choisir un semestre…",
    ph_select_course: "Choisir un cours…",
    ph_select_link: "Choisir un lien…",
    ph_select_link_type: "Choisir un type de lien…",
    ph_describe_issue: "Décrivez le problème…",
    ph_https: "https://…",
    ph_note_optional: "Note (optionnel)",
    ph_select_category: "Choisir une catégorie…",
    link_type_telegram: "Telegram",
    link_type_drive: "Google Drive",
    link_type_classroom: "Google Classroom",
    link_type_other: "Autre",
    ct_td: "TD",
    ct_cours: "Cours",
    ct_videos: "Vidéos",
    ct_sessions: "Séances",
    ct_exams: "Examens",
    ct_other: "Autre",

    report_title: "Signaler / Contribuer",
    report_sub: "Aidez à garder le hub exact et à le faire grandir.",
    report_card_title: "Signaler un lien cassé",
    contrib_card_title: "Proposer un nouveau lien",
    report_placeholder: "Choisissez faculté → campus → … → cours pour signaler un lien.",
    contrib_placeholder: "Choisissez faculté → campus → … → cours pour ajouter un lien.",
    btn_submit_report: "Envoyer le signalement",
    btn_submit_contrib: "Envoyer la contribution",
    toast_report_incomplete:
      "Veuillez choisir faculté → campus → … → cours et décrire le problème.",
    toast_report_ok: "Signalement envoyé ! Merci.",
    toast_submit_fail: "Échec de l'envoi : {message}",
    toast_contrib_incomplete: "Veuillez choisir un parcours de cours et saisir un lien.",
    toast_bad_url: "Veuillez entrer une URL valide (https://… ou http://…).",
    toast_contrib_ok: "Contribution envoyée ! Merci.",

    about_title: "À propos de LU Links",
    about_sub: "Fait par des étudiants, pour des étudiants — on part de zéro.",
    about_problem_h: "Le problème de fond",
    about_problem_p1:
      "Avez-vous déjà eu besoin de supports de cours — un lien Drive, un groupe Telegram, un ancien examen — alors vous demandez dans un groupe… et tout le monde vous ignore ? La grande majorité répond oui, vous y êtes déjà passé. J'ai vécu le même défi, comme la plupart des étudiants de l'Université Libanaise.",
    about_problem_punch: "C'est exactement de ce problème que <strong>LU Links</strong> est né.",
    about_what_h: "Qu'est-ce que LU Links",
    about_what_p1:
      "Une initiative pour rassembler tous ces liens utiles éparpillés partout — groupes Telegram, dossiers Google Drive, pages Classroom — et les mettre <strong>au même endroit</strong>, facilement accessible à tous les étudiants.",
    about_what_p2:
      "On part de zéro, avec un objectif clair : un hub unique où chaque étudiant de l'UL trouve ce dont il a besoin sans mendier dans les groupes.",
    about_built_h: "Comment c'est construit",
    about_built_p1:
      "Une <strong>API REST en Go</strong> de niveau production, avec PostgreSQL — architecture claire, migrations propres, et une base de code structurée pour grandir avec la communauté.",
    about_built_p2:
      "Le frontend est en JavaScript vanilla, sans frameworks lourds, pour rester rapide même sur une connexion lente.",
    about_free_h: "Gratuit, toujours",
    about_free_p:
      "Si j'étais un étudiant fauché à la recherche de supports, je ne paierais pas. Donc ça reste gratuit. LU Links existe grâce à la communauté — et lui appartiendra toujours.",
    about_help_h: "Aidez-nous dès le premier jour",
    about_help_p:
      "On part vraiment de zéro — et ça veut dire que <strong>chaque lien que vous envoyez compte</strong>. Vous connaissez ce dossier Drive partagé à 2 h du matin avant l'exam ? Ce groupe Telegram qui a sauvé votre semestre ? Ajoutez-le ici et aidez le prochain étudiant.",
    about_li_submit:
      "<strong>Proposer un lien</strong> — utilisez {{btn:nav_report:report-submit}} pour ajouter n'importe quel support. Même un seul lien aide.",
    about_li_feedback:
      "<strong>Laisser un avis</strong> — dites-nous ce qui marche et ce qui ne marche pas via {{btn:nav_feedback:feedback-suggestion}}.",
    about_li_suggest:
      "<strong>Suggérer des améliorations</strong> — une idée ? On construit ça <em>pour</em> vous, vos retours orientent la suite.",
    about_li_code:
      "<strong>Contribuer au code</strong> — le projet est open source ; issues et PR sont les bienvenues.",
    about_li_spread:
      "<strong>En parler autour de vous</strong> — partagez avec vos camarades pour que plus de monde sache que ça existe.",
    about_star_github: "⭐ Étoile sur GitHub",
    about_telegram_channel: "📢 Chaîne Telegram",
    about_contribute_btn: "➕ Proposer un lien",

    feedback_title: "Avis / Suggestion",
    feedback_sub: "Notez votre expérience ou proposez une amélioration.",
    feedback_card_title: "Partagez votre avis",
    suggestion_card_title: "Suggérer une amélioration",
    feedback_rate_label: "Que souhaitez-vous noter ?",
    suggestion_kind_label: "Quel type de suggestion ?",
    fb_cat_uiux: "Design UI/UX",
    fb_cat_content: "Qualité du contenu",
    fb_cat_functionality: "Fonctionnalités",
    fb_cat_performance: "Performance",
    fb_cat_accessibility: "Accessibilité",
    fb_cat_other: "Autre",
    sug_cat_feature: "Nouvelle fonctionnalité",
    sug_cat_ux: "UX / utilisabilité",
    sug_cat_content: "Contenu",
    sug_cat_performance: "Performance",
    sug_cat_other: "Autre",
    feedback_rating_placeholder: "Choisissez une catégorie pour noter votre expérience.",
    feedback_rate_heading: "Notez votre expérience",
    feedback_rating_aria: "Note",
    feedback_star_n: "{n} étoile",
    feedback_star_n_plural: "{n} étoiles",
    feedback_select_rating: "Choisissez une note",
    feedback_msg_placeholder_hint: "Choisissez une note pour laisser une note optionnelle.",
    ph_feedback_optional: "Votre avis (optionnel)…",
    suggestion_desc_placeholder: "Choisissez une catégorie pour décrire votre idée.",
    ph_suggestion_desc: "Décrivez votre amélioration…",
    btn_submit_feedback: "Envoyer l'avis",
    btn_submit_suggestion: "Envoyer la suggestion",
    toast_need_category: "Veuillez choisir une catégorie",
    toast_need_rating: "Veuillez choisir une note",
    toast_feedback_ok: "Merci pour votre avis !",
    toast_feedback_fail: "Échec de l'envoi de l'avis",
    rating_out_of_5: "{n} sur 5 étoiles",
    toast_need_suggestion_desc: "Veuillez décrire votre amélioration",
    toast_suggestion_ok: "Merci pour la suggestion !",
    toast_suggestion_fail: "Échec de l'envoi de la suggestion",

    mobile_change: "Changer",
    mobile_courses_one: "{n} cours",
    mobile_courses_many: "{n} cours",
    mobile_search_empty: "Aucun cours ne correspond. Essayez un code comme NFA035.",
    mobile_extra_label: "Ressources extra",
    mobile_hub_hint: "Cherchez si vous connaissez le code — ou parcourez par faculté.",
    mobile_pick_faculties_sub: "Faculté → campus → spécialisation",
    mobile_pick_extra_sub: "Hors de l'arbre des cours",
    mobile_pick_favorites_sub: "Enregistrés sur ce compte",
    mobile_pick_tips_sub: "Comment utiliser LU Links et comment aider",
    no_semesters: "Pas encore de semestres.",
    mobile_sem_empty: "Aucun cours dans ce semestre — essayez un autre, ou cherchez.",
    chip_tips: "Astuces",
    chip_extra: "Ressources extra",

    fav_signup_empty: "Inscrivez-vous pour enregistrer des cours ici — un prénom et un numéro suffisent.",
    fav_empty_tap: "Pas encore de favoris — touchez ★ sur un cours pour l'enregistrer.",
    fav_empty_click: "Pas encore de favoris — cliquez ★ sur une carte de cours pour l'enregistrer.",
    fav_no_match: "Aucun favori ne correspond.",
    load_fav_fail: "Échec du chargement des favoris",
    loading_courses: "Chargement des cours…",
    load_courses_fail: "Échec du chargement des cours",
    fav_add: "Ajouter à Mes cours",
    fav_remove: "Retirer de Mes cours",
    fav_aria: "Favori",
    toast_fav_save_fail: "Impossible d'enregistrer vos favoris.",
    toast_link_copied: "Lien copié dans le presse-papiers ! 📋",
    toast_copy_failed: "Échec de la copie — essayez manuellement.",

    tip_fav_title: "Favoris",
    tip_fav_body:
      "Marquez les cours que vous utilisez le plus avec ★ pour les retrouver plus facilement dans Mes cours.",
    tip_contrib_title: "Contribuer",
    tip_contrib_body:
      "Envie d'aider et de contribuer à LU Links ? Consultez notre {{link}} pour savoir comment nous aider à améliorer LU Links.",
    tip_contrib_link_label: "guide Telegram",
    tip_types_title: "Types de liens",
    tip_legend_other: "Autre type",
    tip_legend_optional: "Cours optionnel",

    auth_signup_title: "🎓 Créez votre profil étudiant",
    auth_signin_title: "👋 Bon retour",
    auth_mode_aria: "Mode de compte",
    auth_tab_signup: "S'inscrire",
    auth_tab_signin: "Se connecter",
    auth_signup_hint:
      "Pas d'e-mail, pas de mot de passe — votre prénom, nom et un numéro entre 1 et 100 sont votre identifiant. Utilisez le même nom + numéro sur téléphone et ordinateur — pas besoin de comptes séparés.",
    auth_signin_hint:
      "Entrez le nom et le numéro avec lesquels vous vous êtes inscrit. Le même login fonctionne sur téléphone et ordinateur.",
    auth_label_first: "Prénom",
    auth_label_last: "Nom",
    auth_label_number: "Votre numéro (1–100)",
    auth_ph_first: "ex. ziad",
    auth_ph_last: "ex. baroudi",
    auth_ph_number: "ex. 33",
    auth_btn_create: "Créer le profil",
    auth_btn_signin: "Se connecter",
    auth_err_names: "Veuillez entrer votre prénom et votre nom.",
    auth_err_number: "Choisissez un nombre entier entre 1 et 100.",
    auth_loading_create: "Création…",
    auth_loading_signin: "Connexion…",
    toast_profile_created: "Profil créé — bienvenue, {handle} !",
    toast_signed_in: "Connecté en tant que {handle}",
    auth_fallback_student: "étudiant",
    auth_err_taken:
      "{first} {last} {number} est déjà pris — ce couple nom + numéro doit être unique. Essayez un autre numéro, ex. {suggestion}.",
    auth_err_not_found:
      "Aucun étudiant avec ce nom et ce numéro. Inscrivez-vous plutôt — vos infos sont déjà remplies.",
    auth_err_check: "Vérifiez vos informations et réessayez.",
    auth_err_generic: "Une erreur s'est produite. Réessayez.",
    toast_signed_out: "Déconnecté.",
    guest_banner:
      "Navigation en invité — inscrivez-vous pour ouvrir les liens, signaler des problèmes et enregistrer des cours.",

    modal_open_link_title: "🔗 Ouvrir un lien externe",
    modal_open_link_body: "Vous quittez LU Links pour visiter :",
    btn_open_link: "Ouvrir le lien ↗",
    toast_invalid_url: "URL de lien invalide.",
    toast_unsafe_url: "Schéma d'URL non sécurisé bloqué.",

    admin_login_title: "Connexion admin",
    admin_login_sub: "Entrez vos identifiants pour accéder au tableau de bord.",
    ph_admin_email: "E-mail",
    ph_admin_password: "Mot de passe",
    btn_login: "Connexion",
  },
  ar: {
    nav_home: "الرئيسية",
    nav_about: "حول",
    nav_report: "إبلاغ / مساهمة",
    nav_feedback: "ملاحظات / اقتراح",
    nav_admin: "الإدارة",
    hero_title: "LU Links",
    hero_sub: "كل المواد والروابط — حسب الكلية والحرم والتخصص.",
    search_placeholder: "ابحث باسم المقرر أو الرمز…",
    filters_toggle: "🔎 الفلاتر والكليات",
    tab_all: "الكل",
    tab_search_all: "بحث الكل",
    tab_faculties: "🏛 الكليات",
    tab_extra: "📦 إضافي",
    tab_tips: "💡 نصائح",
    tab_favorites: "⭐ مقرراتي",
    filter_year: "السنة",
    filter_semester: "الفصل",
    filter_all: "الكل",
    faculties_title: "🏛 الكليات",
    faculties_sub: "اختر كلية، ثم حرماً وتخصصاً.",
    faculties_empty: "لا كليات بعد — أضفها من الإدارة ← البنية.",
    back_all_faculties: "→ كل الكليات",
    back_campuses: "→ فروع {name}",
    back_specialisations: "→ التخصصات",
    campus_sub: "أي حرم؟",
    campuses_empty: "لا فروع مرتبطة بهذه الكلية.",
    spec_sub: "اختر تخصصاً.",
    specs_empty: "لا تخصصات في هذا الحرم.",
    campus_one: "حرم",
    campus_many: "فروع",
    spec_one: "تخصص",
    spec_many: "تخصصات",
    year_courses_one: "سنة مقررات",
    year_courses_many: "سنوات مقررات",
    courses_coming: "المقررات قريباً",
    no_courses: "لا مقررات.",
    all_search_hint:
      "ابحث باسم المقرر أو الرمز لتصفح كل الكليات. أو استخدم الكليات للتنقل.",
    search_all_title: "بحث الكل",
    extra_resources: "موارد إضافية",
    extra_empty: "لا موارد إضافية بعد.",
    my_courses: "⭐ مقرراتي",
    tips_title: "💡 نصائح",
    sign_out: "تسجيل الخروج",
    sign_in: "إنشاء حساب / دخول",
    footer_tagline: "من الطلاب، إلى الطلاب.",
    footer_about: "حول",
    footer_telegram: "تيليغرام",
    footer_github: "GitHub",
    footer_linkedin: "LinkedIn",
    theme_system: "سمة النظام",
    theme_light: "سمة فاتحة",
    theme_dark: "سمة داكنة",
    lang_label: "اللغة",
    welcome_hi: "مرحباً، {handle}",

    btn_cancel: "إلغاء",
    btn_submitting: "جاري الإرسال…",
    copy_link: "نسخ الرابط",
    no_links_yet: "لا روابط بعد — ساهم!",
    loading: "جاري التحميل…",
    searching: "جاري البحث…",
    search_failed: "فشل البحث",
    optional_tag: "اختياري",
    select_ellipsis: "اختر…",
    link_fallback: "رابط",

    label_faculty: "الكلية",
    label_campus: "الحرم",
    label_spec: "التخصص",
    label_year: "السنة",
    label_semester: "الفصل",
    label_course: "المقرر",
    label_link: "الرابط",
    label_link_url: "رابط URL",
    label_link_type: "نوع الرابط",
    label_content_types: "نوع المحتوى",
    label_languages: "اللغة/اللغات",
    label_what_wrong: "ما المشكلة؟",
    label_note_optional: "ملاحظة (اختياري)",
    ph_select_faculty: "اختر كلية…",
    ph_select_campus: "اختر حرماً…",
    ph_select_spec: "اختر تخصصاً…",
    ph_select_year: "اختر سنة…",
    ph_select_semester: "اختر فصلاً…",
    ph_select_course: "اختر مقرراً…",
    ph_select_link: "اختر رابطاً…",
    ph_select_link_type: "اختر نوع الرابط…",
    ph_describe_issue: "صف المشكلة…",
    ph_https: "https://…",
    ph_note_optional: "ملاحظة (اختياري)",
    ph_select_category: "اختر فئة…",
    link_type_telegram: "تيليغرام",
    link_type_drive: "Google Drive",
    link_type_classroom: "Google Classroom",
    link_type_other: "أخرى",
    ct_td: "TD",
    ct_cours: "محاضرات",
    ct_videos: "فيديوهات",
    ct_sessions: "جلسات",
    ct_exams: "امتحانات",
    ct_other: "أخرى",

    report_title: "إبلاغ / مساهمة",
    report_sub: "ساعد في الحفاظ على دقة المنصة وتطويرها.",
    report_card_title: "الإبلاغ عن رابط معطل",
    contrib_card_title: "اقتراح رابط جديد",
    report_placeholder: "اختر كلية ← حرم ← … ← مقرر للإبلاغ عن رابط.",
    contrib_placeholder: "اختر كلية ← حرم ← … ← مقرر لإضافة رابط.",
    btn_submit_report: "إرسال البلاغ",
    btn_submit_contrib: "إرسال المساهمة",
    toast_report_incomplete: "يرجى اختيار كلية ← حرم ← … ← مقرر ووصف المشكلة.",
    toast_report_ok: "تم إرسال البلاغ! شكراً.",
    toast_submit_fail: "فشل الإرسال: {message}",
    toast_contrib_incomplete: "يرجى اختيار مسار المقرر وإدخال رابط.",
    toast_bad_url: "يرجى إدخال رابط صالح (https://… أو http://…).",
    toast_contrib_ok: "تم إرسال المساهمة! شكراً.",

    about_title: "حول LU Links",
    about_sub: "من الطلاب، إلى الطلاب — نبدأ من الصفر.",
    about_problem_h: "المشكلة الأساسية",
    about_problem_p1:
      "هل احتجت يوماً لمواد مقرر — رابط Drive أو مجموعة تيليغرام أو امتحان قديم — فسألت في مجموعة دردشة… وتجاهلك الجميع؟ النسبة الأكبر تقول نعم، مررت بذلك. واجهت التحدي نفسه، ومعظم طلاب الجامعة اللبنانية أيضاً.",
    about_problem_punch: "من هذه المشكلة بالذات وُلد <strong>LU Links</strong>.",
    about_what_h: "ما هو LU Links",
    about_what_p1:
      "مبادرة لجمع الروابط المفيدة المنتشرة عشوائياً — مجموعات تيليغرام ومجلدات Google Drive وصفحات Classroom — ووضعها في <strong>مكان واحد مركزي</strong>، يسهل على كل الطلاب الوصول إليه.",
    about_what_p2:
      "نبدأ من الصفر، بهدف واضح: منصة واحدة يجد فيها أي طالب في الجامعة اللبنانية ما يحتاجه دون التسول في المجموعات.",
    about_built_h: "كيف بُني",
    about_built_p1:
      "<strong>واجهة REST بـ Go</strong> بمستوى إنتاجي مع PostgreSQL — هندسة نظيفة وترحيلات منظمة وقاعدة كود قابلة للنمو مع المجتمع.",
    about_built_p2:
      "الواجهة الأمامية بـ JavaScript خفيف بدون أطر ثقيلة، لتعمل بسرعة حتى على اتصال بطيء.",
    about_free_h: "مجاني دائماً",
    about_free_p:
      "لو كنت طالباً مفلساً أبحث عن مواد، لما دفعت. لذلك يبقى مجانياً. LU Links موجود بفضل المجتمع — وسيبقى دائماً له.",
    about_help_h: "ساعدنا من اليوم الأول",
    about_help_p:
      "نبدأ حرفياً من الصفر — وهذا يعني أن <strong>كل رابط ترسله مهم</strong>. تعرف ذلك المجلد على Drive الذي شاركه صديقك الساعة 2 صباحاً قبل الامتحان؟ مجموعة التيليغرام التي أنقذت فصلك؟ أرسله هنا وساعد الطالب التالي.",
    about_li_submit:
      "<strong>أرسل رابطاً</strong> — استخدم {{btn:nav_report:report-submit}} لإضافة أي مادة لديك. حتى رابط واحد يساعد.",
    about_li_feedback:
      "<strong>اترك ملاحظات</strong> — أخبرنا بما يعمل وما لا يعمل عبر {{btn:nav_feedback:feedback-suggestion}}.",
    about_li_suggest:
      "<strong>اقترح تحسينات</strong> — لديك فكرة؟ نبني هذا <em>من أجلك</em>، ومساهمتك تشكّل ما يأتي لاحقاً.",
    about_li_code:
      "<strong>ساهم في الكود</strong> — المشروع مفتوح المصدر؛ القضايا وطلبات الدمج مرحب بها.",
    about_li_spread:
      "<strong>انشر الخبر</strong> — شارك مع زملائك حتى يعرف المزيد أن هذا موجود.",
    about_star_github: "⭐ نجّم على GitHub",
    about_telegram_channel: "📢 قناة تيليغرام",
    about_contribute_btn: "➕ ساهم برابط",

    feedback_title: "ملاحظات / اقتراح",
    feedback_sub: "قيّم تجربتك أو اقترح تحسيناً.",
    feedback_card_title: "شارك ملاحظاتك",
    suggestion_card_title: "اقترح تحسيناً",
    feedback_rate_label: "ماذا تريد أن تقيّم؟",
    suggestion_kind_label: "أي نوع من الاقتراح؟",
    fb_cat_uiux: "تصميم الواجهة",
    fb_cat_content: "جودة المحتوى",
    fb_cat_functionality: "الوظائف",
    fb_cat_performance: "الأداء",
    fb_cat_accessibility: "إمكانية الوصول",
    fb_cat_other: "أخرى",
    sug_cat_feature: "ميزة جديدة",
    sug_cat_ux: "تجربة الاستخدام",
    sug_cat_content: "المحتوى",
    sug_cat_performance: "الأداء",
    sug_cat_other: "أخرى",
    feedback_rating_placeholder: "اختر فئة لتقييم تجربتك.",
    feedback_rate_heading: "قيّم تجربتك",
    feedback_rating_aria: "التقييم",
    feedback_star_n: "نجمة واحدة ({n})",
    feedback_star_n_plural: "{n} نجوم",
    feedback_select_rating: "اختر تقييماً",
    feedback_msg_placeholder_hint: "اختر تقييماً لترك ملاحظة اختيارية.",
    ph_feedback_optional: "ملاحظاتك (اختياري)…",
    suggestion_desc_placeholder: "اختر فئة لوصف فكرتك.",
    ph_suggestion_desc: "صف تحسينك…",
    btn_submit_feedback: "إرسال الملاحظات",
    btn_submit_suggestion: "إرسال الاقتراح",
    toast_need_category: "يرجى اختيار فئة",
    toast_need_rating: "يرجى اختيار تقييم",
    toast_feedback_ok: "شكراً على ملاحظاتك!",
    toast_feedback_fail: "فشل إرسال الملاحظات",
    rating_out_of_5: "{n} من 5 نجوم",
    toast_need_suggestion_desc: "يرجى وصف تحسينك",
    toast_suggestion_ok: "شكراً على الاقتراح!",
    toast_suggestion_fail: "فشل إرسال الاقتراح",

    mobile_change: "تغيير",
    mobile_courses_one: "مقرر واحد ({n})",
    mobile_courses_many: "{n} مقررات",
    mobile_search_empty: "لا مقررات مطابقة. جرّب رمزاً مثل NFA035.",
    mobile_extra_label: "موارد إضافية",
    mobile_hub_hint: "ابحث إن كنت تعرف الرمز — أو تصفّح حسب الكلية.",
    mobile_pick_faculties_sub: "كلية ← حرم ← تخصص",
    mobile_pick_extra_sub: "خارج شجرة المقررات",
    mobile_pick_favorites_sub: "محفوظة على هذا الحساب",
    mobile_pick_tips_sub: "كيف تستخدم LU Links وكيف تساعد",
    no_semesters: "لا فصول بعد.",
    mobile_sem_empty: "لا مقررات في هذا الفصل — جرّب آخر أو ابحث.",
    chip_tips: "نصائح",
    chip_extra: "موارد إضافية",

    fav_signup_empty: "سجّل حساباً لحفظ المقررات هنا — يكفي اسم ورقم.",
    fav_empty_tap: "لا مفضلات بعد — اضغط ★ على مقرر لحفظه هنا.",
    fav_empty_click: "لا مفضلات بعد — انقر ★ على أي بطاقة مقرر لحفظه هنا.",
    fav_no_match: "لا مفضلات مطابقة.",
    load_fav_fail: "فشل تحميل المفضلات",
    loading_courses: "جاري تحميل المقررات…",
    load_courses_fail: "فشل تحميل المقررات",
    fav_add: "إضافة إلى مقرراتي",
    fav_remove: "إزالة من مقرراتي",
    fav_aria: "مفضل",
    toast_fav_save_fail: "تعذر حفظ مفضلاتك.",
    toast_link_copied: "تم نسخ الرابط! 📋",
    toast_copy_failed: "فشل النسخ — حاول يدوياً.",

    tip_fav_title: "المفضلات",
    tip_fav_body:
      "علّم المقررات التي تستخدمها أكثر بـ ★ لتصل إليها بسهولة من قسم مقرراتي.",
    tip_contrib_title: "المساهمة",
    tip_contrib_body:
      "هل تريد المساعدة والمساهمة في LU Links؟ زر {{link}} لمعرفة كيف تساعد في تحسين LU Links.",
    tip_contrib_link_label: "دليل تيليغرام",
    tip_types_title: "أنواع الروابط",
    tip_legend_other: "نوع آخر",
    tip_legend_optional: "مقرر اختياري",

    auth_signup_title: "🎓 أنشئ ملفك الطلابي",
    auth_signin_title: "👋 أهلاً بعودتك",
    auth_mode_aria: "وضع الحساب",
    auth_tab_signup: "إنشاء حساب",
    auth_tab_signin: "تسجيل الدخول",
    auth_signup_hint:
      "بلا بريد ولا كلمة مرور — اسمك الأول واسم العائلة ورقم بين 1 و100 هما بيانات دخولك. استخدم نفس الاسم والرقم على الهاتف والحاسوب — لا حاجة لحسابين.",
    auth_signin_hint:
      "أدخل الاسم والرقم اللذين سجّلت بهما. نفس الدخول يعمل على الهاتف والحاسوب.",
    auth_label_first: "الاسم الأول",
    auth_label_last: "اسم العائلة",
    auth_label_number: "رقمك (1–100)",
    auth_ph_first: "مثال: زياد",
    auth_ph_last: "مثال: بارودي",
    auth_ph_number: "مثال: 33",
    auth_btn_create: "إنشاء الملف",
    auth_btn_signin: "تسجيل الدخول",
    auth_err_names: "يرجى إدخال الاسم الأول واسم العائلة.",
    auth_err_number: "اختر عدداً صحيحاً بين 1 و100.",
    auth_loading_create: "جاري الإنشاء…",
    auth_loading_signin: "جاري الدخول…",
    toast_profile_created: "تم إنشاء الملف — أهلاً، {handle}!",
    toast_signed_in: "تم الدخول باسم {handle}",
    auth_fallback_student: "طالب",
    auth_err_taken:
      "{first} {last} {number} مستخدم مسبقاً — يجب أن يكون الاسم والرقم فريدين. جرّب رقماً آخر، مثل {suggestion}.",
    auth_err_not_found:
      "لا طالب بهذا الاسم والرقم بعد. سجّل حساباً بدلاً من ذلك — بياناتك مملوءة مسبقاً.",
    auth_err_check: "تحقق من بياناتك وحاول مجدداً.",
    auth_err_generic: "حدث خطأ. حاول مجدداً.",
    toast_signed_out: "تم تسجيل الخروج.",
    guest_banner:
      "تتصفح كزائر — سجّل حساباً لفتح الروابط والإبلاغ وحفظ المقررات.",

    modal_open_link_title: "🔗 فتح رابط خارجي",
    modal_open_link_body: "ستغادر LU Links لزيارة:",
    btn_open_link: "فتح الرابط ↗",
    toast_invalid_url: "رابط غير صالح.",
    toast_unsafe_url: "تم حظر مخطط رابط غير آمن.",

    admin_login_title: "دخول الإدارة",
    admin_login_sub: "أدخل بياناتك للوصول إلى لوحة التحكم.",
    ph_admin_email: "البريد",
    ph_admin_password: "كلمة المرور",
    btn_login: "دخول",
  },
};

let currentLang = "eng";

function normalizeLang(lang) {
  if (lang === "eng" || lang === "fr" || lang === "ar") return lang;
  return "eng";
}

function htmlLangAttr(lang) {
  return normalizeLang(lang) === "eng" ? "en" : normalizeLang(lang);
}

function t(key, vars = {}) {
  const table = STRINGS[currentLang] || STRINGS.eng;
  let s = table[key] ?? STRINGS.eng[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, String(v ?? ""));
  }
  return s;
}

function getLang() {
  return currentLang;
}

/** Prefer Arabic `name_ar` when UI lang is Arabic; otherwise English `name`. */
function localizedName(entity) {
  if (!entity) return "";
  if (currentLang === "ar") {
    const ar = String(entity.name_ar || "").trim();
    if (ar) return ar;
  }
  return String(entity.name || "");
}

function setLangState(lang) {
  currentLang = normalizeLang(lang);
}

function applyDocumentLang(lang) {
  const code = normalizeLang(lang);
  setLangState(code);
  document.documentElement.setAttribute("lang", htmlLangAttr(code));
  document.documentElement.setAttribute("dir", code === "ar" ? "rtl" : "ltr");
}

/** Expand {{btn:key:view}} markers inside trusted i18n HTML templates. */
function expandI18nHtml(template) {
  return String(template || "").replace(
    /\{\{btn:([a-z0-9_]+):([a-z0-9_-]+)\}\}/gi,
    (_, key, view) =>
      `<button type="button" class="about-inline-link" data-view="${view}">${escapeHtml(t(key))}</button>`,
  );
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (!key) return;
    el.innerHTML = expandI18nHtml(t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key) return;
    el.setAttribute("placeholder", t(key));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (!key) return;
    el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (!key) return;
    el.setAttribute("aria-label", t(key));
  });
}

window.t = t;
window.getLang = getLang;
window.localizedName = localizedName;
window.applyStaticI18n = applyStaticI18n;

export {
  STRINGS,
  t,
  getLang,
  localizedName,
  setLangState,
  applyDocumentLang,
  applyStaticI18n,
  normalizeLang,
  htmlLangAttr,
  expandI18nHtml,
};
