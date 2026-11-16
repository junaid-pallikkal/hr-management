# Database Structure

Postgres on Supabase. This file describes the design only. The SQL will live in `supabase/schema.sql` when building starts.

Back to [OVERVIEW](OVERVIEW.md). Access rules for every table are in [SECURITY](SECURITY.md).

## Conventions

- Table and column names: `snake_case`. Tables plural.
- Primary key `id` is a UUID, except where noted.
- Every table has `created_at`. Editable tables also have `updated_at`, set automatically.
- Foreign keys are indexed.
- Org-owned tables carry `organization_id`, copied from the parent row.
- Deleting is soft where history matters (status values). Hard delete only for personal or draft data.
- Files are stored as a storage path, never a public URL.
- Money is stored as whole numbers in the smallest sensible unit with a currency code.
- Times are stored in UTC.
- Lists of allowed values use database enums.

## Relationship map

```
auth.users 1─1 profiles
profiles 1─* organization_members *─1 organizations
organizations 1─* invitations
organizations 1─* verification_documents
organizations 1─* jobs *─1 job_categories
jobs *─* skills                      (job_skills)
jobs 1─* applications *─1 profiles   (candidate)
applications *─1 resumes
profiles 1─1 candidate_profiles
candidate_profiles 1─* candidate_experiences
candidate_profiles 1─* candidate_educations
candidate_profiles *─* skills        (candidate_skills)
profiles *─* jobs                    (saved_jobs)
applications 1─* application_status_history
applications 1─* application_notes
applications 1─* application_evaluations
applications 1─* application_messages
applications 1─* interviews 1─* interview_participants
interviews 1─* interview_feedback
profiles 1─* notifications
profiles 1─* notification_preferences
organizations 1─* activity_logs
email_outbox (standalone queue)
```

## Enums

| Enum | Values |
|---|---|
| `platform_role` | `super_admin`, `organization_user`, `job_seeker` |
| `member_role` | `org_admin`, `hr_manager`, `recruiter` |
| `member_status` | `active`, `suspended` |
| `organization_status` | `pending`, `verified`, `rejected`, `suspended` |
| `invitation_status` | `pending`, `accepted`, `expired`, `revoked` |
| `job_status` | `draft`, `published`, `paused`, `closed`, `archived` |
| `employment_type` | `full_time`, `part_time`, `contract`, `internship`, `temporary` |
| `work_mode` | `onsite`, `hybrid`, `remote` |
| `experience_level` | `entry`, `junior`, `mid`, `senior`, `lead`, `executive` |
| `application_status` | `applied`, `screening`, `shortlisted`, `interview`, `offered`, `hired`, `rejected`, `withdrawn` |
| `interview_mode` | `in_person`, `phone`, `video` |
| `interview_status` | `scheduled`, `completed`, `cancelled`, `no_show` |
| `recommendation` | `strong_yes`, `yes`, `neutral`, `no`, `strong_no` |
| `notification_type` | `application_received`, `application_status_changed`, `interview_scheduled`, `interview_updated`, `interview_cancelled`, `message_received`, `invitation_received`, `organization_verified`, `organization_rejected`, `job_published`, `job_closing_soon`, `team_member_joined` |
| `email_status` | `queued`, `sent`, `failed` |

## Tables

Legend: **PK** primary key · **FK** foreign key · **U** unique · **N** nullable · **D** default.

### Identity and organizations

#### `profiles`
One row per user. Created automatically on sign-up.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, FK to `auth.users`, deleted with the user |
| `email` | text | U, copied from auth |
| `full_name` | text | |
| `phone` | text | N |
| `avatar_path` | text | N |
| `platform_role` | platform_role | D `job_seeker` |
| `is_active` | boolean | D true. Super Admin can switch off |
| `theme` | text | D `system`. Values: light, dark, system |
| `last_seen_at` | timestamptz | N |
| `created_at`, `updated_at` | timestamptz | |

Users cannot change their own `platform_role` or `is_active`.

