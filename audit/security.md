# Habit Tracker — Security Audit & Threat Model

This document details the security posture of the Habit Tracker application, evaluating it against the **OWASP Top 10** standard, inspecting database Row Level Security (RLS), authentication safeguards, secrets separation, and dependency supply chain hygiene.

---

## 1. OWASP Top 10 Evaluation

| OWASP Risk Category | Application Status | Evaluation & Mitigations in Place |
| :--- | :---: | :--- |
| **A01: Broken Access Control** | **SECURE** | Strict Row Level Security (RLS) on all PostgreSQL tables + secondary server-action tenant validation (`.eq("user_id", user.id)`). |
| **A02: Cryptographic Failures** | **SECURE** | HTTPS enforced via HSTS headers. Sensitive auth tokens and sessions handled through Supabase Auth (PKCE flow, secure HTTP-only cookies). |
| **A03: Injection** | **SECURE** | All database queries use Supabase PostgREST parameterized queries. Stored procedures use explicit `set search_path = ''` to prevent search-path injection. |
| **A04: Insecure Design** | **SECURE** | Principle of least privilege enforced across database grants (`revoke from public; grant to authenticated`). Open-redirect guards in auth callback. |
| **A05: Security Misconfiguration**| **SECURE** | Security headers configured (`HSTS`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`). Production source maps disabled. |
| **A06: Vulnerable Components** | **SECURE** | Runtime dependencies verified clean. Build tools isolated in `devDependencies`. Unused packages purged. |
| **A07: Identification & Auth** | **SECURE** | Supabase Auth provides password hashing (bcrypt/argon2), rate limiting on sign-in, email verification OTP tokens, and secure password reset. |
| **A08: Software & Data Integrity**| **SECURE** | Package lockfile integrity hashes verified. No unsafe `eval()` or unvalidated dynamic scripts loaded. |
| **A09: Logging & Monitoring** | **SECURE** | Structured logger implemented with automatic redaction of credentials, API keys, passwords, and tokens. Process-level unhandled rejection traps. |
| **A10: SSRF** | **SECURE** | No user-controlled outgoing URL fetching. Server requests are restricted to official Supabase and Google Gemini API endpoints. |

---

## 2. Database & Row Level Security (RLS) Audit

Every table in the database schema has Row Level Security enabled. The application implements **two-layer defense-in-depth**:
1. **Layer 1 (Database Engine):** PostgreSQL RLS policies restrict all `SELECT`, `INSERT`, `UPDATE`, and `DELETE` commands to rows where `user_id = auth.uid()`.
2. **Layer 2 (Application Server):** Next.js Server Actions extract and verify `auth.getUser()`, binding queries with `.eq("user_id", user.id)` before sending them to the database.

### Table-by-Table Policy Audit:

#### `public.habits`
- **RLS Status:** ENABLED.
- **Policies:**
  - `habits select own`: `using (user_id = (select auth.uid()))`
  - `habits insert own`: `with check (user_id = (select auth.uid()))`
  - `habits update own`: `using (user_id = (select auth.uid()))`
  - `habits delete own`: `using (user_id = (select auth.uid()))`

#### `public.habit_logs`
- **RLS Status:** ENABLED.
- **Policies:**
  - `habit_logs select own`: `using (user_id = (select auth.uid()))`
  - `habit_logs insert own`: `with check (user_id = (select auth.uid()))`
  - `habit_logs update own`: `using (user_id = (select auth.uid()))`
  - `habit_logs delete own`: `using (user_id = (select auth.uid()))`

#### `public.profiles`
- **RLS Status:** ENABLED.
- **Policies:**
  - `profiles select own`: `using (id = (select auth.uid()))`
  - `profiles update own`: `using (id = (select auth.uid()))`
  - Unique username index: `profiles_username_lower_idx` prevents duplicate registrations.

#### `public.weekly_reviews`
- **RLS Status:** ENABLED.
- **Policies:**
  - `weekly_reviews select own`: `using (user_id = (select auth.uid()))`
  - `weekly_reviews insert own`: `with check (user_id = (select auth.uid()))`

#### `public.user_achievements`
- **RLS Status:** ENABLED.
- **Policies:**
  - `achievements select own`: `using (user_id = (select auth.uid()))`
  - `achievements insert own`: `with check (user_id = (select auth.uid()))`

#### Storage Bucket: `avatars`
- **RLS Status:** ENABLED on `storage.objects`.
- **Policy Enforcement:** Users may only write and delete files where the root folder matches their user ID: `(storage.foldername(name))[1] = (select auth.uid())::text`.
- **File Limits:** 2 MB maximum upload limit; MIME types restricted to `image/png`, `image/jpeg`, and `image/webp`.

---

## 3. Stored Procedures & Function Security

In [supabase/migrations/012_consolidated_recent_updates.sql](file:///d:/habit_tracker/supabase/migrations/012_consolidated_recent_updates.sql), all functions are hardened:

### `delete_user_account()`
```sql
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = uid;
end;
$$;
revoke execute on function public.delete_user_account() from public, anon;
grant execute on function public.delete_user_account() to authenticated;
```
- **Security Check:** Prevents privilege escalation by setting `search_path = ''`.
- **Execution Permission:** Revoked from `public` and `anon`; granted strictly to `authenticated`.

---

## 4. Authentication & Open Redirect Defense

The authentication callback handler at [src/app/auth/callback/route.ts](file:///d:/habit_tracker/src/app/auth/callback/route.ts) exchanges PKCE codes and validates email OTP tokens.

### Open-Redirect Defense Implementation:
To prevent attackers from crafting phishing links like `https://habittracker.app/auth/callback?code=xxx&next=//attacker.com`, the URL is sanitized before redirection:
- Rejects protocol-relative URLs (`//evil.com`).
- Rejects Windows/UNC backslash escape sequences (`/\evil.com`, `\\evil.com`).
- Rejects carriage return / line feed injection (`\r\n`).
- Rejects null bytes (`\0`).
- Rejects external URI schemes (`javascript:`, `data:`, `https:`).
- Defaults safely to `/dashboard`.

---

## 5. Secret Management & Environmental Isolation

- **Secret Scanning:** Codebase was scanned for raw API keys, bearer tokens, and private database credentials. Zero production secrets exist in the repository.
- **Client vs Server Boundary:**
  - Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed to the browser bundle (designed to be public by Supabase architecture).
  - `GEMINI_API_KEY` is strictly server-only and accessed exclusively inside server actions and backend routes.
- **Structured Log Redaction:**
  The logging utility [src/lib/logger.ts](file:///d:/habit_tracker/src/lib/logger.ts) automatically masks sensitive keys matching `/password|token|secret|api_?key|auth|bearer|cookie|credential|credit_?card/i` with `[REDACTED]`.

---

## 6. HTTP Security Headers

The following response headers are configured in [next.config.ts](file:///d:/habit_tracker/next.config.ts) and verified on all routes:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
X-DNS-Prefetch-Control: on
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
