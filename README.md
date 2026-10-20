# Learning Engine consent pages (dev and prod)

Static Supabase OAuth login and consent UI, hosted on GitHub Pages. Public configuration only; never add passwords, service-role keys or personal access tokens.

- Dev page (repository root): project `lchqaaapvdthqkukpksm` (Frankfurt), Authorization Path `/learning-engine-auth/`.
- Prod page (`prod/`): project `tuyrksrubpqycosozawu` (Frankfurt), Authorization Path `/learning-engine-auth/prod/`.
- Each `index.html` names its project in `le-env`, `le-supabase-url` and `le-publishable-key` meta tags and allows only that URL in its CSP `connect-src`; the shared `app.js` refuses to start without a valid configuration.
- Pinned client SDK: `@supabase/supabase-js` 2.117.3, vendored UMD distribution; npm package SHA-512 integrity checked during setup.
- Publish `main`, repository root. Expected URLs: `https://jiricekkk.github.io/learning-engine-auth/` and `…/learning-engine-auth/prod/`.
- Supabase Site URL (both projects): `https://jiricekkk.github.io`.
- The page requires the `authorization_id` issued by Supabase. A direct visit intentionally shows instructions without a login form.
- Existing accounts only; no sign-up UI. Client-supplied names/scopes are rendered as text. Passwords are cleared after submission. Sessions use tab-scoped sessionStorage. No third-party scripts, analytics or remote client logos.
- The access decision is sent through the authenticated Supabase SDK. Only server-returned HTTPS (or loopback HTTP) callbacks are followed.

Validation: `node --test tests/consent.test.cjs` (behaviour and per-page configuration); live login, approve/deny, connector and token-refresh tests still require a deployed MCP function and an owner-authenticated flow.
