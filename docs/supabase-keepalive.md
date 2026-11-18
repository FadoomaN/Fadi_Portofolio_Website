# Supabase keep-alive from the VPS

`GET /api/internal/supabase-keepalive` accepts `Authorization: Bearer <KEEPALIVE_SECRET>`.
It performs `about_content.select('id').limit(1)` with the existing server client
and publishable key. It needs no service-role key and returns only `{ "ok": true }`
or `{ "ok": false }`, with caching disabled. Missing/wrong authentication returns
401; missing server configuration or a failed query returns 503.

The endpoint keeps database activity infrequent; it is not a guarantee against
provider suspension policies. Nothing polls from a browser.

## Application setup

Run these in the **actual VPS repository directory**, with the deployment user:

```sh
# Generate without printing the value; keep the same value for app and cron.
umask 077
touch .env.local
if ! grep -q '^KEEPALIVE_SECRET=.' .env.local; then
  sed -i '/^KEEPALIVE_SECRET=/d' .env.local
  printf '\nKEEPALIVE_SECRET=%s\n' "$(openssl rand -hex 32)" >> .env.local
fi
chmod 600 .env.local
npm run build
```

The exact variable is `KEEPALIVE_SECRET=<generated value>`. Never use a
`NEXT_PUBLIC_` prefix. Keep the unquoted hex value in this file for the cron helper.
If the production process receives environment variables from systemd, PM2,
Docker, or a hosting dashboard, securely copy this same value into that
environment and restart/recreate the app using the existing deployment process.
The repository does not specify the VPS service name or process manager.
Do not source the entire `.env.local` as a shell script: other values may contain spaces.

## Cron

First verify the deployed endpoint and helper:

```sh
/bin/sh scripts/supabase-keepalive.sh
```

Install the job from the repository directory (this expands the correct absolute
path, preserves existing jobs, and avoids duplicate keep-alive entries):

```sh
repo_dir=$(pwd -P)
(crontab -l 2>/dev/null | grep -v '/scripts/supabase-keepalive.sh'; \
 printf '15 9 * * 1,3,6 /bin/sh "%s/scripts/supabase-keepalive.sh"\n' "$repo_dir") | crontab -
crontab -l
```

Exact expression: `15 9 * * 1,3,6` — Monday, Wednesday and Saturday at 09:15
in the VPS cron timezone. For 09:15 Stockholm time, the VPS cron daemon must use
Europe/Stockholm (or support a `CRON_TZ=Europe/Stockholm` crontab entry).

`KEEPALIVE_ENV_FILE` and `KEEPALIVE_URL` can override the helper's defaults when
deployment keeps its environment elsewhere or uses another hostname. Normal
success is quiet; curl failures go to cron's error output. The helper passes
the bearer header through stdin, keeping the secret out of process arguments.
