# Architecture

Back to [OVERVIEW](OVERVIEW.md).

## Stack

| Layer | Choice |
|---|---|
| Build tool | Vite |
| UI | React (JavaScript) |
| Styling | Tailwind CSS v4 with design tokens ([DESIGN](DESIGN.md)) |
| Routing | `react-router-dom` |
| Icons | `lucide-react` |
| Backend | Supabase: Postgres, Auth, Storage, Realtime, Edge Functions |
| State | React state and context only. No state library |

Any package beyond this list needs approval first.

## Project structure

```
src/
  pages/        one file per page
  components/   reusable pieces
  services/     all database calls, one file per feature
  hooks/        shared hooks
  context/      auth, theme, toast
  lib/          supabase client only
  routes.jsx    the single route list
supabase/
  schema.sql    tables, enums, policies
  seed.sql      realistic sample data
docs/
```

### Rules
- Pages and components never call Supabase directly. They call `services/`.
- Every service call handles errors and returns a plain-language message.
- Each page loads its data in one place, with loading and empty states.
- After create, edit or delete, the list refreshes by itself.

## Shared components

Button, IconButton, Tooltip, Modal, ConfirmDialog, Toast, EmptyState, Spinner or skeleton, FormField, Select, Badge (status), Avatar, Tabs, Table or list row, Pagination, FileUpload, PageHeader, Sidebar, Topbar, KanbanBoard and KanbanCard.

Reuse before creating new ones.

## Context providers

| Context | Holds |
|---|---|
| Auth | Session, profile, platform role, current organization, organization role |
| Theme | Light only |
| Toast | Short success and failure messages |

The current organization is chosen at login. If a user belongs to several organizations, a switcher is shown.

## Routes

One file. Three groups.

### Public
| Path | Page |
|---|---|
| `/` | Landing page with featured jobs |
| `/jobs` | Job search and filters |
| `/jobs/:slug` | Job details and Apply |
| `/companies/:slug` | Organization public profile |
| `/login`, `/signup` | Authentication |
| `/invite/:token` | Accept a team invitation |

### Job Seeker (login required)
| Path | Page |
|---|---|
| `/seeker` | Dashboard |
| `/seeker/profile` | Profile, experience, education, skills |
| `/seeker/resumes` | Resume library |
| `/seeker/applications` | My applications and status |
| `/seeker/saved` | Saved jobs |
| `/seeker/interviews` | Upcoming interviews |
| `/notifications` | Notifications |

### Organization (login and membership required)
| Path | Page | Who |
|---|---|---|
| `/org` | Dashboard | All members |
| `/org/jobs` | Job list | All members |
| `/org/jobs/new`, `/org/jobs/:id/edit` | Job form (more than 10 fields, so a page) | Recruiter and up |
| `/org/jobs/:id/pipeline` | Kanban for one job | All members |
| `/org/applications/:id` | Candidate and application detail | All members |
| `/org/interviews` | Interview calendar and list | All members |
| `/org/team` | Members and invitations | Org Admin, HR Manager |
| `/org/settings` | Organization profile and documents | Org Admin |
| `/org/analytics` | Recruitment analytics | Org Admin, HR Manager |
| `/org/activity` | Activity log | Org Admin |

### Super Admin
| Path | Page |
|---|---|
| `/admin` | Dashboard |
| `/admin/organizations` | List and verification queue |
| `/admin/organizations/:id` | Review one organization |
| `/admin/users` | All users |
| `/admin/analytics` | Platform analytics |
| `/admin/activity` | Platform activity log |

### Route protection
- No session: send to `/login`.
- Wrong role: send to the user's own dashboard with a toast.
- Organization not verified: org pages work, but publishing a job is blocked with a clear message.
- Suspended user or organization: sign-in shows a plain message and blocks access.

## Multi-tenancy model

