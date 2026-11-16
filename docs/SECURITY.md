# Security and Access Rules

Back to [OVERVIEW](OVERVIEW.md). Tables are described in [DATABASE](DATABASE.md).

## Principles

1. The database decides access. The UI only hides things for comfort.
2. Row Level Security is on for **every** table. No table is left open.
3. Default is deny. Each policy opens one specific door.
4. One organization can never read or change another's private data.
5. The service role key is never in the frontend.
6. Users never see raw technical errors.

## Roles and how they are found

| Check | Meaning |
|---|---|
| Is Super Admin | `profiles.platform_role = super_admin` and active |
| Is member of org X | Active row in `organization_members` for the user and X |
| Has role in org X | Member of X with `org_admin`, `hr_manager` or `recruiter` |
| Is owner of row | Row's `user_id`, `candidate_id` or `author_id` equals the user |

These checks are small shared database helpers. Policies call them so the rules stay in one place. Role changes take effect immediately.

## Permission matrix (organization)

| Action | Org Admin | HR Manager | Recruiter |
|---|---|---|---|
| Edit organization profile | Yes | No | No |
| Upload verification documents | Yes | No | No |
| Invite, change role, suspend or remove members | Yes | Recruiters only | No |
| Create and edit jobs | Yes | Yes | Yes |
| Publish, pause, close jobs | Yes | Yes | Yes (own jobs) |
| Delete or archive jobs | Yes | Yes | No |
| View applications | Yes | Yes | Yes |
| Move applications, rate, shortlist | Yes | Yes | Yes |
| Add notes and feedback | Yes | Yes | Yes |
| Schedule interviews | Yes | Yes | Yes |
| Message candidates | Yes | Yes | Yes |
| View analytics | Yes | Yes | Own jobs only |
| View activity log | Yes | No | No |

Changing this table later means changing policies, not just screens.

## Policy rules by table

"Org member" means active member of the row's `organization_id`.

| Table | Read | Create | Update | Delete |
|---|---|---|---|---|
| `profiles` | Self. Super Admin all. Org members see basic name and avatar of teammates. Hiring team sees an applicant's name and avatar | By trigger only | Self, except role and active flag. Super Admin all | None |
| `organizations` | Anyone for `verified`. Members for own. Super Admin all | Through the create action | Org Admin for own profile fields. Super Admin for status | Super Admin |
| `organization_members` | Members of the same organization. Self. Super Admin | Through invitation action | Org Admin and HR Manager per matrix | Same as update |
| `invitations` | Org Admin and HR Manager of the organization | Same | Revoke by same | None |
| `verification_documents` | Org Admin of the organization. Super Admin | Org Admin | None | Org Admin while pending |
| `job_categories` | Anyone | Super Admin | Super Admin | Super Admin |
| `skills` | Anyone | Any signed-in user | None | Super Admin |
| `jobs` | Anyone if `published` and the organization is `verified`. Org members see all of own | Org member with role | Per matrix | Per matrix |
| `job_skills` | Same as the job | Same as the job | Same | Same |
| `candidate_profiles` and children | Owner. Hiring team for applicants only. Super Admin | Owner | Owner | Owner |
| `resumes` | Owner. Hiring team for the resume on an application | Owner | Owner | Owner (see rule in DATABASE) |
| `saved_jobs` | Owner | Owner | None | Owner |
| `applications` | Candidate sees own. Org members see their organization's. Super Admin read only | Through the apply action | Status and rating through the change action. Candidate may only withdraw | None |
| `application_status_history` | Candidate sees own (status and date only, no internal note). Org members see all | By trigger | None | None |
| `application_notes` | Org members only | Org member | Author | Author |
| `application_evaluations` | Org members only | Org member | Author | Author |
| `application_messages` | Candidate of the application. Org members | Either side | Mark read only | None |
| `interviews` | Candidate sees own and the safe fields only. Org members see all | Org member | Org member | Org member (cancel) |
| `interview_participants` | Org members. Candidate sees names only | Org member | None | Org member |
| `interview_feedback` | Org members only | Org member | Author | Author |
| `notifications` | Recipient only | By trigger or function | Recipient (mark read) | Recipient |
| `notification_preferences` | Owner | Owner | Owner | None |
| `email_outbox` | Nobody from the app | Functions only | Functions only | None |
| `activity_logs` | Org Admin of the organization. Super Admin | By trigger or function | None | None |

### Things that must always be true

- Candidates never see notes, evaluations, interview feedback or internal history notes.
- A candidate cannot see other candidates, even on the same job.
- Draft, paused, closed and archived jobs are invisible to the public.
- Jobs of unverified or suspended organizations are invisible to the public.
- A suspended organization or user cannot write anything.
- Super Admin reads everything but does not edit hiring data (applications, notes, interviews).
- History and activity rows are append only.
- A user cannot grant themselves a higher role.
- The last active Org Admin cannot be removed.

## Authentication

- Supabase Auth, email and password.
- Email confirmation on. Password reset by email.
- Minimum password length and clear error messages in plain language.
- Session refresh handled by the Supabase client.
- On sign-in, check `is_active` and organization status. Blocked users see a short message, not an error code.
- Super Admin accounts are created by hand in the database, never through public sign-up. The sign-up form can only create job seekers and organization owners.

## Storage security

| Bucket | Read | Write |
|---|---|---|
| `avatars` | Public | Owner of the folder |
| `org-assets` | Public | Org Admin of the folder's organization |
| `resumes` | Owner. Hiring team of an organization the candidate applied to. Through signed links only | Owner |
| `verification-docs` | Org Admin of that organization. Super Admin | Org Admin |

- Folder name starts with the user or organization id, so the policy can check it.
- Check file type and size on the client and in the bucket settings.
- Rename files on upload to avoid clashes and odd characters.
- Signed links expire in minutes.

## Input and abuse protection

- Validate every form on the client and rely on database constraints as the final check.
- Only plain text for descriptions and notes. If formatting is added later, sanitize it before showing.
- Render user text as text, never as raw HTML.
- Limit repeated applications, invitations and messages (rate limits in functions).
- Invitation tokens are random, stored hashed, single use and expire.
- Never log passwords, tokens or full resumes.

## Privacy

- Candidate data is only visible to organizations the candidate applied to.
- Candidates can withdraw applications and delete their account and files.
- Email addresses are not shown on public pages.
- Salary is hidden when `show_salary` is off.

## Security testing checklist

Run before production. Each item needs a pass.

**Tenant isolation**
- [ ] Org A user cannot list, read or change Org B jobs, applications, notes, interviews, members, documents or logs.
- [ ] Changing an id in a request does not expose another organization's row.
- [ ] A recruiter cannot do Org Admin actions.

**Candidates**
- [ ] A seeker cannot read another seeker's profile, resumes or applications.
- [ ] A seeker cannot read notes, feedback or evaluations.
- [ ] A seeker cannot apply twice, apply to a closed job or apply with someone else's resume.

**Public**
- [ ] Visitors see only published jobs from verified organizations.
- [ ] Visitors cannot read profiles, applications or storage private buckets.

**Privilege**
- [ ] A user cannot change their own platform role, active flag or organization role.
- [ ] Only Super Admin can verify an organization.
- [ ] Unverified organizations cannot publish.
- [ ] Suspended users and organizations are blocked.

**Files**
- [ ] Private files cannot be opened without a valid signed link.
- [ ] Wrong file types and oversized files are rejected.

**General**
- [ ] No service role key in the frontend bundle.
- [ ] `.env` is not committed.
- [ ] Errors shown to users are plain language.
- [ ] Every table shows RLS enabled.