#### `organizations`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | |
| `slug` | text | U, used in public URLs |
| `status` | organization_status | D `pending` |
| `logo_path`, `cover_path` | text | N |
| `tagline` | text | N |
| `about` | text | N |
| `industry` | text | N |
| `size_range` | text | N. Example: 11-50 |
| `founded_year` | int | N |
| `website`, `linkedin_url` | text | N |
| `contact_email`, `contact_phone` | text | N |
| `address_line`, `city`, `state`, `country` | text | N |
| `verified_at` | timestamptz | N |
| `verified_by` | uuid | N, FK `profiles` |
| `rejection_reason` | text | N |
| `created_by` | uuid | FK `profiles` |
| `created_at`, `updated_at` | timestamptz | |

#### `organization_members`
Who belongs to which organization, and with what role.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `organization_id` | uuid | FK |
| `user_id` | uuid | FK `profiles` |
| `role` | member_role | |
| `status` | member_status | D `active` |
| `job_title` | text | N |
| `invited_by` | uuid | N, FK `profiles` |
| `joined_at` | timestamptz | D now |
| | | U (`organization_id`, `user_id`) |

Rule: every organization keeps at least one active `org_admin`.

#### `invitations`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `organization_id` | uuid | FK |
| `email` | text | Invited address |
| `role` | member_role | |
| `token_hash` | text | U. Only the hash is stored |
| `status` | invitation_status | D `pending` |
| `invited_by` | uuid | FK `profiles` |
| `expires_at` | timestamptz | D 7 days |
| `accepted_at` | timestamptz | N |
| `created_at` | timestamptz | |

One pending invitation per email per organization.

#### `verification_documents`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `organization_id` | uuid | FK |
| `doc_type` | text | Registration certificate, tax number, address proof, other |
| `file_path` | text | Private bucket |
| `file_name` | text | |
| `uploaded_by` | uuid | FK `profiles` |
| `created_at` | timestamptz | |

### Jobs

#### `job_categories`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | U |
| `slug` | text | U |
| `sort_order` | int | |

Managed by Super Admin. Readable by everyone.

#### `skills`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | U, case-insensitive |

Shared by jobs and candidates. Any signed-in user can add a new skill.

#### `jobs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `organization_id` | uuid | FK |
| `created_by` | uuid | FK `profiles` |
| `category_id` | uuid | N, FK |
| `title` | text | |
| `slug` | text | U |
| `department` | text | N |
| `summary` | text | Short line for lists |
| `description` | text | |
| `responsibilities` | text | N |
| `requirements` | text | N |
| `benefits` | text | N |
| `employment_type` | employment_type | |
| `work_mode` | work_mode | |
| `experience_level` | experience_level | |
| `min_experience_years` | int | N |
| `city`, `state`, `country` | text | N |
| `salary_min`, `salary_max` | int | N |
| `salary_currency` | text | N, D organization's currency |
| `salary_period` | text | N. year, month, hour |
| `show_salary` | boolean | D true |
| `openings` | int | D 1 |
| `status` | job_status | D `draft` |
| `published_at` | timestamptz | N |
| `closes_at` | timestamptz | N. Closes automatically after this date |
| `search_vector` | tsvector | Generated from title, summary, description. Indexed |
| `created_at`, `updated_at` | timestamptz | |

Rules: only `verified` organizations can set `published`. A closed or archived job accepts no new applications.

#### `job_skills`
| Column | Type | Notes |
|---|---|---|
| `job_id` | uuid | FK |
| `skill_id` | uuid | FK |
| | | PK (`job_id`, `skill_id`) |

### Candidates

#### `candidate_profiles`
One per job seeker. Same id as `profiles.id`.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | PK, FK `profiles` |
| `headline` | text | N |
| `summary` | text | N |
| `current_title` | text | N |
| `city`, `state`, `country` | text | N |
| `years_experience` | int | N |
| `expected_salary` | int | N |
| `salary_currency` | text | N |
| `work_mode_preference` | work_mode | N |
| `notice_period_days` | int | N |
| `linkedin_url`, `portfolio_url`, `github_url` | text | N |
| `open_to_work` | boolean | D true |
| `updated_at` | timestamptz | |

Candidates are not publicly listed. Organizations see a candidate only through an application.

