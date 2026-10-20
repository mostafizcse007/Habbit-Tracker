# Habit Tracker — Audit Findings & Remediations

This document logs every finding discovered during the pre-deployment audit, including severity, affected component, evidence, root cause, remediation applied, and retest verification result.

---

## Severity Classification
- **P0 / Critical:** Immediate security compromise, catastrophic data loss, or release blocker.
- **P1 / High:** Major security vulnerability, potential unauthorized data access, or core functionality breakdown.
- **P2 / Medium:** Significant defect, missing resilience/observability control, or regulatory gap with workarounds.
- **P3 / Low:** Minor defect, accessibility defect, or performance/hygiene improvement.

---

## Summary of Findings

| ID | Title | Severity | Status | Retest Verification |
| :--- | :--- | :---: | :---: | :---: |
| **SEC-01** | Missing Defense-in-Depth Tenant Scoping in Server Actions | P1 | **FIXED** | PASS (Code inspection & action verification) |
| **SEC-02** | Potential Open Redirect Vulnerability in Auth Callback | P1 | **FIXED** | PASS (Automated tests in `security-redirect.test.mjs`) |
| **REL-01** | Missing Global and Nested Route Error Boundaries | P2 | **FIXED** | PASS (Next.js build & route verification) |
| **REL-02** | Unhandled Process Rejections & Unstructured Logging | P2 | **FIXED** | PASS (Instrumentation & redaction tests) |
| **DEP-01** | Phantom Dependency & Misclassified Packages in Manifest | P2 | **FIXED** | PASS (Clean `package.json` & successful production build) |
| **REG-01** | Incomplete GDPR User Data Export (Missing Achievements) | P2 | **FIXED** | PASS (Code audit of `exportUserData`) |
| **SEC-03** | Missing Strict-Transport-Security (HSTS) Header | P3 | **FIXED** | PASS (`next.config.ts` header inspection) |
| **A11Y-01**| Missing Accessible Names and ARIA Descriptions on Buttons | P3 | **FIXED** | PASS (WAI-ARIA compliance & screen reader audit) |

---

## Detailed Findings & Remediations

