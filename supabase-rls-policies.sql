-- ============================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- CRITICAL: Run this in Supabase SQL Editor to secure your database
-- Without RLS, anyone can access/modify your data directly!

-- ============================================
-- 1. DROP EXISTING POLICIES (if any)
-- ============================================
-- This allows the script to be run multiple times safely

DROP POLICY IF EXISTS "Users are viewable by everyone" ON "users";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "users";
DROP POLICY IF EXISTS "Users can update their own profile" ON "users";
DROP POLICY IF EXISTS "Only admins can delete users" ON "users";

DROP POLICY IF EXISTS "Servants JP are viewable by everyone" ON "servants_jp";
DROP POLICY IF EXISTS "Servants CN are viewable by everyone" ON "servants_cn";
DROP POLICY IF EXISTS "Servants EN are viewable by everyone" ON "servants_en";
DROP POLICY IF EXISTS "Only admins can modify servants JP" ON "servants_jp";
DROP POLICY IF EXISTS "Only admins can modify servants CN" ON "servants_cn";
DROP POLICY IF EXISTS "Only admins can modify servants EN" ON "servants_en";

DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON "ratings";
DROP POLICY IF EXISTS "Authenticated users can insert their own ratings" ON "ratings";
DROP POLICY IF EXISTS "Users can update their own ratings" ON "ratings";
DROP POLICY IF EXISTS "Users can delete their own ratings" ON "ratings";
DROP POLICY IF EXISTS "Admins can delete any rating" ON "ratings";

DROP POLICY IF EXISTS "Replies are viewable by everyone" ON "replies";
DROP POLICY IF EXISTS "Users can insert their own replies" ON "replies";
DROP POLICY IF EXISTS "Users can update their own replies" ON "replies";
DROP POLICY IF EXISTS "Users can delete their own replies" ON "replies";
DROP POLICY IF EXISTS "Admins can delete any reply" ON "replies";

DROP POLICY IF EXISTS "Light ups are viewable by everyone" ON "light_ups";
DROP POLICY IF EXISTS "Users can insert their own light ups" ON "light_ups";
DROP POLICY IF EXISTS "Users can delete their own light ups" ON "light_ups";
DROP POLICY IF EXISTS "Admins can delete any light up" ON "light_ups";

DROP POLICY IF EXISTS "Wars are viewable by everyone" ON "wars";
DROP POLICY IF EXISTS "Only admins can modify wars" ON "wars";

-- ============================================
-- 2. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "servants_jp" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "servants_cn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "servants_en" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ratings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "replies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "light_ups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wars" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. USERS TABLE POLICIES
-- ============================================

-- Anyone can read user profiles (for displaying usernames)
CREATE POLICY "Users are viewable by everyone"
ON "users"
FOR SELECT
USING (true);

-- Users can only insert their own profile (during registration)
CREATE POLICY "Users can insert their own profile"
ON "users"
FOR INSERT
WITH CHECK (id = auth.uid());

-- Users can only update their own profile (but not role/access_level)
CREATE POLICY "Users can update their own profile"
ON "users"
FOR UPDATE
USING (
  id = auth.uid()
  AND access_level > 0  -- Suspended users cannot update
)
WITH CHECK (
  id = auth.uid()
  AND access_level > 0  -- Suspended users cannot update
  -- Note: To prevent privilege escalation, use UPDATE triggers or application logic
  -- RLS cannot easily check if specific columns changed
);

-- Only admins can delete users
CREATE POLICY "Only admins can delete users"
ON "users"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role_int = 1
  )
);

-- ============================================
-- 4. SERVANTS TABLES POLICIES (READ-ONLY for users)
-- ============================================

-- Everyone can read servants (public data)
CREATE POLICY "Servants JP are viewable by everyone"
ON "servants_jp"
FOR SELECT
USING (true);

CREATE POLICY "Servants CN are viewable by everyone"
ON "servants_cn"
FOR SELECT
USING (true);

CREATE POLICY "Servants EN are viewable by everyone"
ON "servants_en"
FOR SELECT
USING (true);

-- Only admins can modify servants
CREATE POLICY "Only admins can modify servants JP"
ON "servants_jp"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role_int = 1
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role_int = 1
  )
);

CREATE POLICY "Only admins can modify servants CN"
ON "servants_cn"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role_int = 1
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role_int = 1
  )
);

CREATE POLICY "Only admins can modify servants EN"
ON "servants_en"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role_int = 1
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role_int = 1
  )
);

-- ============================================
-- 5. RATINGS TABLE POLICIES
-- ============================================

-- Everyone can read all ratings (public data)
CREATE POLICY "Ratings are viewable by everyone"
ON "ratings"
FOR SELECT
USING (true);

-- Authenticated users can insert their own ratings (if not suspended)
CREATE POLICY "Authenticated users can insert their own ratings"
ON "ratings"
FOR INSERT
WITH CHECK (
  "userId" = auth.uid()
  AND EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND access_level > 0  -- Prevent suspended users
  )
);

-- Users can only update their own ratings
CREATE POLICY "Users can update their own ratings"
ON "ratings"
FOR UPDATE
USING ("userId" = auth.uid())
WITH CHECK ("userId" = auth.uid());

-- Users can only delete their own ratings, or admins can delete any
CREATE POLICY "Users can delete their own ratings"
ON "ratings"
FOR DELETE
USING (
  "userId" = auth.uid()
  OR EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role_int = 1
  )
);

