# Habit Tracker

A habit tracking web application to manage habits, log daily check-ins, track statistics, earn achievements, and generate AI weekly reviews.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui (base-nova)
- Supabase (PostgreSQL with Row Level Security, Auth, Storage)
- Zod
- Recharts

## Features

- **Today week sheet**: 7-day checklist with optimistic toggle check-ins, local day calculation, and streak tracking.
- **Habit detail page with history editing**: Performance statistics, 90-day weekday breakdown, 53-week consistency heatmap, and an interactive month calendar grid for toggling past completions.
- **Drag-to-reorder**: Drag-and-drop habit sorting with persisted ordering in the database.
- **Analytics**: 7, 30, and 90-day completion rate metrics, perfect days, total check-ins, completion over time line chart, per-habit breakdown, and weekday bars.
- **Achievements**: Milestone tracking for streaks, total completions, and consistency with a dedicated achievements view.
- **Profile with time zone and photo**: Profile photo upload to Supabase Storage, display name, and IANA time zone configuration.
- **AI weekly review**: Weekly summary generated from user statistics via Google Gemini, cached in the database, with up to 2 regenerations per week.

## Demo Mode

The application supports an instant one-click demo for visitors:
- **What it does**: Seeds 6 sample habits with ~90 days of check-in history so users can explore the Today sheet, heatmaps, analytics, and achievements without signing up.
- **Supabase anonymous sign-ins**: Built on Supabase anonymous authentication. Anonymous sign-ins must be enabled in the Supabase Dashboard under **Authentication > Sign In / Providers > Anonymous sign-ins**.
- **Migration**: Requires `supabase/migrations/008_demo.sql` (defines the `seed_demo_data()` RPC function and blocks avatar uploads for anonymous users).
- **Cleanup**: Demo accounts are temporary and can be cleaned up periodically by running:
  ```sql
  delete from auth.users where is_anonymous is true and created_at < now() - interval '7 days';
  ```
- **CAPTCHA recommendation**: Setting up a CAPTCHA provider (such as Cloudflare Turnstile) in Supabase Auth is recommended before a public launch to protect against automated abuse.

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd habit-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env.local` and fill in the variables:
   ```bash
   cp .env.example .env.local
   ```

4. Run the SQL files in `supabase/` in order in your Supabase SQL editor:
   - `supabase/schema.sql` (base tables: `profiles`, `habits`, `habit_logs`, indexes, RLS policies, and new-user trigger)
   - `supabase/migrations/002_profile.sql` (adds `full_name`, `avatar_path`, `timezone` to `profiles`, and creates `avatars` storage bucket + policies)
   - `supabase/migrations/003_habit_order.sql.sql` (adds `sort_order` to `habits`, index, and `reorder_habits` function)
   - `supabase/migrations/004_achievements.sql.sql` (creates `user_achievements` table and RLS policies)
   - `supabase/migrations/006_weekly_reviews.sql` (creates `weekly_reviews` table and RLS policies)
   - `supabase/migrations/008_demo.sql` (creates `seed_demo_data` RPC function and avatar storage policy for demo accounts)

   *(Note: Migration `005` for username and email-code feature is not applied yet, only needed for the sign-up username and OTP feature that is not built yet).*

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public (client and server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key | Public (client and server) |
| `NEXT_PUBLIC_SITE_URL` | Site URL (optional locally, set to the live URL once deployed) | Public (client and server) |
| `GEMINI_API_KEY` | Google Gemini API key | Secret (server-only, never exposed to client) |
| `GEMINI_MODEL` | Gemini model name (default: `gemini-3.5-flash-lite`) | Server-only |

> Note: Habit names and weekly numbers are sent to Google's Gemini API for the weekly review.

## Known Limitations

- No email verification or password reset yet.
- Only the first 7 days are shown on the Today sheet.
- The page does not roll over at midnight if left open.
