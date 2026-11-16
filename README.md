# JobBridge

Job recruitment platform for organizations, recruiters and job seekers. Vite, React, Tailwind CSS and Supabase. Plans and rules are in [docs](docs/OVERVIEW.md).

## Run it

1. Create a Supabase project.
2. In the SQL editor, run [supabase/schema.sql](supabase/schema.sql), then [supabase/seed.sql](supabase/seed.sql).
3. Copy `.env.example` to `.env` and fill in your project URL and anon key. Never use the service role key here.
4. In Supabase, go to Authentication and set the Site URL to your app address. Add `/reset-password` and `/invite/*` to the redirect URLs.

```bash
npm install
```

```bash
npm run dev
```

## First Super Admin

Sign up in the app, then run this in the SQL editor with your email:

```sql
update profiles set platform_role = 'super_admin' where email = 'you@example.com';
```

Super Admin accounts cannot be created from the sign-up form.

## Deploy

```bash
npm run build
```

Upload the `dist` folder to any static host. The host must send every path to `index.html`, because the app uses browser routes (Netlify: a `/* /index.html 200` rule in `public/_redirects`. Vercel: a rewrite to `/index.html`).

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host settings. Use a separate Supabase project for production and turn on backups there.

## Admin guide

- **Approve companies:** Admin, Organizations. Open one, check its documents, then Approve or Reject (a reason is required and the company sees it).
- **Suspend:** a company or a user can be suspended and restored. They are blocked at once.
- **Categories:** Admin, Categories.
- **Invitations:** companies copy the invitation link and send it themselves. Emails are queued in the `email_outbox` table. To send them, add an Edge Function with your email provider that reads `queued` rows.

## Known limits

- Emails are queued but not sent until you connect a provider.
- The pay range of a job is readable through the API even when "Show pay" is off. It is only hidden in the app.
- A suspended job seeker with an open session can keep using it until the session ends. Companies are blocked immediately.
