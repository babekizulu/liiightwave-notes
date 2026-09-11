# Deployment status — September 11, 2026

Release branch: `production/accounts-security` in `babekizulu/liiightwave-notes`.

The hosted [verification workflow](https://github.com/babekizulu/liiightwave-notes/actions/runs/34626810424) passed frontend lint/build, 15 backend tests and both production dependency audits for commit eeb9729. Local browser verification found zero automated accessibility violations across 14 views, with no browser console errors.

## Infrastructure

- Railway project LiiiGHTNOTES: `5729e35a-a303-43b2-aea6-6c9dcead0b1c`.
- PostgreSQL service is online: `3a2fbbe5-8719-4998-82e3-254c53e32d96`.
- API service exists: `c9a4f047-f72c-4eff-8cde-fd5cb34d9e2b`. Source, branch, build path, healthcheck, restart policy and private database reference are staged; deployment has not been applied.
- Workspace compute cap saved at $20; warning at $15. This affects the pre-existing unrelated service as approved. API-specific replica limits have not been saved.
- Existing Netlify project liiightnotes retains its current production deployment. Primary domain notes.liiightwave.com has an active HTTPS certificate. No API_ORIGIN or production branch change has been applied.

## Required next steps

1. Revoke the OpenAI key previously exposed in the example environment file and enter a replacement directly in Railway as OPENAI_API_KEY.
2. Confirm email provider and verified sender. The implementation currently uses RESEND_API_KEY and MAIL_FROM. Enter secrets directly in Railway; never commit or paste them into chat.
3. Save production configuration after credentials are ready. Automatic approval review rejected the earlier settings submission because required credentials were missing and startup would fail. Do not bypass that prerequisite by deploying a demo mode or placeholder credentials.
4. Deploy API, verify PostgreSQL migrations and health, generate its HTTPS domain, and set Netlify API_ORIGIN.
5. Verify real delivery and token redemption for registration/recovery, authenticated note ownership, secure cookies through the Netlify proxy and live AI generation.
6. Configure database backups and verify restore, then publish the frontend release and run live smoke checks. Confirm operator contact and applicable privacy terms before opening public registration.

This is a tested release candidate, not a declaration of completed production deployment or compliance certification.
