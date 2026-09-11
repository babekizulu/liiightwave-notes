# LiiiGHTNOTES production review

## Initial findings

The existing React/Vite/SCSS application had a working note editor and structured AI generation worker, but all API routes were anonymous. Notes had no account ownership column. Registration and sign-in components were placeholders. Persistent embedded storage and demo seed data were appropriate for local development, not a multi-user public service. There were no persistent authentication sessions, verified email, recovery, CSRF protection, request quotas, deploy configuration or account export/deletion workflow.

## Implemented controls

- Registration, verified email, sign-in, sign-out, session revocation, forgotten-password recovery and account deletion with password reauthentication.
- Scrypt password hashing (N=131072,r=8,p=1), random salts, bounded hashing concurrency, 15–128 character passphrases, no composition rules, password manager/paste support, breached-password checks using hash-prefix queries.
- Opaque 256-bit sessions stored only as SHA-256 digests; production Secure/HttpOnly/SameSite=Lax host-only cookies. Seven-day absolute and 24-hour idle expiry. Session rotation at sign-in and revocation on password reset. Ten-session cap.
- Session CSRF token and a required custom request header, exact origin allowlist, no-store API responses, security response headers, generic errors, no secret-bearing logs.
- Every note operation checks authenticated ownership, including job status and generation. Existing ownerless notes remain inaccessible to registered users until a deliberate migration.
- Atomic database-backed throttling across replicas. Default 20 generations per account per day and 200 globally. 200 notes per account, 20,000 characters per note, output and generation-time limits.
- PostgreSQL required for production; production startup rejects absent email delivery configuration and missing AI credentials in OpenAI mode. No production demo seeding. Graceful shutdown and scheduled cleanup.
- Netlify same-origin API proxy, strict content security policy, HTTPS response protections, Railway container/health check and CI checks. No credentials in frontend bundles.
- Account export and deletion; security event retention of 90 days. In-app data-use explanation and explicit AI-generation action.

## Verification targets

Security work uses [OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/) and the [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) as references. Accessibility targets [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/). Automated checks do not constitute an independent penetration test, legal compliance assessment or complete accessibility certification.

The required release evidence includes backend tests, browser account/note flows, automated accessibility checks, keyboard and reflow checks, dependency audit, PostgreSQL production checks, real verification/recovery email delivery, AI generation, database backup/restore and live HTTPS/cookie/ownership verification. Record actual results separately; do not treat this list as a statement that all checks have passed.

## Deployment topology

The existing GitHub repository `babekizulu/liiightwave-notes` contains the frontend at its root. The backend will be added under `server/`. Netlify retains root build/publish settings; Railway uses root directory `/server`. Netlify's `API_ORIGIN` generates the proxy rules. The backend's `CLIENT_ORIGIN` is `https://notes.liiightwave.com`; any additional canonical site origin must be listed explicitly.

Required backend variables: `NODE_ENV=production`, `DATABASE_URL` (Railway private PostgreSQL reference), `CLIENT_ORIGIN`, `RESEND_API_KEY`, `MAIL_FROM` (verified sender), `GENERATION_MODE=openai`, `OPENAI_API_KEY`. Optional: `OPENAI_MODEL`, `DAILY_GENERATIONS`, `GLOBAL_DAILY_GENERATIONS`. Secrets belong in Railway variables, never Git or Netlify frontend build variables.

## Operational release requirements

Confirm email provider and verified sender domain, approved hosting spend, AI project budget limits, PostgreSQL backups and restore evidence, alert delivery, and a support contact. Review privacy disclosures and applicable legal requirements with the actual operator and jurisdiction. No owner or legal entity has been invented. Infrastructure backup retention must be documented after it is configured.

Deployment references: [Railway monorepos](https://docs.railway.com/deployments/monorepo), [PostgreSQL backup and restore](https://docs.railway.com/guides/postgres-backups-restores), [Netlify proxies](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/).
