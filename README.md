# LiiiGHTNOTES

A private study notebook with email-verified accounts and AI-assisted visual notes. React, TypeScript and SCSS frontend; Express API and PostgreSQL storage.

## Development

Use Node.js 24. Install frontend dependencies with npm ci and backend dependencies with npm ci --prefix server. Copy server/.env.example to server/.env and configure a verified email sender. Start the API with npm run dev --prefix server and the frontend with npm run dev in a second terminal. Local storage uses PGlite when DATABASE_URL is absent. GENERATION_MODE=demo is available for local work; no demo accounts or notes are seeded by default.

## Verification

Run npm run lint, npm run build, npm test --prefix server, and npm audit --omit=dev in both directories. CI runs these checks on pushes and pull requests.

The September 11, 2026 local verification passed 15 backend tests, frontend lint/build, and production dependency audits. A separate browser journey covered registration, verification, notes, password recovery, account controls and responsive layouts. All 14 tested views had zero automated WCAG A/AA violations. This does not certify complete accessibility or security compliance. See [production review](docs/production-review.md) for remaining live release checks.

## Railway API

Set the service root directory to /server, choose Dockerfile builder, set Dockerfile path to /server/Dockerfile, healthcheck to /api/health and maximum restart retries to 3. Configure these in Railway settings: new services can no longer opt into its deprecated railway.json mechanism. The Dockerfile installs production dependencies and runs as a non-root user. Add a PostgreSQL service and reference its private DATABASE_URL from the API service.

Required variables: NODE_ENV=production, HOST=0.0.0.0, CLIENT_ORIGIN=https://notes.liiightwave.com, RESEND_API_KEY, MAIL_FROM, GENERATION_MODE=openai, OPENAI_API_KEY. Use a verified sender for MAIL_FROM. Keep all credentials in Railway variables. Never put credentials in source files, frontend variables or chat. Optional OPENAI_MODEL defaults to gpt-4.1-mini. Generation quotas default to 20 per user and 200 globally per day; configure lower values for a small initial rollout.

Database migrations run transactionally on startup. The health endpoint is /api/health. Legacy ownerless notes remain inaccessible; reassignment requires a deliberate verified migration. Take a backup before schema changes and configure recurring backups with a tested restore before accepting real users.

## Netlify frontend

Build at the repository root, publish dist, and set API_ORIGIN to the API's HTTPS Railway origin. netlify.toml builds a same-origin /api proxy so session cookies work without third-party cookies. Missing or invalid API_ORIGIN fails the deployment. Production uses notes.liiightwave.com with HTTPS. If another site origin is intentionally supported, add it to the API's exact ADDITIONAL_ORIGINS allowlist.

## Operations

The approved Railway workspace compute cap is $20 with an alert at $15. It affects every app in that workspace. Email, OpenAI and any separately billed services require their own spending controls. Monitor health, failed email delivery, generation failures and backup completion. Do not log tokens, request bodies or credentials. The code expires sessions and keeps security events for 90 days. Publish the actual operator's contact and privacy terms before public onboarding.
