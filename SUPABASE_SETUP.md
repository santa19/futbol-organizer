# Supabase Setup Guide

## Quick Fix for Current Error

The error you're seeing is because the database tables don't exist in your Supabase project yet. Follow these steps:

### Step 1: Create Tables in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire contents of `supabase-schema.sql` file
6. Paste it into the SQL editor
7. Click "Run" or press Ctrl+Enter

This will create all the required tables:
- `users`
- `matches`
- `participants`
- `reset_tokens`
- `waitlist`

### Step 2: Verify Environment Variables

Make sure your deployment (Render) has these environment variables set:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SESSION_SECRET=your-session-secret
PORT=10000
```

You can find your Supabase URL and anon key in:
- Supabase Dashboard → Settings → API

### Step 3: Redeploy

After creating the tables, trigger a new deployment on Render. The app should now start successfully.

## Understanding the Migration

Your app was previously using:
- SQLite (local development)
- PostgreSQL via `pg` library (production)

Now it uses:
- Supabase (both development and production)

The `db-supabase.js` file has been updated to:
1. Remove the incorrect `conversations` table references
2. Verify that the correct tables exist on startup
3. Provide helpful error messages if tables are missing

## Optional: Enable Row Level Security (RLS)

For better security, you can enable RLS in Supabase:

1. Go to Supabase Dashboard → Authentication → Policies
2. Enable RLS for each table
3. Create policies based on your security requirements

The `supabase-schema.sql` file includes commented-out examples of RLS policies.

## Troubleshooting

### Error: "Could not find the table 'public.X' in the schema cache"

This means the table doesn't exist. Run the SQL from `supabase-schema.sql`.

### Error: "SUPABASE_URL y SUPABASE_ANON_KEY son requeridas"

Set the environment variables in your deployment platform.

### Tables exist but queries fail

Check that:
1. The Supabase anon key has the correct permissions
2. RLS is disabled OR you have the correct policies set up
3. The table schema matches what's expected (check column names and types)

## Development vs Production

For local development, you can either:
1. Use the same Supabase project (recommended for simplicity)
2. Create a separate Supabase project for development
3. Use Supabase local development: https://supabase.com/docs/guides/cli/local-development

Set your environment variables in a `.env` file for local development:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SESSION_SECRET=your-secret-here
PORT=3000
```

Then use `npm run dev` to start the server.

