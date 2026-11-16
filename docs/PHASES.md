# Build Phases

Back to [OVERVIEW](OVERVIEW.md). Daily task ticking stays in [TASKS](TASKS.md).

Each phase ends with something that runs and can be shown. The app must never be left broken between steps ([SCOPE](SCOPE.md)).

## Summary

| Phase | Name | Result |
|---|---|---|
| 1 | Foundation | Login, roles, protected routes, organization onboarding |
| 2 | Organizations and Jobs | Verified organizations publish jobs. Public can search them |
| 3 | Candidates and Applications | Seekers build profiles and apply. Teams see applications |
| 4 | Recruitment | Pipeline, interviews, feedback, messages, notifications |
| 5 | Administration | Super Admin tools, team management, analytics |
| 6 | Production | Security review, testing, speed, deployment |

## Hackathon demo slice

The full plan is bigger than 4 hours. If time is short, build this thin path end to end, with sample data:

1. Login for three roles (Phase 1).
2. Super Admin verifies an organization (Phase 2, minimal).
3. Org creates and publishes a job (Phase 2).
4. Public job list and detail page (Phase 2).
5. Seeker applies with a resume (Phase 3, minimal).
6. Recruiter moves the application on the Kanban board (Phase 4, minimal).
7. Seeker sees the new status and a notification.

Everything else waits until this path works.

---

## Phase 1: Foundation

**Goal:** A person can sign up, log in, and land in the right place for their role.

### Work
- Project setup: Vite, React, Tailwind, router, Supabase client, `.env.example`.
- Design tokens (font, sizes, colors, radius, shadows) (light only).
- Base components: Button, IconButton, Tooltip, Modal, ConfirmDialog, Toast, EmptyState, loading state, FormField, Badge, Avatar.
- App shell: sidebar and topbar, responsive, with a theme switch.
- Database: enums, `profiles`, `organizations`, `organization_members`, sign-up trigger, role helpers, RLS on all of them.
- Auth: sign up, log in, log out, password reset, session handling.
- Route list with protection by role.
- Organization onboarding: create organization, becomes Org Admin, status Pending.
- Seed: one Super Admin and sample organizations.

### Done when
- [ ] Sign up and log in work for seeker and organization owner.
- [ ] Each role lands on its own dashboard shell.
- [ ] Opening a page for the wrong role redirects with a message.
- [ ] Theme switch works and is remembered.
- [ ] Layout works at mobile and desktop width.
- [ ] `npm run dev` and `npm run build` both pass.

**Depends on:** nothing.

---

## Phase 2: Organizations and Jobs

**Goal:** A verified organization publishes jobs. Anyone can find them.

### Work
- Organization settings page: profile fields, logo and cover upload.
- Verification: document upload, Pending state banner, Super Admin review queue with approve and reject (with reason), notification to the organization.
- Database: `verification_documents`, `job_categories`, `skills`, `jobs`, `job_skills`, search index, publish rules, RLS, storage buckets `org-assets` and `verification-docs`.
- Job form (a full page): all fields, draft save, publish, pause, close, archive, duplicate.
- Org job list with status filter and search.
- Public pages: landing, job list with keyword search and filters, job detail, organization public profile with its jobs.
- Seed: categories, jobs in all statuses.

### Done when
- [ ] Unverified organizations cannot publish and see why.
- [ ] Super Admin can approve and reject. The organization is told.
- [ ] A published job appears publicly. A draft or paused job does not.
- [ ] Search and every filter work and can be combined.
- [ ] Public organization page shows only open jobs.
- [ ] Empty, loading and error states exist on every list.

**Depends on:** Phase 1.

---

## Phase 3: Candidates and Applications

**Goal:** A seeker applies once, and the hiring team sees the application.

### Work
- Database: `candidate_profiles`, experiences, educations, `candidate_skills`, `resumes`, `saved_jobs`, `applications`, `application_status_history`, apply action, duplicate protection, RLS, `resumes` bucket.
- Seeker profile page: summary, experience, education, skills, links. Profile completeness hint.
- Resume library: upload, label, set default, delete.
- Apply flow from the job page: choose resume, optional cover letter, confirm. Login prompt for visitors.
- Seeker: My Applications with status and timeline, withdraw, saved jobs.
- Organization: applications list per job with filter and search. Candidate detail page with resume viewer link.
- Evaluate: rating and shortlist toggle.
- Seed: seekers, resumes, applications.

