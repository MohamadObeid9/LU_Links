# ADR 011: Lebanese University academic hierarchy

## Status

Accepted

## Context

The product is **LU Links**. The prior schema used `program → year → semester → course`, with shared course links via placements (ADR 009). Lebanese University is larger: faculties are taught at multiple branches (campuses), specialisations belong to a faculty, and the same specialisation at different branches must not share resources.

## Decision

1. Replace `programs` with `faculties`, `branches`, `faculty_branches`, `specialisations`, and `branch_specialisations`.
2. `branch_specialisations` is the resource root. Years hang under an offering; courses hang under a semester (`semester_id` restored). Course codes may repeat across offerings.
3. Drop `course_placements`. Links stay on `courses` and gain `languages` (`ar` / `fr` / `en`, multi-value).
4. Student UI opens a **Faculties** section instead of listing every faculty as a top tab: Faculty → Branch → Specialisation → year/semester filters.
5. Admin **Structure** tab CRUD-creates the hierarchy; courses/links stay on the existing Courses tab filtered by offering.

## Consequences

- Older program-tree backups are not compatible; seed expects the LU hierarchy shape (`faculties`, offerings, …).
- SEO “program” pages now resolve against faculties.
- Favorites remain course-id based within a single offering’s course row.
