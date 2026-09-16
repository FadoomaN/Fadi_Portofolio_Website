# Automatic comments

Journey editing, images and reactions use the existing Supabase connection. Projects are unchanged.

Journey now has threads and subthreads. A subthread is the whole story: media plus article text, or article text alone. The old direct post was moved into a subthread with its reaction history intact. Thread categories are stored in `journey_categories`; admins can add categories in the Journey editor. Thumbnail positioning is saved on threads and subthreads and previewed in a 16:9 crop frame.

Comments require these values in `.env.local` (and the production host's environment when deployed):

| Variable | Where it comes from |
| --- | --- |
| `OPENAI_API_KEY` | Your OpenAI API project |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile widget secret |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | The same Turnstile widget's public site key |
| `SUPABASE_SERVICE_ROLE_KEY` | This Supabase project's server secret/service-role key |

Never prefix a secret with `NEXT_PUBLIC_`, commit it, or paste it into chat. Allow the actual website hostname and `localhost` in the Turnstile widget settings. Restart the local development server after changing environment values. No account, API key or paid subscription was created automatically.

For local development, put the values in the git-ignored `.env.local`. Cloudflare provides paired Turnstile [test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) for `localhost`; use both a test site key and its matching test secret there. Do not use those test keys in production. Keep the real keys in the deployment provider's environment/secret settings, not in source files.

## What happens

1. The visitor enters a display name (2–60 characters) and comment (1–2,000 characters).
2. The server validates the Turnstile token and its hostname/action, then applies database rate limiting.
3. OpenAI Moderation checks the content. Flagged content is not published; negative sentiment, disagreement and ordinary criticism are welcome when they do not trigger moderation.
4. Excessive links, repeated-character spam and duplicate posts are rejected separately.
5. Only a successful server-side check can save a published comment. It becomes visible immediately. There is no admin approval inbox.

If keys are missing or a provider is unavailable, new comments are unavailable instead of bypassing moderation. Existing published comments and reactions still work. Automated checks can make mistakes; neither AI nor CAPTCHA guarantees perfect abuse prevention. Visitors are told that comment text is checked by OpenAI and the anti-bot check uses Cloudflare.

Reactions use a one-year HttpOnly anonymous browser cookie: one like OR dislike per entry/browser, changeable and removable. Clearing cookies or switching browsers creates a new anonymous identity; this is not one vote per verified person.

Official references: [OpenAI Moderation](https://developers.openai.com/api/docs/guides/moderation), [Turnstile server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Database migrations

The `2026091812*` migrations add the content hierarchy and feedback schema. `20260918130000` restricts comment publishing to the server after automatic checks. The original on-screen examples were preserved first, then removed at the user's request; a local, git-ignored recovery copy is in `work/journey-examples-backup-2026-09-16.json`. The user's own test thread was retained.
`20260918140000` converts direct Journey posts into subthreads and keeps their IDs for reactions/comments. Each subthread has one internal content row; visitors and admins only see threads and subthreads.
`20260918142000` adapts the existing `entry_comments` table: public reads are limited to published comments and safe columns, while writes remain server-only. Existing moderation states are mapped without removing rows. The migration also restores the AAL2 admin gate specified by the repository migration.