#### `candidate_experiences`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK `candidate_profiles` |
| `company` | text | |
| `title` | text | |
| `location` | text | N |
| `start_date` | date | |
| `end_date` | date | N. Empty means current |
| `description` | text | N |

#### `candidate_educations`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK `candidate_profiles` |
| `institution` | text | |
| `degree` | text | |
| `field_of_study` | text | N |
| `start_year`, `end_year` | int | N |
| `grade` | text | N |

#### `candidate_skills`
Same shape as `job_skills`: PK (`user_id`, `skill_id`). Optional `level` text.

#### `resumes`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK `profiles` |
| `label` | text | Example: Design CV |
| `file_path` | text | Private bucket |
| `file_name` | text | |
| `file_size` | int | Bytes |
| `mime_type` | text | |
| `is_default` | boolean | One default per user |
| `created_at` | timestamptz | |

A resume used by an application cannot be hard deleted. It is marked removed and the file stays until the application is closed.

#### `saved_jobs`
PK (`user_id`, `job_id`), plus `created_at`.

### Applications

#### `applications`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `job_id` | uuid | FK |
| `organization_id` | uuid | FK, copied from the job |
| `candidate_id` | uuid | FK `profiles` |
| `resume_id` | uuid | FK `resumes` |
| `cover_letter` | text | N |
| `status` | application_status | D `applied` |
| `rating` | smallint | N. 1 to 5, overall score |
| `is_shortlisted` | boolean | D false |
| `sort_order` | numeric | Position inside a Kanban column |
| `applied_at` | timestamptz | |
| `status_changed_at` | timestamptz | |
| `updated_at` | timestamptz | |
| | | U (`job_id`, `candidate_id`) prevents duplicate applications |

A rejected or withdrawn candidate cannot reapply to the same job.

#### `application_status_history`
Append only. Nobody edits or deletes rows.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `application_id` | uuid | FK |
| `organization_id` | uuid | FK |
| `from_status` | application_status | N. Empty for the first entry |
| `to_status` | application_status | |
| `changed_by` | uuid | FK `profiles` |
| `note` | text | N. Reason, especially for rejection |
| `created_at` | timestamptz | |

#### `application_notes`
Internal notes. Never shown to candidates.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `application_id` | uuid | FK |
| `organization_id` | uuid | FK |
| `author_id` | uuid | FK `profiles` |
| `body` | text | |
| `created_at`, `updated_at` | timestamptz | |

#### `application_evaluations`
One scorecard per team member per application.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `application_id` | uuid | FK |
| `organization_id` | uuid | FK |
| `evaluator_id` | uuid | FK `profiles` |
| `rating` | smallint | 1 to 5 |
| `recommendation` | recommendation | |
| `strengths`, `concerns` | text | N |
| `created_at`, `updated_at` | timestamptz | |
| | | U (`application_id`, `evaluator_id`) |

#### `application_messages`
A simple message thread between the hiring team and the candidate, per application.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `application_id` | uuid | FK |
| `organization_id` | uuid | FK |
| `sender_id` | uuid | FK `profiles` |
| `body` | text | |
| `read_at` | timestamptz | N |
| `created_at` | timestamptz | |

### Interviews

#### `interviews`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `application_id` | uuid | FK |
| `organization_id` | uuid | FK |
| `title` | text | Example: Technical round |
| `round_number` | smallint | D 1 |
| `mode` | interview_mode | |
| `starts_at` | timestamptz | |
| `ends_at` | timestamptz | |
| `timezone` | text | For display |
| `location_or_link` | text | N. Address or meeting link |
| `instructions` | text | N. Shown to candidate |
| `status` | interview_status | D `scheduled` |
| `scheduled_by` | uuid | FK `profiles` |
| `created_at`, `updated_at` | timestamptz | |

Rule: `ends_at` must be after `starts_at`. A participant cannot be double-booked at the same time.

#### `interview_participants`
Interviewers from the organization. PK (`interview_id`, `user_id`).

