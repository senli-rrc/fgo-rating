# Multi-Server Architecture Implementation Summary

## Overview
Successfully refactored the FGO Rating application from a single-server design to a multi-server architecture supporting JP, CN, and EN servers with separate data storage.

## Key Changes Made

### 1. Database Schema (`supabase-setup.sql`)
**Before:**
- Single `servants` table for all regions
- `ratings` table with `servantId` foreign key

**After:**
- Three separate servant tables: `servants_jp`, `servants_cn`, `servants_en`
- `ratings` table now uses `collectionNo` + `server` instead of `servantId`
- Unique constraint: `(userId, collectionNo, server)` - allows users to rate the same servant on different servers

### 2. TypeScript Types (`src/types.ts`)
```typescript
// Updated Rating interface
export interface Rating {
  id: string;
  userId: number;
  username: string;
  collectionNo: number; // Changed from servantId
  server: 'JP' | 'CN' | 'EN'; // Added server field
  score: number;
  comment: string;
  timestamp: number;
}
```

### 3. Database Service (`src/services/dbService.ts`)
**Added:**
- `getServantTable(server)` helper function to route queries to correct table
- Server parameter to all servant methods:
  - `getAllServants(server)` 
  - `saveServant(servant, server)`
  - `deleteServant(id, server)`
  - `bulkUpsert(servants, server)`

**Updated rating methods:**
- `getRatingsForServant(collectionNo, server)` - filters by both collection number and server
- `getUserRating(userId, collectionNo, server)` - checks user's rating for specific server
- `saveRating(rating)` - now saves with collectionNo and server
- `getAllRatings(server?)` - optional server filter
- `getTopReviewForServant(collectionNo, server)` - for rankings

### 4. App Component (`src/App.tsx`)
**Server Switching Logic:**
- **Before:** `handleRegionChange()` downloaded Atlas API data and imported to database
- **After:** `handleRegionChange()` simply switches view to load data from different table

**Admin-Only Import:**
- `handleQuickImport()` now checks `user?.role === 'ADMIN'`
- Only admins can trigger data imports from Atlas Academy API

**Updated:**
- `loadServants(server)` - accepts server parameter
- All servant operations pass current `region` parameter

### 5. Pages Updated
**ServantDetailPage:**
- Added `region` prop
- Passes `collectionNo` and `server` to `<RatingSystem>`

**ReviewsPage:**
- Added `region` prop  
- Calls `getRatingsForServant(collectionNo, region)`
- Passes `collectionNo` and `server` to `<RatingSystem>`

**RankingPage:**
- Updated to use `collectionNo` instead of `servantId`
- Calls `getTopReviewForServant(collectionNo, 'JP')` (hardcoded to JP for now)

**AdminPage:**
- Displays `collectionNo` and `server` in ratings table

### 6. Components Updated
**RatingSystem:**
- Props changed: `collectionNo` and `server` instead of `servantId`
- All rating operations use collectionNo and current server

### 7. Migration Script (`supabase-migration.sql`)
Created comprehensive migration script to:
- Copy existing `servants` data to `servants_jp` table
- Add `collectionNo` and `server` columns to `ratings`
- Populate ratings with data from old `servantId`
- Update constraints and indexes
- Recalculate average scores for JP servants

## User Experience Changes

### Before:
❌ Clicking JP/CN/EN triggered heavy data download and import for all users  
❌ Ratings were shared across all servers (mixing JP/CN/EN data)  
❌ No way to keep separate servant data per region  

### After:
✅ Clicking JP/CN/EN instantly switches view (lightweight operation)  
✅ Ratings are server-specific (JP Artoria ≠ CN Artoria ratings)  
✅ Data import is admin-only privilege  
✅ Users can rate same servant on different servers  

## Migration Steps

1. **Backup Database** - Critical! This migration modifies existing data
2. **Run Main Schema** - Execute `supabase-setup.sql` to create new tables
3. **Run Migration** - Execute `supabase-migration.sql` to migrate data
4. **Verify Data** - Check servant counts and ratings are correct
5. **Optional Cleanup** - Drop old `servants` table after confirming migration

## Testing Checklist

- [ ] Switch between JP/CN/EN servers - should be instant
- [ ] Rate a servant on JP server
- [ ] Switch to CN server - previous rating should not appear
- [ ] Rate same servant on CN server - should save independently
- [ ] Check admin page - ratings show collectionNo and server
- [ ] Admin can trigger data import
- [ ] Non-admin cannot trigger data import
- [ ] Rankings page works correctly
- [ ] Reviews page filters by current server

## Database Indexes

Optimized for multi-server queries:
- `idx_servants_{jp|cn|en}_collection` - Fast collectionNo lookups
- `idx_servants_{jp|cn|en}_class` - Class filtering
- `idx_servants_{jp|cn|en}_average_score` - Ranking queries
- `idx_ratings_collection_server` - Composite index for rating lookups

## Future Improvements

1. **Rankings Page:** Make server-aware instead of hardcoded 'JP'
2. **User Preferences:** Let users set default server in their profile
3. **Cross-Server Stats:** Dashboard showing stats across all servers
4. **Bulk Operations:** Admin tools to sync all servers at once

## Notes

- Users table does NOT have server column (per your requirement)
- Server is tracked only in ratings table when rating is created
- This allows users to freely explore all servers and rate on any
- Each rating is permanently tied to the server it was created on
