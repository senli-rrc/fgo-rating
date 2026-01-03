-- Migration: Fix foreign keys to reference public.users instead of auth.users
-- Run this in Supabase SQL Editor

-- Drop existing foreign key constraints
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_userId_fkey;
ALTER TABLE public.replies DROP CONSTRAINT IF EXISTS replies_userId_fkey;
ALTER TABLE public.light_ups DROP CONSTRAINT IF EXISTS light_ups_userId_fkey;

-- Add new foreign key constraints referencing public.users
ALTER TABLE public.ratings
  ADD CONSTRAINT ratings_userId_fkey
  FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.replies
  ADD CONSTRAINT replies_userId_fkey
  FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.light_ups
  ADD CONSTRAINT light_ups_userId_fkey
  FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix averageScore precision to allow values up to 10.00
ALTER TABLE public.servants ALTER COLUMN "averageScore" TYPE DECIMAL(4, 2);

-- Ensure updated_at column exists and has default
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'ratings'
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.ratings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Clean up duplicate ratings (keep only the most recent one per user+servant)
DELETE FROM public.ratings a USING public.ratings b
WHERE a.id < b.id
  AND a."userId" = b."userId"
  AND a."servantId" = b."servantId";

-- Ensure UNIQUE constraint exists on ratings
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_userId_servantId_key;
ALTER TABLE public.ratings
  ADD CONSTRAINT ratings_userId_servantId_key
  UNIQUE ("userId", "servantId");

-- Recreate the update trigger with proper handling
DROP TRIGGER IF EXISTS update_ratings_updated_at ON public.ratings;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
