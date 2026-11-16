# AGENTS.md

Follow these rules in every task, without exception.

## Detail files

- [docs/DESIGN.md](docs/DESIGN.md): visual rules (fonts, icons, layout, colors)
- [docs/UX.md](docs/UX.md): workflow and wording rules
- [docs/SCOPE.md](docs/SCOPE.md): build discipline, hackathon mode, how to reply
- [docs/TASKS.md](docs/TASKS.md): the 4-hour plan and what's done

Read the file that matches your task before you start.

## Tech stack

- Vite + React (JavaScript), Tailwind CSS, Supabase.
- Icons: `lucide-react`.
- Routing: `react-router-dom`.
- No other framework, UI library or package without asking first.

## Project structure

- `src/pages/`: one file per page.
- `src/components/`: reusable pieces (Button, Modal, IconButton, Tooltip, EmptyState, Toast, ConfirmDialog).
- `src/lib/supabase.js`: the single Supabase client.
- `src/services/`: all database calls, one file per feature (for example `clients.js`). Pages and components never call Supabase directly.
- `src/hooks/`: shared hooks.
- Keep each file small and focused on one thing.

## Supabase

- Keys live in `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never commit `.env`. Provide `.env.example`.
- Never use the service role key in the frontend.
- Turn on Row Level Security for every table, with a simple policy.
- Keep the SQL for tables and policies in `supabase/schema.sql`.
- Login uses Supabase Auth, email and password, unless told otherwise.
- Every service call handles errors. Show a plain-language message. Never show raw error text.

## Data and state

- Use React state and context only. No Redux or other state library.
- Load data in one place per page, with a loading state and an empty state.
- After a create, edit or delete, refresh the list automatically.

## Routing

- Keep the route list short, in one file.
- Protect pages that need login.

## Quality checks

- `npm run dev` and `npm run build` must both work before a task is called done.
- No console errors or warnings.
- Test the main flow once at mobile width before finishing a task.