- Tenant = organization.
- Every org-owned table has `organization_id`. Child tables copy it from the parent so policies stay simple and fast.
- Access is decided in the database by RLS, never only in the UI. See [SECURITY](SECURITY.md).
- Job seekers are not tenants. They own their own rows.
- Published jobs and verified organization profiles are readable by anyone, including visitors who are not logged in.

## Key flows

### Sign-up
1. Auth creates the user.
2. A database trigger creates the matching `profiles` row.
3. Job seekers go to profile setup. Organization owners go to organization setup.

### Organization setup
1. One server-side action creates the organization and the owner's Org Admin membership together. This avoids a half-created account.
2. Status starts as Pending.

### Invitation
1. Admin enters email and role. An invitation row with a hashed token is created.
2. Email sends a link to `/invite/:token`.
3. The invited person signs in or signs up. A server-side action checks the token, expiry and email match, then creates the membership.

### Apply
1. Candidate picks a resume and clicks Apply.
2. A server-side action checks: job is published and open, no existing application, resume belongs to the user.
3. It creates the application, the first history entry, and notifies the organization's recruiters.

### Move through the pipeline
1. Recruiter drags a card or uses a menu.
2. A server-side action updates the status, writes a history row, writes an activity log row, and notifies the candidate.

### Notifications
- In-app: rows in `notifications`, delivered live with Supabase Realtime.
- Email: an event adds a row to `email_outbox`. An Edge Function sends it and records the result. Failures retry a limited number of times.

## Server-side actions

Logic that must be atomic or must bypass a user's normal access runs in the database or in Edge Functions. The frontend only calls them through `services/`.

| Action | Where | Purpose |
|---|---|---|
| Create organization | Database function | Org plus owner membership together |
| Accept invitation | Database function | Validate token, create membership |
| Apply to job | Database function | Enforce rules, create application and history |
| Change application status | Database function | Update, history, activity, notification |
| Verify organization | Database function (Super Admin only) | Set status, notify |
| Send email | Edge Function | Call the email provider |
| Analytics | Database views or functions | Counts per org and platform |

The service role key never goes into the frontend.

## Files and storage

| Bucket | Public | Contents | Path pattern |
|---|---|---|---|
| `avatars` | Yes | Profile pictures | `{user_id}/{file}` |
| `org-assets` | Yes | Logos and covers | `{organization_id}/{file}` |
| `resumes` | No | Candidate resumes | `{user_id}/{file}` |
| `verification-docs` | No | Organization documents | `{organization_id}/{file}` |

Limits: resumes PDF, DOC, DOCX up to 5 MB. Images JPG, PNG, WebP up to 2 MB. Private files open through short-lived signed links. Storage policies mirror the table rules in [SECURITY](SECURITY.md).

## Search and filters

Public jobs support:
- Keyword in title, organization and description (Postgres full-text search with an index).
- Filters: category, location, work mode (onsite, hybrid, remote), employment type, experience level, salary range, posted date, organization.
- Sort: newest, closing soon, salary.
- Paged results.

## Theming

- All colors, sizes, radius and shadows are tokens defined once ([DESIGN](DESIGN.md)).
- One set of color tokens (light only). Components never use raw colors.
- Choice is saved in the profile and also in local storage so the first paint is correct.

## Performance

- Split code by route group (public, seeker, org, admin).
- Page results instead of loading everything.
- Index every column used in a filter, join or policy.
- Keep policy helper checks cheap and cached per request.
- Lazy load images. Compress uploads where possible.

## Packages that need approval before use

| Need | Reason |
|---|---|
| Drag and drop | Kanban moves |
| Charts | Analytics |
| Date helper | Interview times and time zones |
| Form helper | Only if plain React state becomes too heavy |

## Environments

| Item | Rule |
|---|---|
| Keys | `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never committed. `.env.example` is provided |
| Database | One Supabase project for development. A separate one for production |
| Deploy | Static host for the frontend. Edge Functions and database deployed through Supabase |
