import { Servant, User, Rating, Reply, LightUp, War } from '../types';
import { supabase } from '../lib/supabase';

// Helper to get the correct servant table based on server
const getServantTable = (server: string): string => {
  switch (server.toUpperCase()) {
    case 'JP':
      return 'servants_jp';
    case 'CN':
      return 'servants_cn';
    case 'EN':
      return 'servants_en';
    default:
      return 'servants_jp';
  }
};

// Helper to get the correct war table based on server
const getWarTable = (server: string): string => {
  switch (server.toUpperCase()) {
    case 'JP':
      return 'wars_jp';
    case 'CN':
      return 'wars_cn';
    case 'EN':
      return 'wars_en';
    default:
      return 'wars_jp';
  }
};

// Type definitions for Supabase responses
interface SupabaseServant {
  id: number;
  collectionNo: number;
  name: string;
  originalName: string | null;
  className: string;
  rarity: number;
  face: string | null;
  attribute: string | null;
  atkMax: number | null;
  hpMax: number | null;
  atkBase: number | null;
  hpBase: number | null;
  cost: number | null;
  averageScore: number | null;
  data: any; // JSONB field containing skills, NPs, etc.
  created_at: string;
}

interface SupabaseUser {
  id: string; // UUID from Supabase auth
  uid: number; // Sequential ID for display
  username: string;
  email: string;
  role: 'USER' | 'ADMIN'; // Old text column (for backward compatibility)
  role_int: number; // New integer role (0 = USER, 1 = ADMIN)
  access_level: number; // Access level hierarchy
  status: 'ACTIVE' | 'SUSPENDED';
  register_ip?: string;
  created_at: string;
}

interface SupabaseRating {
  id: string;
  userId: string; // UUID
  collectionNo: number; // Changed from servantId
  server: string; // Added server field
  score: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

interface SupabaseReply {
  id: string;
  ratingId: string;
  userId: string;
  content: string;
  created_at: string;
}

interface SupabaseLightUp {
  id: string;
  ratingId: string;
  userId: string;
  created_at: string;
}

interface SupabaseWar {
  id: number;
  age: string | null;
  name: string;
  longName: string | null;
  banner: string | null;
  headerImage: string | null;
  priority: number;
  quests: any[] | null;
  created_at: string;
}

// Helper functions to convert between Supabase and app types
const convertServant = (s: SupabaseServant): Servant => {
  const data = s.data || {};
  return {
    id: s.id,
    collectionNo: s.collectionNo,
    name: s.name,
    originalName: s.originalName || s.name,
    type: data.type || 'Normal',
    rarity: s.rarity,
    classId: data.classId || 0,
    className: s.className,
    attribute: (s.attribute as any) || 'man',
    atkMax: s.atkMax || 0,
    hpMax: s.hpMax || 0,
    atkBase: s.atkBase || 0,
    hpBase: s.hpBase || 0,
    cost: s.cost || 0,
    face: s.face || '',
    cards: data.cards || [],
    images: data.images || [],
    traits: data.traits || [],
    averageScore: s.averageScore || 0,
    noblePhantasms: data.noblePhantasms,
    skills: data.skills,
    classPassive: data.classPassive,
    appendPassive: data.appendPassive,
    profile: data.profile
  };
};

const convertWar = (w: SupabaseWar): War => ({
  id: w.id,
  age: w.age || '',
  name: w.name,
  longName: w.longName || w.name,
  banner: w.banner,
  headerImage: w.headerImage,
  priority: w.priority,
  quests: w.quests || []
});

export const dbService = {
  // Initialize DB - with Supabase we don't need to create default data
  init: async () => {
    // Check if we can connect to Supabase (check one of the new servant tables)
    try {
      const { data, error } = await supabase.from('servants_jp').select('count').limit(1);
      if (error) {
        console.error('Supabase connection error:', error);
      }
    } catch (e) {
      console.error('Failed to connect to Supabase', e);
    }
  },

  // --- Servant Management ---

  getAllServants: async (server: string = 'JP'): Promise<Servant[]> => {
    const table = getServantTable(server);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('collectionNo', { ascending: true });

    if (error) {
      console.error('Error fetching servants:', error);
      return [];
    }

    return data ? data.map(convertServant) : [];
  },

  saveServant: async (servant: Servant, server: string = 'JP'): Promise<Servant> => {
    const table = getServantTable(server);
    const servantData: any = {
      id: servant.id,
      collectionNo: servant.collectionNo,
      name: servant.name,
      originalName: servant.originalName,
      className: servant.className,
      rarity: servant.rarity,
      face: servant.face,
      attribute: servant.attribute,
      atkMax: servant.atkMax,
      hpMax: servant.hpMax,
      atkBase: servant.atkBase,
      hpBase: servant.hpBase,
      cost: servant.cost,
      data: {
        type: servant.type,
        classId: servant.classId,
        cards: servant.cards,
        images: servant.images,
        traits: servant.traits,
        noblePhantasms: servant.noblePhantasms,
        skills: servant.skills,
        classPassive: servant.classPassive,
        appendPassive: servant.appendPassive,
        profile: servant.profile
      }
    };

    const { data, error } = await supabase
      .from(table)
      .upsert(servantData)
      .select()
      .single();

    if (error) {
      console.error('Error saving servant:', error);
      throw error;
    }

    return convertServant(data);
  },

  deleteServant: async (id: number, server: string = 'JP'): Promise<void> => {
    const table = getServantTable(server);
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting servant:', error);
      throw error;
    }
  },