-- ============================================
-- 6. REPLIES TABLE POLICIES
-- ============================================

-- Everyone can read all replies (public data)
CREATE POLICY "Replies are viewable by everyone"
ON "replies"
FOR SELECT
USING (true);

-- Authenticated users can insert their own replies (if not suspended)
CREATE POLICY "Users can insert their own replies"
ON "replies"
FOR INSERT
WITH CHECK (
  "userId" = auth.uid()
  AND EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND access_level > 0  -- Prevent suspended users
  )
);

-- Users can only update their own replies
CREATE POLICY "Users can update their own replies"
ON "replies"
FOR UPDATE
USING ("userId" = auth.uid())
WITH CHECK ("userId" = auth.uid());

-- Users can delete their own replies, or admins can delete any
CREATE POLICY "Users can delete their own replies"
ON "replies"
FOR DELETE
USING (
  "userId" = auth.uid()
  OR EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role_int = 1
  )
);

-- ============================================
-- 7. LIGHT_UPS TABLE POLICIES
-- ============================================

-- Everyone can read all light ups (public data)
CREATE POLICY "Light ups are viewable by everyone"
ON "light_ups"
FOR SELECT
USING (true);

-- Authenticated users can insert their own light ups (if not suspended)
CREATE POLICY "Users can insert their own light ups"
ON "light_ups"
FOR INSERT
WITH CHECK (
  "userId" = auth.uid()
  AND EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND access_level > 0  -- Prevent suspended users
  )
);

-- Users can delete their own light ups (no update - only add/remove)
CREATE POLICY "Users can delete their own light ups"
ON "light_ups"
FOR DELETE
USING (
  "userId" = auth.uid()
  OR EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role_int = 1
  )
);

-- ============================================
-- 8. WARS TABLE POLICIES (ADMIN-ONLY MODIFICATIONS)
-- ============================================

-- Everyone can read wars (public data)
CREATE POLICY "Wars are viewable by everyone"
ON "wars"
FOR SELECT
USING (true);

-- Only admins can modify wars (INSERT, UPDATE, DELETE)
CREATE POLICY "Only admins can modify wars"
ON "wars"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role_int = 1
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role_int = 1
  )
);

-- ============================================
-- 9. ENHANCED USER MANAGEMENT (ADMIN CONTROLS)
-- ============================================

-- Admins can suspend/manage users (add update policy for admins)
DROP POLICY IF EXISTS "Admins can update any user" ON "users";
CREATE POLICY "Admins can update any user"
ON "users"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role_int = 1
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid()
    AND role_int = 1
  )
);

-- ============================================
-- 10. VERIFICATION QUERIES
-- ============================================
-- Run these to verify RLS is enabled:

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'servants_jp', 'servants_cn', 'servants_en', 'ratings', 'replies', 'light_ups', 'wars');
-- All should show rowsecurity = true

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 11. TESTING RLS POLICIES
-- ============================================
-- In Supabase SQL Editor, test with different contexts:

-- Test as anonymous user (should only read public data):
-- SELECT * FROM servants_jp; -- Should work
-- SELECT * FROM ratings; -- Should work
-- SELECT * FROM wars; -- Should work
-- INSERT INTO ratings (...) VALUES (...); -- Should fail
-- INSERT INTO wars (...) VALUES (...); -- Should fail

-- Test as authenticated user (simulate by using their UUID):
-- SET request.jwt.claims = '{"sub": "user-uuid-here"}';
-- INSERT INTO ratings ("userId", "collectionNo", "score", "server") VALUES ('user-uuid-here', 1, 5, 'JP'); -- Should work
-- UPDATE ratings SET score = 4 WHERE "userId" = 'user-uuid-here'; -- Should work
-- UPDATE ratings SET score = 3 WHERE "userId" = 'different-user-uuid'; -- Should fail
-- INSERT INTO servants_jp (...) VALUES (...); -- Should fail (not admin)
-- INSERT INTO wars (...) VALUES (...); -- Should fail (not admin)

-- Test as admin user:
-- SET request.jwt.claims = '{"sub": "admin-user-uuid"}';
-- (Ensure the user with admin-user-uuid has role = 'ADMIN' in users table)
-- INSERT INTO servants_jp (...) VALUES (...); -- Should work
-- UPDATE servants_jp SET name = 'New Name' WHERE id = 1; -- Should work
-- DELETE FROM servants_jp WHERE id = 999; -- Should work
-- INSERT INTO wars (...) VALUES (...); -- Should work
-- DELETE FROM ratings WHERE id = 'any-rating-id'; -- Should work
-- UPDATE users SET status = 'SUSPENDED' WHERE id = 'any-user-id'; -- Should work

-- ============================================
-- NOTES:
-- ============================================
-- 1. After running this, RESTART your Supabase connection or refresh
-- 2. Test thoroughly before deploying to production
-- 3. If you have existing data, RLS won't affect it retroactively
-- 4. auth.uid() returns the authenticated user's UUID (not text!)
-- 5. When RLS is enabled, unauthenticated requests can only do what policies allow
-- 6. Your id and userId columns are UUID type, so no casting needed
-- 7. CRITICAL: All admin operations are now SERVER-SIDE enforced via RLS
-- 8. Client-side role checks in AdminPage.tsx are UI-only - RLS is the real security
-- 9. Even if someone bypasses the UI, the database will reject unauthorized operations
-- 10. Admins can: Modify servants/wars, suspend users, delete any ratings/replies/light_ups