#### `interview_feedback`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `interview_id` | uuid | FK |
| `organization_id` | uuid | FK |
| `author_id` | uuid | FK `profiles` |
| `rating` | smallint | 1 to 5 |
| `recommendation` | recommendation | |
| `comments` | text | N |
| `created_at` | timestamptz | |
| | | U (`interview_id`, `author_id`) |

Feedback is internal. Candidates never see it.

### Notifications and activity

#### `notifications`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | Recipient, FK `profiles` |
| `type` | notification_type | |
| `title` | text | Short, plain words |
| `body` | text | N |
| `link` | text | N. App path to open |
| `entity_type`, `entity_id` | text, uuid | N. What it refers to |
| `is_read` | boolean | D false |
| `created_at` | timestamptz | |

#### `notification_preferences`
PK (`user_id`, `type`). Columns `in_app` (D true) and `email` (D true).

#### `email_outbox`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `to_email` | text | |
| `template` | text | Template key |
| `payload` | jsonb | Values filled into the template |
| `status` | email_status | D `queued` |
| `attempts` | smallint | D 0 |
| `last_error` | text | N. For staff only |
| `sent_at` | timestamptz | N |
| `created_at` | timestamptz | |

No user can read this table. Only the email function uses it.

#### `activity_logs`
Append only.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `organization_id` | uuid | N. Empty for platform events |
| `actor_id` | uuid | N, FK `profiles` |
| `action` | text | Example: `job.published`, `application.rejected` |
| `entity_type`, `entity_id` | text, uuid | N |
| `metadata` | jsonb | Small extra details |
| `created_at` | timestamptz | |

## Indexes

| Table | Index | Why |
|---|---|---|
| `jobs` | (`status`, `published_at` desc) | Public list |
| `jobs` | `search_vector` (GIN) | Keyword search |
| `jobs` | (`organization_id`, `status`) | Org job list |
| `jobs` | (`city`), (`work_mode`), (`employment_type`), (`experience_level`), (`category_id`) | Filters |
| `applications` | (`job_id`, `status`, `sort_order`) | Kanban |
| `applications` | (`candidate_id`, `applied_at` desc) | My applications |
| `applications` | (`organization_id`, `status`) | Dashboards |
| `organization_members` | (`user_id`) | Find my organizations |
| `notifications` | (`user_id`, `is_read`, `created_at` desc) | Bell and list |
| `interviews` | (`organization_id`, `starts_at`) | Calendar |
| `activity_logs` | (`organization_id`, `created_at` desc) | Activity page |
| `application_status_history` | (`application_id`, `created_at`) | Timeline |

## Automatic behavior (triggers)

| When | What happens |
|---|---|
| New auth user | Create `profiles` row |
| Any update on editable tables | Set `updated_at` |
| Job set to `published` | Set `published_at`. Block if the organization is not verified |
| Job passes `closes_at` | Mark `closed` (scheduled check) |
| Application inserted | First history row |
| Application status changes | History row, `status_changed_at`, activity log, notification |
| Interview created, changed or cancelled | Notification to candidate and interviewers |
| Application message inserted | Notification to the other side |
| Organization status changes | Notification to its admins |
| Member removed or suspended | Block if it leaves no active `org_admin` |

## Views and reports

Database views or functions that return counts only for allowed rows.

| Name | Returns |
|---|---|
| `org_dashboard_stats` | Open jobs, new applications this week, interviews this week, hires this month |
| `org_pipeline_funnel` | Applications per status, per job or for all jobs |
| `org_time_to_hire` | Average days from applied to hired |
| `org_source_by_job` | Applications per job |
| `platform_stats` | Organizations by status, users by role, jobs, applications, signups per week |
| `seeker_dashboard_stats` | Applications by status, upcoming interviews, unread messages |

## Sample data (for the demo)

Provided in `supabase/seed.sql`. It needs realistic content:

- 1 Super Admin, 4 organizations (3 verified, 1 pending) in different industries.
- 2 to 4 team members per organization with mixed roles.
- 8 job categories, about 30 jobs in mixed statuses.
- 15 job seekers with profiles and resumes.
- About 80 applications spread across all stages, with history, notes and some interviews.
- A few notifications per user.

Seed users are created through Supabase Auth, not by inserting passwords directly.