### SEC-01: Missing Defense-in-Depth Tenant Scoping in Server Actions
- **Severity:** P1 (High)
- **Component:** [src/app/(app)/habits/actions.ts](file:///d:/habit_tracker/src/app/(app)/habits/actions.ts), [src/app/(app)/dashboard/actions.ts](file:///d:/habit_tracker/src/app/(app)/dashboard/actions.ts)
- **Root Cause:** Several server actions (`updateHabit`, `archiveHabit`, `deleteHabit`, `toggleHabitLog`, `saveHabitNote`) relied solely on PostgreSQL Row Level Security (RLS) without validating `auth.getUser()` or scoping queries with `.eq("user_id", user.id)` on the application server. If an administrative client or misconfigured service client executed these operations, cross-tenant modifications could occur.
- **Remediation:**
  1. Added mandatory `const { data: { user } } = await supabase.auth.getUser()` authentication check at the beginning of each action.
  2. Added `.eq("user_id", user.id)` to all `update` and `delete` query builders.
  3. Added explicit `user_id: user.id` on all record insertions.
- **Retest Result:** **PASS**. Verified all server actions reject unauthenticated calls with `"Unauthorized"` and strictly bind operations to the authenticated user ID.

---

### SEC-02: Potential Open Redirect Vulnerability in Auth Callback
- **Severity:** P1 (High)
- **Component:** [src/app/auth/callback/route.ts](file:///d:/habit_tracker/src/app/auth/callback/route.ts)
- **Root Cause:** The auth callback handler extracted `searchParams.get("next")` and performed a redirect without strict validation against protocol-relative URLs (`//attacker.com`), backslash escape tricks (`/\attacker.com`), CRLF injection, or external HTTP/HTTPS protocols.
- **Remediation:**
  Implemented a strict sanitizer `getSafeRedirectPath`:
  ```typescript
  function getSafeRedirectPath(rawNext: string | null): string {
    if (!rawNext || typeof rawNext !== "string") return "/dashboard"
    const trimmed = rawNext.trim()
    if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
      return "/dashboard"
    }
    if (/[\r\n\0]/.test(trimmed)) {
      return "/dashboard"
    }
    return trimmed
  }
  ```
- **Retest Result:** **PASS**. Verified by automated unit tests in [tests/security-redirect.test.mjs](file:///d:/habit_tracker/tests/security-redirect.test.mjs) passing all attack vectors.

---

### REL-01: Missing Global and Nested Route Error Boundaries
- **Severity:** P2 (Medium)
- **Component:** `src/app/`
- **Root Cause:** Unhandled exceptions in React Server Components or Client Components would trigger default unstyled Next.js error overlays in development and generic 500 error pages in production, causing full page unmounts and loss of user context.
- **Remediation:**
  1. Created [src/app/global-error.tsx](file:///d:/habit_tracker/src/app/global-error.tsx) with a standalone HTML/body structure and recovery action.
  2. Created [src/app/(auth)/error.tsx](file:///d:/habit_tracker/src/app/(auth)/error.tsx) providing contextual recovery for authentication workflows.
  3. Created [src/app/(app)/error.tsx](file:///d:/habit_tracker/src/app/(app)/error.tsx) allowing users to recover from application errors without losing their active session.
- **Retest Result:** **PASS**. All error boundary routes compiled into static and dynamic production bundles without hydration issues.

---

### REL-02: Unhandled Process Rejections & Unstructured Logging
- **Severity:** P2 (Medium)
- **Component:** [src/instrumentation.ts](file:///d:/habit_tracker/src/instrumentation.ts), [src/lib/logger.ts](file:///d:/habit_tracker/src/lib/logger.ts)
- **Root Cause:** Node.js process lacked global handlers for `unhandledRejection` and `uncaughtException`, risking silent thread failures or sudden container terminations in production. Logging was previously done via raw `console.log` statements without automated sensitive data redaction.
- **Remediation:**
  1. Created [src/instrumentation.ts](file:///d:/habit_tracker/src/instrumentation.ts) hooking into Next.js runtime initialization for `unhandledRejection`, `uncaughtException`, and graceful shutdown signals (`SIGTERM`, `SIGINT`).
  2. Created [src/lib/logger.ts](file:///d:/habit_tracker/src/lib/logger.ts) providing level-based logging (`info`, `warn`, `error`, `debug`) with single-line JSON formatting for production log collectors and automatic redaction of sensitive keys (`password`, `token`, `secret`, `api_key`, `authorization`, `cookie`).
- **Retest Result:** **PASS**. Automated test suite in [tests/logger-redaction.test.mjs](file:///d:/habit_tracker/tests/logger-redaction.test.mjs) verified full recursive redaction of secrets.

---

### DEP-01: Phantom Dependency & Misclassified Packages in Manifest
- **Severity:** P2 (Medium)
- **Component:** [package.json](file:///d:/habit_tracker/package.json)
- **Root Cause:**
  1. `clsx` was imported in `src/lib/utils.ts` but missing from `dependencies` in `package.json` (running as a phantom dependency hoisted by transitive packages).
  2. `shadcn` CLI tooling was placed under production `dependencies` instead of `devDependencies`.
  3. Unused package `"cn"` was declared in `dependencies`.
- **Remediation:**
  1. Added `"clsx": "^2.1.1"` to `dependencies`.
  2. Moved `"shadcn": "^4.21.4"` to `devDependencies`.
  3. Removed unused `"cn"` dependency.
  4. Added `"test": "node --test tests/**/*.test.mjs"` to scripts.
- **Retest Result:** **PASS**. Clean package resolution, no missing modules during build.

---

### REG-01: Incomplete GDPR User Data Export (Missing Achievements)
- **Severity:** P2 (Medium)
- **Component:** [src/app/(app)/profile/actions.ts](file:///d:/habit_tracker/src/app/(app)/profile/actions.ts)
- **Root Cause:** The `exportUserData` function exported `profile`, `habits`, `habit_logs`, and `weekly_reviews`, but omitted `user_achievements`, leading to an incomplete GDPR data portability export.
- **Remediation:**
  Updated `exportUserData` to query `public.user_achievements` matching `user_id` and included the records under the `user_achievements` export key.
- **Retest Result:** **PASS**. Verified data export payload contains all five user data entities.

---

### SEC-03: Missing Strict-Transport-Security (HSTS) Header
- **Severity:** P3 (Low)
- **Component:** [next.config.ts](file:///d:/habit_tracker/next.config.ts)
- **Root Cause:** The HTTP response headers in `next.config.ts` included `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`, but omitted `Strict-Transport-Security` (HSTS).
- **Remediation:**
  Added the following headers to all incoming routes in `next.config.ts`:
  ```typescript
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  }
  ```
- **Retest Result:** **PASS**. Verified headers returned during Next.js request handling.

---

### A11Y-01: Missing Accessible Names and ARIA Descriptions on Buttons
- **Severity:** P3 (Low)
- **Component:** Multiple UI components in `src/components/`
- **Root Cause:** Several icon-only buttons (such as the theme toggle, habit action triggers, and dialog close icons) lacked `aria-label` attributes, creating ambiguity for assistive screen reader users.
- **Remediation:**
  Added descriptive `aria-label` attributes:
  - Theme toggle: `"Switch to light theme"` / `"Switch to dark theme"`.
  - Habit dropdowns: `"Habit actions for [Habit Name]"`.
  - Habit notes: `"Add note for [Habit Name]"`.
  - Week sheet: Added proper `role="region"` and `aria-label="Habits tracking grid"`.
- **Retest Result:** **PASS**. Verified by accessibility review and keyboard navigation inspection.
