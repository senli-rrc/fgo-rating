-- Supabase Database Setup for FGO Rating App

-- Create servants table
-- Store most servant data in JSONB to avoid complex schema for nested skills/NPs
CREATE TABLE IF NOT EXISTS public.servants (
    id BIGINT PRIMARY KEY,
    "collectionNo" INT NOT NULL,
    name TEXT NOT NULL,
    "className" TEXT NOT NULL,
    rarity INT NOT NULL,
    face TEXT,
    data JSONB, -- Store skills, NPs, images, traits, etc. here
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table for user data
-- Links to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    "servantId" BIGINT REFERENCES servants(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 1 AND score <= 10),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("userId", "servantId")
);

-- Create replies table for nested comments on ratings
CREATE TABLE IF NOT EXISTS public.replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ratingId" UUID REFERENCES ratings(id) ON DELETE CASCADE,
    "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create light_ups table for likes/upvotes on ratings
CREATE TABLE IF NOT EXISTS public.light_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ratingId" UUID REFERENCES ratings(id) ON DELETE CASCADE,
    "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("ratingId", "userId") -- Each user can only light up a rating once
);

-- Create wars table for main quest/story chapters (optional)
CREATE TABLE IF NOT EXISTS public.wars (
    id BIGINT PRIMARY KEY,
    age TEXT,
    name TEXT NOT NULL,
    "longName" TEXT,
    banner TEXT,
    "headerImage" TEXT,
    priority INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_servants_collection ON servants("collectionNo");
CREATE INDEX IF NOT EXISTS idx_servants_class ON servants("className");
CREATE INDEX IF NOT EXISTS idx_servants_rarity ON servants(rarity);
CREATE INDEX IF NOT EXISTS idx_ratings_servant ON ratings("servantId");
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings("userId");
CREATE INDEX IF NOT EXISTS idx_replies_rating ON replies("ratingId");
CREATE INDEX IF NOT EXISTS idx_replies_user ON replies("userId");
CREATE INDEX IF NOT EXISTS idx_light_ups_rating ON light_ups("ratingId");
CREATE INDEX IF NOT EXISTS idx_light_ups_user ON light_ups("userId");

-- Enable Row Level Security (RLS)
ALTER TABLE public.servants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.light_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wars ENABLE ROW LEVEL SECURITY;

-- Servants policies - public read, admin write
DROP POLICY IF EXISTS "Allow public read access on servants" ON public.servants;
CREATE POLICY "Allow public read access on servants"
ON public.servants FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow admin write access on servants" ON public.servants;
CREATE POLICY "Allow admin write access on servants"
ON public.servants FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

-- Users policies - users can read all, but only update their own
DROP POLICY IF EXISTS "Allow public read access on users" ON public.users;
CREATE POLICY "Allow public read access on users"
ON public.users FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert their own user" ON public.users;
CREATE POLICY "Users can insert their own user"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own user" ON public.users;
CREATE POLICY "Users can update their own user"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Ratings policies - public read, users manage their own
DROP POLICY IF EXISTS "Allow public read access on ratings" ON public.ratings;
CREATE POLICY "Allow public read access on ratings"
ON public.ratings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.ratings;
CREATE POLICY "Users can insert their own ratings"
ON public.ratings FOR INSERT
WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update their own ratings" ON public.ratings;
CREATE POLICY "Users can update their own ratings"
ON public.ratings FOR UPDATE
USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.ratings;
CREATE POLICY "Users can delete their own ratings"
ON public.ratings FOR DELETE
USING (auth.uid() = "userId");

-- Replies policies - public read, users manage their own
DROP POLICY IF EXISTS "Allow public read access on replies" ON public.replies;
CREATE POLICY "Allow public read access on replies"
ON public.replies FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert their own replies" ON public.replies;
CREATE POLICY "Users can insert their own replies"
ON public.replies FOR INSERT
WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update their own replies" ON public.replies;
CREATE POLICY "Users can update their own replies"
ON public.replies FOR UPDATE
USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can delete their own replies" ON public.replies;
CREATE POLICY "Users can delete their own replies"
ON public.replies FOR DELETE
USING (auth.uid() = "userId");

-- Light ups policies - public read, users manage their own
DROP POLICY IF EXISTS "Allow public read access on light_ups" ON public.light_ups;
CREATE POLICY "Allow public read access on light_ups"
ON public.light_ups FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert their own light_ups" ON public.light_ups;
CREATE POLICY "Users can insert their own light_ups"
ON public.light_ups FOR INSERT
WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can delete their own light_ups" ON public.light_ups;
CREATE POLICY "Users can delete their own light_ups"
ON public.light_ups FOR DELETE
USING (auth.uid() = "userId");

-- Wars policies - public read, admin write
DROP POLICY IF EXISTS "Allow public read access on wars" ON public.wars;
CREATE POLICY "Allow public read access on wars"
ON public.wars FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow admin write access on wars" ON public.wars;
CREATE POLICY "Allow admin write access on wars"
ON public.wars FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

-- Grant permissions
GRANT SELECT ON public.servants TO anon, authenticated;
GRANT SELECT ON public.users TO anon, authenticated;
GRANT SELECT ON public.ratings TO anon, authenticated;
GRANT SELECT ON public.replies TO anon, authenticated;
GRANT SELECT ON public.light_ups TO anon, authenticated;
GRANT SELECT ON public.wars TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.replies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.light_ups TO authenticated;

-- ============================================
-- DEBUG: Create Admin Account
-- ============================================
-- After signing up through Supabase Auth, run this to make a user an admin:
-- UPDATE public.users SET role = 'ADMIN' WHERE email = 'your-email@example.com';

-- Or create a trigger to automatically make the first user an admin:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE
      WHEN (SELECT COUNT(*) FROM public.users) = 0 THEN 'ADMIN'
      ELSE 'USER'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
