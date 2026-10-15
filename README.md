# Learning Engine DEV consent page

Static Supabase OAuth login and consent UI, hosted on GitHub Pages. Public configuration only; never add passwords, service-role keys or personal access tokens.

- Supabase project: `lchqaaapvdthqkukpksm` (Frankfurt).
- Pinned client SDK: `@supabase/supabase-js` 2.117.3, vendored UMD distribution; npm package SHA-512 integrity checked during setup.
- Publish `main`, repository root. Expected URL: `https://jiricekkk.github.io/learning-engine-auth/`.
- Supabase Site URL: `https://jiricekkk.github.io`; Authorization Path: `/learning-engine-auth/`.
- The page requires the `authorization_id` issued by Supabase. A direct visit intentionally shows instructions without a login form.
- Existing accounts only; no sign-up UI. Client-supplied names/scopes are rendered as text. Passwords are cleared after submission. Sessions use tab-scoped sessionStorage. No third-party scripts, analytics or remote client logos.
- The access decision is sent through the authenticated Supabase SDK. Only server-returned HTTPS (or loopback HTTP) callbacks are followed.

Validation: syntax and behavioral checks; live login, approve/deny, connector and token-refresh tests still require a deployed MCP function and an owner-authenticated flow.
