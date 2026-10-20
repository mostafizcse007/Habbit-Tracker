# Habit Tracker — Production Deployment & Post-Deployment Checklist

This document is the operational guide for deploying the Habit Tracker application to staging and production environments.

---

## 1. Pre-Flight Verification Checklist

Before triggering a deployment, confirm the following local checks pass:

- [x] **Git Working Tree Clean:** All modifications committed or verified.
- [x] **Dependencies Resolved:** `package.json` contains no phantom dependencies (`clsx` declared, `shadcn` in devDependencies).
- [x] **Unit & Regression Tests:** `npm test` passes with 26/26 tests successful.
- [x] **TypeScript Validation:** `npx tsc --noEmit` exits with code 0 (zero errors).
- [x] **ESLint Linting:** `npm run lint` exits with code 0 (zero warnings/errors).
- [x] **Production Compilation:** `npm run build` completes successfully.

---

## 2. Environment Variables Configuration

Set these variables in your deployment dashboard (e.g., Vercel Project Settings, Cloudflare Pages, or Docker `.env`):

| Variable Name | Required Scope | Description | Sensitive? |
| :--- | :--- | :--- | :---: |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client & Server | The URL of your Supabase project (e.g. `https://xyz.supabase.co`) | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client & Server | Supabase anonymous public API key | No (Protected by RLS) |
| `GEMINI_API_KEY` | **Server-Only** | Google Gemini Generative AI API key for smart nudges and reviews | **YES (Keep Secret)** |
| `NODE_ENV` | Server | Set to `production` | No |

> [!WARNING]
> Never set `GEMINI_API_KEY` with a `NEXT_PUBLIC_` prefix. It must remain strictly server-side.

---

## 3. Database Migration Runbook (Supabase)
- [x] **Migration 012 Applied:** Migration [supabase/migrations/012_consolidated_recent_updates.sql](file:///d:/habit_tracker/supabase/migrations/012_consolidated_recent_updates.sql) successfully executed in Supabase:
   - `tags` column & GIN index on `public.habits`.
   - `note` column (max 500 chars) on `public.habit_logs`.
   - `public.delete_user_account()` with `security definer` and restricted permissions.
   - `profiles_username_lower_idx` and `public.check_username_available()`.
   - `public.handle_new_user()` trigger for automated profile creation.

Next Supabase Dashboard verification checks:
   - Navigate to **Storage** -> **Buckets**.
   - Ensure an `avatars` bucket exists with `Public: true` and 2MB file size limit.
4. Verify **Auth Redirect URLs**:
   - Navigate to **Authentication** -> **URL Configuration**.
   - Under **Site URL**, set your production domain (e.g., `https://habittracker.example.com`).
   - Under **Redirect URLs**, add:
     - `https://habittracker.example.com/auth/callback`
     - `https://habittracker.example.com/reset-password`

---

## 4. Hosting Platform Deployment (e.g., Vercel)

1. Connect your Git repository to Vercel.
2. Select the **Next.js** framework preset.
3. Configure Environment Variables as specified in Section 2.
4. Click **Deploy**.
5. Once build completes, attach your custom production domain and verify SSL certificate issuance.

---

## 5. Post-Deployment Smoke Test Plan (Staging / Production)

Follow these steps immediately after deployment to verify live functionality:

### Test 1: User Signup & Verification
1. Navigate to `/signup`.
2. Register a new test account with a valid email.
3. Verify redirect to the verification notice screen.
4. Open the verification email and click the confirmation link.
5. Verify you are redirected to `/dashboard` (or `/login` with success confirmation).

### Test 2: Habit Creation & Reordering
1. On `/dashboard`, click **Create Habit**.
2. Fill out title, description, select a custom color, choose an icon, and add a tag (e.g., `#health`).
3. Set frequency to **Every day** and submit.
4. Verify the new habit appears in the daily list and rolling 7-day grid.
5. Drag to reorder habits and reload the page; verify the new order persists.

### Test 3: Daily Logging & Note Attachment
1. Click the checkmark to log today's completion.
2. Verify streak counter increments immediately (optimistic UI update).
3. Click the note icon on the habit, enter a note (e.g., "Completed 30 minutes in morning"), and save.
4. Reload page; verify note icon indicates an active note and displays the content on click.

### Test 4: Analytics & Achievements
1. Navigate to `/analytics`.
2. Verify completion rate card, weekday breakdown, and heatmap render without chart errors.
3. Navigate to `/achievements`.
4. Verify the **First check-in** badge is displayed as **Unlocked**.

### Test 5: Profile & GDPR Export
1. Navigate to `/profile`.
2. Update display name or username; verify update notification appears.
3. Click **Export Data (JSON)**.
4. Verify a `.json` file downloads containing `profile`, `habits`, `habit_logs`, `weekly_reviews`, and `user_achievements`.

### Test 6: Logout & Password Recovery
1. Click **Log Out** from the user dropdown; verify session terminates and redirects to `/login`.
2. Click **Forgot Password**, enter your email, and submit.
3. Verify password reset email arrives with a secure token link.

---

## 6. Rollback & Emergency Incident Plan

If a critical issue occurs post-deployment:
1. **Instant Rollback:** In the Vercel dashboard, navigate to **Deployments** and click **Promote to Production** on the previous stable build (takes < 10 seconds).
2. **Database Compatibility:** Migration `012` is non-destructive (only adds columns, indexes, and procedures), so rolling back the frontend code will not cause database schema incompatibility.
3. **Emergency Support:** Check server error logs via your log aggregator or Vercel Runtime Logs filtered by `"level": "error"`.
