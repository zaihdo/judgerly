# Judgerly

A full-stack competition judging app built with React + Vite + Supabase.

## Local Dev Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```
   cp .env.example .env
   ```
3. Fill in the values:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Install dependencies:
   ```
   npm install
   ```
5. Start the dev server:
   ```
   npm run dev
   ```

## Netlify Deploy

1. Connect your GitHub repo to Netlify
 Environment variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy. The `netlify.toml` handles the build command (`npm run build`) and SPA redirects.

## App Usage Flow

### 1. Organizer Setup (`/`)
- Create a competition with a name and judge password
- Add categories (e.g., Quran, Hadeeth)
- Under each category, add tracks (levels) with custom scoring criteria and weights
- Under each track, add participant names
- Copy the Competition ID to share with judges

### 2. Judge Entry (`/judge`)
- Judges enter their name and the competition password
- Credentials are validated against Supabase
- Redirects to the scoring page on success

### 3. Scoring (`/judge/:competitionId`)
- Select a category and track
- See all participants; already-scored ones show a 
- Click a participant to open the scoring form with sliders (10, step 0.5) per criterion0
- Live weighted total updates as you adjust sliders
- Submit/Update  auto-advances to the next unscored participantscores 

### 4. Results (`/results/:competitionId`)
- Enter the competition password to view results
- Leaderboard shows ranked participants with average score and judge count
- Per-judge breakdown table shows individual scores
- Real-time updates via Supabase Realtime

## Seed Script

To populate the database with sample competition data:

```bash
node seed.js
```

Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`) in your `.env` file.
