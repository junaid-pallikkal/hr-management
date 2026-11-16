# JobBridge: Product Overview

A multi-tenant job recruitment platform. Organizations post jobs and run hiring. Job seekers find jobs and apply. A Super Admin oversees the whole platform.

Related docs: [ARCHITECTURE](ARCHITECTURE.md) · [DATABASE](DATABASE.md) · [SECURITY](SECURITY.md) · [PHASES](PHASES.md) · [DESIGN](DESIGN.md) · [UX](UX.md) · [SCOPE](SCOPE.md) · [TASKS](TASKS.md)

## Goal

One secure place where organizations, HR teams, recruiters and job seekers meet. Each organization sees only its own data. The product feels premium, minimal and professional.

## Users and roles

| Role | Who | Main goals |
|---|---|---|
| Super Admin | Platform owner | Verify organizations, manage users, watch platform health |
| Organization Admin | Owner of an organization account | Set up the company, invite the team, manage all jobs and hiring |
| HR Manager | Senior HR in an organization | Manage jobs and hiring, manage recruiters |
| Recruiter | Hiring team member | Post jobs, review candidates, run interviews |
| Job Seeker | Candidate | Build a profile, upload resumes, apply, track applications |

A person has one account. Their platform role and organization role decide what they can see and do. Full rules are in [SECURITY](SECURITY.md).

## Core user journeys

### Organization
1. Registers an account and creates the organization.
2. Uploads company details and verification documents. Status is **Pending**.
3. Super Admin verifies. Status becomes **Verified**. Only verified organizations can publish jobs.
4. Admin invites HR and recruiters by email.
5. Team creates a job, saves a draft, publishes it.
6. Applications arrive. The team reviews, shortlists, moves candidates through the pipeline, schedules interviews and leaves feedback.
7. Candidate is offered, hired or rejected. The candidate is told at each step.

### Job Seeker
1. Signs up and completes a profile (summary, experience, education, skills).
2. Uploads one or more resumes.
3. Searches and filters public jobs. Saves jobs for later.
4. Applies once per job. Cannot apply twice.
5. Tracks status, receives interview invites and messages.

### Super Admin
1. Reviews pending organizations and their documents. Approves or rejects with a reason.
2. Suspends or restores organizations and users.
3. Views platform analytics and activity.

## Feature list by area

### 1. Foundation
- Email and password login (Supabase Auth).
- Roles, protected routes, role-based menus.
- Reusable design system (light theme only).

### 2. Users and organizations
- Organization registration and verification flow.
- Organization profile (logo, cover, about, links, locations).
- Team management: invite, change role, suspend, remove.
- Job seeker profiles.

### 3. Jobs
- Create, edit, duplicate, publish, pause, close, archive.
- Statuses: Draft, Published, Paused, Closed, Archived.
- Public job list and detail pages. Search and filters.
- Public organization pages with their open jobs.

### 4. Candidates and applications
- Candidate profile and resume library.
- Apply with a chosen resume and optional cover letter.
- One application per candidate per job.
- Candidate can withdraw. Candidate sees status.
- Recruiters rate and shortlist.

### 5. Recruitment
- Kanban pipeline: Applied, Screening, Shortlisted, Interview, Offered, Hired, Rejected.
- Interview scheduling with participants.
- Internal notes and interview feedback (hidden from candidates).
- Full status history per application.
- Messages between recruiter and candidate, per application.

### 6. Notifications and dashboards
- A dashboard for each role.
- In-app notifications with unread count.
- Email notifications for key events.
- Recruitment analytics. Activity log.

### 7. Security and multi-tenancy
- Every organization-owned row carries an `organization_id`.
- Row Level Security on every table.
- Private file storage with signed links.

### 8. UI and production
- Loading, empty and error states everywhere.
- Mobile first, responsive dashboards.
- Testing, performance and deployment preparation.

## Out of scope (for now)

Listed so nobody builds them by accident. Add only after approval.

- Payments, billing, subscription plans.
- Social login and two-factor login.
- Video calls inside the app (interviews hold a link only).
- AI resume parsing and job matching.
- Native mobile apps.
- Custom pipeline stages per organization (fixed stages first).
- Multi-language support.

## Glossary

| Term | Meaning |
|---|---|
| Organization | A company account (a tenant) |
| Member | A user who belongs to an organization |
| Vacancy / Job | A posted opening |
| Application | One candidate applying to one job |
| Pipeline | The ordered stages an application moves through |
| Tenant isolation | One organization can never read another's private data |
| RLS | Row Level Security, database rules that filter rows per user |

## Open decisions

| Topic | Note |
|---|---|
| Language | Decided: **JavaScript**, as in [AGENTS.md](../AGENTS.md). The original plan said TypeScript. |
| Time | The full plan is larger than the 4-hour hackathon limit in [SCOPE](SCOPE.md). See the demo slice in [PHASES](PHASES.md). |
| Email sending | Needs an email provider and a server function. Provider not chosen. |
| Extra packages | Drag and drop for Kanban, charts and date handling each need approval. See [ARCHITECTURE](ARCHITECTURE.md). |
