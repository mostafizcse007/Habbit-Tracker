# Habit Tracker

A habit tracking web application designed to help users build routines, log daily completions, and visualize consistency over time.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui (Base UI)
- Supabase (PostgreSQL with Row Level Security & Auth)

## Features

- User authentication with email and password
- Full habit lifecycle management (create, edit, archive, delete)
- Customizable habit frequencies (by weekday) and colors
- Daily dashboard checklist computed in local browser time
- Optimistic completion toggles with server synchronization
- Streak calculations (current streak and longest streak)
- Completion rate statistics (7-day and 30-day windows)
- 7-day visual consistency history strips
- Responsive design tailored for desktop and mobile viewports

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
   Copy `.env.example` to `.env.local` and configure your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Set up the database:
   Run the SQL statements from `supabase/schema.sql` in your Supabase project's SQL editor.

5. Start the development server:
   ```bash
   npm run dev
   ```

## Known Limitations

- The page does not roll over to the new day if left open past midnight.
- Only the first 1000 logs are loaded.
- There is no password reset flow yet.