### Done when
- [ ] A second application to the same job is blocked with a friendly message.
- [ ] Cannot apply to closed or unpublished jobs.
- [ ] Seeker sees only their own data. Org sees only its own applicants.
- [ ] Resume files open only through signed links.
- [ ] Withdraw works and updates history.
- [ ] Shortlist and rating save and survive refresh.

**Depends on:** Phase 2.

---

## Phase 4: Recruitment

**Goal:** The team runs the whole hiring process in the app, and everyone is kept informed.

### Work
- Database: `application_notes`, `application_evaluations`, `application_messages`, `interviews`, `interview_participants`, `interview_feedback`, `notifications`, `notification_preferences`, `email_outbox`, triggers, change-status action, RLS.
- Kanban board per job: columns for each status, drag to move, menu alternative for touch, rejection reason prompt.
- Status history timeline on the candidate detail page.
- Notes and scorecards (internal).
- Interview scheduling: date, time, mode, link or place, interviewers, instructions. Edit, cancel, mark done. Clash check.
- Interview feedback form for interviewers.
- Messages between team and candidate on each application.
- Notifications: bell with unread count, list page, mark read, live updates, preferences page.
- Emails for key events through an Edge Function: application received, status changed, interview scheduled or changed, invitation, verification result.

### Done when
- [ ] Dragging a card changes status, adds history, and notifies the candidate.
- [ ] Candidate never sees notes, scorecards or feedback.
- [ ] Interview invite reaches the candidate in-app and by email.
- [ ] Double-booking an interviewer is blocked.
- [ ] Notifications appear without a page refresh.
- [ ] Failed emails are recorded and retried, and never block the action.

**Depends on:** Phase 3.

---

## Phase 5: Administration

**Goal:** The platform and each organization can be managed and measured.

### Work
- Team management: invite by email, pending invitations, resend or revoke, change role, suspend, remove. Last Org Admin protection. Accept-invite page.
- Super Admin: user list with search, suspend and restore users and organizations, manage job categories, view any organization.
- Dashboards finalized for all four roles with the views from [DATABASE](DATABASE.md).
- Analytics: pipeline funnel, applications per job, time to hire, hires per month for organizations. Platform totals and growth for Super Admin.
- Activity log pages for Org Admin and Super Admin with filters.
- Database: `invitations`, `activity_logs`, reporting views, extra policies.

### Done when
- [ ] Invited person joins with the correct role, only once, before expiry.
- [ ] Suspended user or organization is blocked at sign-in and cannot write.
- [ ] Removing the last Org Admin is refused with a clear message.
- [ ] Numbers on dashboards match the underlying data.
- [ ] Analytics only count the viewer's own organization.
- [ ] Important actions appear in the activity log.

**Depends on:** Phase 4.

---

## Phase 6: Production

**Goal:** Safe, fast and ready to deploy.

### Work
- Security review using the checklist in [SECURITY](SECURITY.md). Fix every failure.
- Test with at least two organizations and several users at once.
- Functional test of every journey in [OVERVIEW](OVERVIEW.md).
- Responsive check on small phone, tablet and desktop.
- Accessibility basics: keyboard use, focus visible, labels, contrast.
- Performance: route code splitting, query review, indexes checked with real counts, image sizes, paging.
- Error handling review: no raw error text, no console errors or warnings.
- Clean sample data. Create the production Supabase project, apply schema, set up email domain, storage limits and backups.
- Deployment: build, environment variables, host, domain, redirect rules for single page app.
- Short admin guide and README with setup steps.

### Done when
- [ ] Every item in the security checklist passes.
- [ ] No known blocking bugs.
- [ ] Build passes and the deployed app works end to end.
- [ ] Super Admin account exists. Backups on.

**Depends on:** Phase 5.

---

## Risks

| Risk | Reduce it by |
|---|---|
| Plan is bigger than the time | Build the demo slice first, then expand by phase |
| RLS mistakes leak data | Write policies with the table, test with two organizations early |
| Policy checks slow lists | Index policy columns, keep helpers simple, check query speed in Phase 6 |
| Email delivery setup takes long | Treat in-app notifications as the main channel, email as add-on |
| Kanban drag and drop on touch | Always provide a menu to change status |
| New packages creep in | Ask before adding drag and drop, charts or date helpers |
