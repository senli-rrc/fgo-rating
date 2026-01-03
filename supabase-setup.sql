-- Supabase Database Setup for FGO Rating App

-- Create separate servant tables for each server region
-- Store most servant data in JSONB to avoid complex schema for nested skills/NPs

-- JP Server Servants
CREATE TABLE IF NOT EXISTS public.servants_jp (
    id BIGINT PRIMARY KEY,
    "collectionNo" INT NOT NULL,
    name TEXT NOT NULL,
    "originalName" TEXT,
    "className" TEXT NOT NULL,
    rarity INT NOT NULL CHECK (rarity >= 0 AND rarity <= 5),
    face TEXT,
    attribute TEXT,
    "atkMax" INT,
    "hpMax" INT,
    "atkBase" INT,
    "hpBase" INT,
    cost INT,
    "averageScore" DECIMAL(4, 2) DEFAULT 0.00,
    data JSONB, -- Store skills, NPs, images, traits, cards, profile, etc. here
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CN Server Servants
CREATE TABLE IF NOT EXISTS public.servants_cn (
    id BIGINT PRIMARY KEY,
    "collectionNo" INT NOT NULL,
    name TEXT NOT NULL,
    "originalName" TEXT,
    "className" TEXT NOT NULL,
    rarity INT NOT NULL CHECK (rarity >= 0 AND rarity <= 5),
    face TEXT,
    attribute TEXT,
    "atkMax" INT,
    "hpMax" INT,
    "atkBase" INT,
    "hpBase" INT,
    cost INT,
    "averageScore" DECIMAL(4, 2) DEFAULT 0.00,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EN Server Servants
CREATE TABLE IF NOT EXISTS public.servants_en (
    id BIGINT PRIMARY KEY,
    "collectionNo" INT NOT NULL,
    name TEXT NOT NULL,
    "originalName" TEXT,
    "className" TEXT NOT NULL,
    rarity INT NOT NULL CHECK (rarity >= 0 AND rarity <= 5),
    face TEXT,
    attribute TEXT,
    "atkMax" INT,
    "hpMax" INT,
    "atkBase" INT,
    "hpBase" INT,
    cost INT,
    "averageScore" DECIMAL(4, 2) DEFAULT 0.00,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);



-- Create users table for user data
-- Links to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add status column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'users'
                   AND column_name = 'status') THEN
        ALTER TABLE public.users ADD COLUMN status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED'));
    END IF;
END $$;

-- Create ratings table
-- Ratings are tied to collection_no and server, not servant id
-- This allows users to rate the same servant on different servers
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES public.users(id) ON DELETE CASCADE,
    "collectionNo" INT NOT NULL,
    server TEXT NOT NULL CHECK (server IN ('JP', 'CN', 'EN')),
    score INT NOT NULL CHECK (score >= 1 AND score <= 10),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("userId", "collectionNo", server)
);

-- Create replies table for nested comments on ratings
CREATE TABLE IF NOT EXISTS public.replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ratingId" UUID REFERENCES ratings(id) ON DELETE CASCADE,
    "userId" UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create light_ups table for likes/upvotes on ratings
CREATE TABLE IF NOT EXISTS public.light_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ratingId" UUID REFERENCES ratings(id) ON DELETE CASCADE,
    "userId" UUID REFERENCES public.users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_servants_jp_collection ON servants_jp("collectionNo");