  // Bulk upsert for the Atlas Academy Sync
  bulkUpsert: async (servants: Servant[], server: string = 'JP'): Promise<void> => {
    const table = getServantTable(server);
    const servantsData = servants.map(s => ({
      id: s.id,
      collectionNo: s.collectionNo,
      name: s.name,
      originalName: s.originalName,
      className: s.className,
      rarity: s.rarity,
      face: s.face,
      attribute: s.attribute,
      atkMax: s.atkMax,
      hpMax: s.hpMax,
      atkBase: s.atkBase,
      hpBase: s.hpBase,
      cost: s.cost,
      data: {
        type: s.type,
        classId: s.classId,
        cards: s.cards,
        images: s.images,
        traits: s.traits,
        noblePhantasms: s.noblePhantasms,
        skills: s.skills,
        classPassive: s.classPassive,
        appendPassive: s.appendPassive,
        profile: s.profile
      }
    }));

    const { error } = await supabase
      .from(table)
      .upsert(servantsData);

    if (error) {
      console.error('Bulk upsert failed:', error);
      throw new Error('Bulk upsert failed: ' + error.message);
    }
  },

  // Helper to get the correct war table based on server


  // --- Wars / Quests ---

  getAllWars: async (server: string = 'JP'): Promise<War[]> => {
    const table = getWarTable(server);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error fetching wars:', error);
      return [];
    }

