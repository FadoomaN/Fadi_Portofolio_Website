# Fadi Al Hazim — Portfolio

A portfolio and publishing platform for engineering projects, Journey entries, development logs, news, and career content. The public site and private Admin run from the same Vinext application.

## Stack

- React 19 with Next-compatible routing through Vinext and Vite
- TypeScript
- Supabase Auth, PostgreSQL, Row Level Security, and media storage
- TipTap for project rich text
- Prism for public and Admin code highlighting
- Cloudflare/Vite production integration

## Local development

Use Node.js 22.13 or newer.

```sh
npm install
npm run dev
```

```sh
npm run build
npm run lint
```

## Structure

- `app/` — public routes, Admin workspace, auth screens, and API routes
- `app/admin/` — Admin shell and feature editors
- `app/journey/` — public Journey pages and interaction components
- `app/projects/` — public project, block, code, and Dev Log rendering
- `lib/` — shared content, auth, project, Prism, HTTP, and Supabase utilities
- `supabase/migrations/` — reproducible database changes
- `scripts/` — focused policy and behavior checks

Route-specific components stay beside their routes. Shared project data definitions and validation live in `lib/projects.ts`; editor and public renderer code remain separate.

## Host architecture

The same application serves two hostnames:

- `fadialhazim.com` — public portfolio
- `admin.fadialhazim.com` — private Admin and auth UI

Admin sections use root-level paths on the Admin hostname, such as `/profile` and `/threads/projects`. Host checks prevent the Admin catch-all from exposing those views on the public hostname. The source route under `app/admin/` is an implementation detail, not the browser-facing Admin namespace.

Admin access requires an authenticated Supabase user, membership in `admin_users`, and an AAL2 MFA session. Mutating Admin APIs also enforce same-origin requests.

## Environment variables

Create `.env.local` from the project’s environment template and provide these names without committing their values:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
```

## Deployment

Build with `npm run build`, then run the generated Vinext server in the production environment. Supabase schema changes must be committed as migrations before deployment. Host and reverse-proxy configuration is managed outside this repository.