CREATE INDEX IF NOT EXISTS idx_servants_jp_class ON servants_jp("className");
CREATE INDEX IF NOT EXISTS idx_servants_jp_rarity ON servants_jp(rarity);
CREATE INDEX IF NOT EXISTS idx_servants_jp_average_score ON servants_jp("averageScore");
CREATE INDEX IF NOT EXISTS idx_servants_cn_collection ON servants_cn("collectionNo");
CREATE INDEX IF NOT EXISTS idx_servants_cn_class ON servants_cn("className");
CREATE INDEX IF NOT EXISTS idx_servants_cn_rarity ON servants_cn(rarity);
CREATE INDEX IF NOT EXISTS idx_servants_cn_average_score ON servants_cn("averageScore");
CREATE INDEX IF NOT EXISTS idx_servants_en_collection ON servants_en("collectionNo");
CREATE INDEX IF NOT EXISTS idx_servants_en_class ON servants_en("className");
CREATE INDEX IF NOT EXISTS idx_servants_en_rarity ON servants_en(rarity);
CREATE INDEX IF NOT EXISTS idx_servants_en_average_score ON servants_en("averageScore");
CREATE INDEX IF NOT EXISTS idx_ratings_collection_server ON ratings("collectionNo", server);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings("userId");
CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_rating ON replies("ratingId");
CREATE INDEX IF NOT EXISTS idx_replies_user ON replies("userId");
CREATE INDEX IF NOT EXISTS idx_light_ups_rating ON light_ups("ratingId");
CREATE INDEX IF NOT EXISTS idx_light_ups_user ON light_ups("userId");
CREATE INDEX IF NOT EXISTS idx_wars_priority ON wars(priority);

-- Enable Row Level Security (RLS)
ALTER TABLE public.servants_jp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servants_cn ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servants_en ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.light_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wars ENABLE ROW LEVEL SECURITY;

-- Servants policies - public read, admin write (for all three tables)
DROP POLICY IF EXISTS "Allow public read access on servants_jp" ON public.servants_jp;
CREATE POLICY "Allow public read access on servants_jp"
ON public.servants_jp FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow admin write access on servants_jp" ON public.servants_jp;
CREATE POLICY "Allow admin write access on servants_jp"
ON public.servants_jp FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

DROP POLICY IF EXISTS "Allow public read access on servants_cn" ON public.servants_cn;
CREATE POLICY "Allow public read access on servants_cn"
ON public.servants_cn FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow admin write access on servants_cn" ON public.servants_cn;
CREATE POLICY "Allow admin write access on servants_cn"
ON public.servants_cn FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

DROP POLICY IF EXISTS "Allow public read access on servants_en" ON public.servants_en;
CREATE POLICY "Allow public read access on servants_en"
ON public.servants_en FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow admin write access on servants_en" ON public.servants_en;
CREATE POLICY "Allow admin write access on servants_en"
ON public.servants_en FOR ALL
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
GRANT SELECT ON public.servants_jp TO anon, authenticated;
GRANT SELECT ON public.servants_cn TO anon, authenticated;
GRANT SELECT ON public.servants_en TO anon, authenticated;
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
-- Functions and Triggers
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ratings.updated_at
DROP TRIGGER IF EXISTS update_ratings_updated_at ON public.ratings;
CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update servant average score (for multi-server architecture)
CREATE OR REPLACE FUNCTION public.update_servant_average_score()
RETURNS TRIGGER AS $$
DECLARE
  srv TEXT;
  coll_no INT;
BEGIN
  -- Get values
  srv := COALESCE(NEW.server, OLD.server);
  coll_no := COALESCE(NEW."collectionNo", OLD."collectionNo");
  
  -- Update the appropriate servant table based on server
  IF srv = 'JP' THEN
    UPDATE public.servants_jp
    SET "averageScore" = (
      SELECT COALESCE(ROUND(AVG(score)::numeric, 2), 0)
      FROM public.ratings
      WHERE "collectionNo" = coll_no AND server = 'JP'
    )
    WHERE "collectionNo" = coll_no;
  ELSIF srv = 'CN' THEN
    UPDATE public.servants_cn
    SET "averageScore" = (
      SELECT COALESCE(ROUND(AVG(score)::numeric, 2), 0)
      FROM public.ratings
      WHERE "collectionNo" = coll_no AND server = 'CN'
    )
    WHERE "collectionNo" = coll_no;
  ELSIF srv = 'EN' THEN
    UPDATE public.servants_en
    SET "averageScore" = (
      SELECT COALESCE(ROUND(AVG(score)::numeric, 2), 0)
      FROM public.ratings
      WHERE "collectionNo" = coll_no AND server = 'EN'
    )
    WHERE "collectionNo" = coll_no;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate servant average on rating insert/update/delete
DROP TRIGGER IF EXISTS update_servant_score_on_rating_change ON public.ratings;
CREATE TRIGGER update_servant_score_on_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_servant_average_score();

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
