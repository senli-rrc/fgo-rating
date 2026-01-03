# Supabase Setup Guide

This project now uses Supabase instead of IndexedDB for data persistence.

## Prerequisites

1. A Supabase account (free tier available at [supabase.com](https://supabase.com))
2. Node.js and npm installed

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Project Name**: `fgo-rating-app` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to your users
4. Click "Create new project" and wait for provisioning

## Step 2: Run Database Setup

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-setup.sql`
4. Click "Run" to execute the SQL
5. Verify all tables were created:
   - Go to **Table Editor** in the sidebar
   - You should see: `servants`, `users`, `ratings`, `replies`, `light_ups`, `wars`

## Step 3: Get API Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 4: Configure Environment Variables

1. In your project root, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important**: Never commit `.env` to git (it's already in `.gitignore`)

## Step 5: Install Dependencies

If you haven't already:
```bash
npm install
```

The `@supabase/supabase-js` package should already be installed.

## Step 6: Start Development

```bash
npm run dev
```

## Authentication Flow

### Registration
- Users sign up through Supabase Auth
- A database trigger automatically creates a user profile in the `users` table
- First user is automatically assigned `ADMIN` role

### Login
- Authentication is handled by `supabase.auth.signInWithPassword()`
- User session is managed automatically by Supabase
- User profile data is fetched from the `users` table

### Create Admin User

After the first signup, you can manually promote users to admin:

1. Go to **SQL Editor** in Supabase
2. Run:
   ```sql
   UPDATE public.users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```

Or the first user to register will automatically be an admin (via trigger).

## Database Structure

### Tables

- **servants**: Stores servant data with JSONB for complex nested data
- **users**: User profiles linked to Supabase auth.users
- **ratings**: User ratings/reviews for servants
- **replies**: Comments/replies on ratings
- **light_ups**: Likes/upvotes for ratings
- **wars**: Main quest/story chapter data

### Row Level Security (RLS)

All tables have RLS enabled with policies:
- Public read access for most data
- Authenticated users can manage their own content
- Admins have full access to servants and wars

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env` file exists in project root
- Check that variables start with `VITE_`
- Restart dev server after creating `.env`

### Authentication not working
- Verify your Supabase URL and anon key are correct
- Check Supabase dashboard → Authentication → Settings
- Ensure email confirmation is disabled for development (or check your email)

### Data not showing up
- Check browser console for errors
- Verify RLS policies allow your operation
- Check Network tab for failed API calls

### CORS errors
- Supabase should handle CORS automatically
- If issues persist, check Site URL in Authentication settings

## Migration from IndexedDB

The old IndexedDB implementation has been completely replaced. If you had data in IndexedDB:

1. Data is local only - it won't automatically transfer
2. Users will need to re-register
3. Servant data will be synced from Atlas Academy API
4. Ratings/reviews will start fresh

## Next Steps

- [ ] Set up your `.env` file
- [ ] Run the SQL setup in Supabase
- [ ] Test user registration and login
- [ ] Sync servant data from Atlas Academy
- [ ] Configure email templates in Supabase (optional)
- [ ] Set up production environment variables for deployment

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