    return data ? data.map(w => ({
      id: w.id,
      age: w.age,
      name: w.name,
      longName: w.longName,
      banner: w.banner,
      headerImage: w.headerImage,
      priority: w.priority,
      quests: w.quests || []
    })) : [];
  },

  saveWar: async (war: War, server: string = 'JP'): Promise<War> => {
    const table = getWarTable(server);
    const { data, error } = await supabase
      .from(table)
      .upsert({
        id: war.id,
        age: war.age,
        name: war.name,
        longName: war.longName,
        banner: war.banner,
        headerImage: war.headerImage,
        priority: war.priority,
        quests: war.quests || []
      });

    if (error) {
      console.error('Error saving war:', error);
      throw error;
    }

    return war;
  },

  bulkUpdateWars: async (wars: War[], server: string = 'JP'): Promise<void> => {
    const table = getWarTable(server);
    const { error } = await supabase
      .from(table)
      .upsert(wars.map(war => ({
        id: war.id,
        age: war.age,
        name: war.name,
        longName: war.longName,
        banner: war.banner,
        headerImage: war.headerImage,
        priority: war.priority,
        quests: war.quests || []
      })));

    if (error) {
      console.error('Error bulk updating wars:', error);
      throw error;
    }
  },

  // --- User Management ---
  // Note: With Supabase Auth, authentication is handled differently
  // These methods are adapted to work with Supabase auth.users

  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    // Store the actual UUID as a string in the id field (casting to number type for compatibility)
    // The id field will actually contain the UUID string despite the type definition
    return data ? data.map((u) => ({
      id: u.id as any, // Store UUID string (type workaround)
      uid: u.uid, // Sequential ID for display
      username: u.username,
      email: u.email,
      role: u.role_int ?? (u.role === 'ADMIN' ? 1 : 0), // Use role_int, fallback to old role
      accessLevel: u.access_level ?? (u.role === 'ADMIN' ? 99 : 1),
      status: u.status,
      registerIp: u.register_ip,
      createdAt: new Date(u.created_at).getTime()
    })) : [];
  },

  saveUser: async (user: User): Promise<User> => {
    // Update user data in the users table
    // user.id contains the UUID string (despite the type definition)
    // When status is SUSPENDED, set access_level to 0 (no permissions)
    const updateData: any = {
      status: user.status,
      role_int: user.role,
      access_level: user.status === 'SUSPENDED' ? 0 : user.accessLevel
    };

    // Allow updating username and uid if provided
    if (user.username) updateData.username = user.username;
    if (user.uid !== undefined) updateData.uid = user.uid;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id as any) // Use UUID for lookup
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    return {
      id: data.id as any,
      uid: data.uid,
      username: data.username,
      email: data.email,
      role: data.role_int,
      accessLevel: data.access_level,
      status: data.status,
      registerIp: data.register_ip,
      createdAt: new Date(data.created_at).getTime()
    };
  },

  authenticateUser: async (usernameOrEmail: string, password: string): Promise<User | null> => {
    // Use Supabase Auth instead
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameOrEmail,
      password: password
    });

    if (error || !data.user) {
      console.error('Authentication error:', error);
      return null;
    }

    // Fetch user profile from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user profile:', userError);
      return null;
    }

    if (userData.status === 'SUSPENDED' || userData.access_level === 0) {
      throw new Error('This account has been suspended.');
    }

    return {
      id: 1, // Placeholder for compatibility
      username: userData.username,
      email: userData.email,
      role: userData.role_int ?? (userData.role === 'ADMIN' ? 1 : 0),
      accessLevel: userData.access_level ?? (userData.role === 'ADMIN' ? 99 : 1),
      status: userData.status,
      createdAt: new Date(userData.created_at).getTime()
    };
  },

  registerUser: async (email: string, username: string, password: string, ip?: string): Promise<User> => {
    // Use Supabase Auth to create user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('Email already registered.');
      }
      throw error;
    }

    if (!data.user) {
      throw new Error('Failed to create user');
    }

    // The trigger in Supabase will automatically create the user profile
    // Wait a bit for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch the created user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      // Profile might not exist yet, return basic info
      return {
        id: 1,
        username,
        email,
        role: 'USER',
        status: 'ACTIVE',
        createdAt: Date.now()
      };
    }

    return {
      id: 1,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      status: userData.status,
      createdAt: new Date(userData.created_at).getTime()
    };
  },

  // --- Rating System ---

  getAllRatings: async (server?: string): Promise<Rating[]> => {
    let query = supabase
      .from('ratings')
      .select(`
        *,
        users (username)
      `)
      .order('created_at', { ascending: false });

    // Filter by server if provided
    if (server) {
      query = query.eq('server', server);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching ratings:', error);
      return [];
    }

    return data ? data.map(r => ({
      id: r.id,
      userId: 1, // Placeholder
      username: (r.users as any)?.username || 'Unknown',
      collectionNo: r.collectionNo,
      score: r.score,
      comment: r.comment || '',
      timestamp: new Date(r.created_at).getTime()
    })) : [];
  },

  getRatingsForServant: async (collectionNo: number, server: string): Promise<Rating[]> => {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        users (username)
      `)
      .eq('collectionNo', collectionNo)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ratings for servant:', error);
      return [];
    }

    return data ? data.map(r => ({
      id: r.id,
      userId: 1,
      username: (r.users as any)?.username || 'Unknown',
      collectionNo: r.collectionNo,
      score: r.score,
      comment: r.comment || '',
      timestamp: new Date(r.created_at).getTime()
    })) : [];
  },

  getUserRating: async (userId: number, collectionNo: number, server: string): Promise<Rating | undefined> => {
    // Get current user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return undefined;

    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        users (username)
      `)
      .eq('userId', user.id)
      .eq('collectionNo', collectionNo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle to handle 0 or 1 results

    if (error) {
      console.error('Error fetching user rating:', error);
      return undefined;
    }

    if (!data) {
      return undefined; // User hasn't rated this servant yet
    }

    return {
      id: data.id,
      userId: 1,
      username: (data.users as any)?.username || 'Unknown',
      collectionNo: data.collectionNo,
      score: data.score,
      comment: data.comment || '',
      timestamp: new Date(data.created_at).getTime()
    };
  },

  saveRating: async (rating: Omit<Rating, 'id' | 'timestamp'>): Promise<Rating> => {
    // Get current user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('ratings')
      .upsert({
        userId: user.id,
        collectionNo: rating.collectionNo,
        server: rating.server,
        score: rating.score,
        comment: rating.comment
      }, {
        onConflict: 'userId,collectionNo' // One rating per user per servant across all servers
      })
      .select(`
        *,
        users (username)
      `)
      .single();

    if (error) {
      console.error('Error saving rating:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: 1,
      username: (data.users as any)?.username || rating.username,
      collectionNo: data.collectionNo,
      score: data.score,
      comment: data.comment || '',
      timestamp: new Date(data.created_at).getTime()
    };
  },

  // --- Replies & LightUps ---

  getAllReplies: async (): Promise<Reply[]> => {
    const { data, error } = await supabase
      .from('replies')
      .select(`
        *,
        users (username)
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching replies:', error);
      return [];
    }

    return data ? data.map(r => ({
      id: r.id,
      ratingId: r.ratingId,
      userId: 1,
      username: (r.users as any)?.username || 'Unknown',
      content: r.content,
      timestamp: new Date(r.created_at).getTime()
    })) : [];
  },

  getRepliesForRating: async (ratingId: string): Promise<Reply[]> => {
    const { data, error } = await supabase
      .from('replies')
      .select(`
        *,
        users (username)
      `)
      .eq('ratingId', ratingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching replies for rating:', error);
      return [];
    }

    return data ? data.map(r => ({
      id: r.id,
      ratingId: r.ratingId,
      userId: 1,
      username: (r.users as any)?.username || 'Unknown',
      content: r.content,
      timestamp: new Date(r.created_at).getTime()
    })) : [];
  },

  saveReply: async (ratingId: string, userId: number, username: string, content: string): Promise<Reply> => {
    // Get current user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('replies')
      .insert({
        ratingId,
        userId: user.id,
        content
      })
      .select(`
        *,
        users (username)
      `)
      .single();

    if (error) {
      console.error('Error saving reply:', error);
      throw error;
    }

    return {
      id: data.id,
      ratingId: data.ratingId,
      userId: 1,
      username: (data.users as any)?.username || username,
      content: data.content,
      timestamp: new Date(data.created_at).getTime()
    };
  },

  toggleLightUp: async (ratingId: string, userId: number): Promise<boolean> => {
    // Get current user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if already lit up
    const { data: existing, error: checkError } = await supabase
      .from('light_ups')
      .select('id')
      .eq('ratingId', ratingId)
      .eq('userId', user.id)
      .maybeSingle();

    if (existing) {
      // Remove light up
      const { error } = await supabase
        .from('light_ups')
        .delete()
        .eq('id', existing.id);

      if (error) {
        console.error('Error removing light up:', error);
        throw error;
      }
      return false;
    } else {
      // Add light up
      const { error } = await supabase
        .from('light_ups')
        .insert({
          ratingId,
          userId: user.id
        });

      if (error) {
        console.error('Error adding light up:', error);
        throw error;
      }
      return true;
    }
  },

  getLightUpsForRating: async (ratingId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('light_ups')
      .select('*', { count: 'exact', head: true })
      .eq('ratingId', ratingId);

    if (error) {
      console.error('Error counting light ups:', error);
      return 0;
    }

    return count || 0;
  },

  hasUserLitUp: async (ratingId: string, userId: number): Promise<boolean> => {
    // Get current user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('light_ups')
      .select('id')
      .eq('ratingId', ratingId)
      .eq('userId', user.id)
      .maybeSingle();

    return !!data;
  },

  // --- Top Rating Fetcher for Rankings ---
  getTopReviewForServant: async (collectionNo: number, server?: string): Promise<Rating | null> => {
    // Get all ratings for this servant with comment
    let query = supabase
      .from('ratings')
      .select(`
        *,
        users (username)
      `)
      .eq('collectionNo', collectionNo)
      .not('comment', 'is', null)
      .neq('comment', '');

    // Don't filter by server since ratings are shared across all servers

    const { data: ratings, error } = await query;

    if (error || !ratings || ratings.length === 0) {
      return null;
    }

    // Get light up counts for each rating
    const ratingsWithCounts = await Promise.all(
      ratings.map(async (r) => {
        const count = await dbService.getLightUpsForRating(r.id);
        return {
          id: r.id,
          userId: 1,
          username: (r.users as any)?.username || 'Unknown',
          collectionNo: r.collectionNo,
          score: r.score,
          comment: r.comment || '',
          timestamp: new Date(r.created_at).getTime(),
          lightUpCount: count
        };
      })
    );

    // Sort by lightUpCount desc, then timestamp desc
    ratingsWithCounts.sort((a, b) => {
      if (b.lightUpCount !== a.lightUpCount) return b.lightUpCount - a.lightUpCount;
      return b.timestamp - a.timestamp;
    });

    return ratingsWithCounts[0];
  }
};

