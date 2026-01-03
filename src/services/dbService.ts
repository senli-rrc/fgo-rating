
import { Servant, User, Rating, Reply, LightUp, War } from '../types';

// IndexedDB Configuration
const DB_NAME = 'fgo_rating_db';
const DB_VERSION = 2; // Incremented for 'wars' store

const STORES = {
  SERVANTS: 'servants',
  USERS: 'users',
  RATINGS: 'ratings',
  REPLIES: 'replies',
  LIGHTUPS: 'lightups',
  WARS: 'wars'
};

// Singleton Promise to handle DB connection
let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
        reject(new Error("IndexedDB is not supported in this browser."));
        return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.SERVANTS)) {
        db.createObjectStore(STORES.SERVANTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        db.createObjectStore(STORES.USERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.RATINGS)) {
        db.createObjectStore(STORES.RATINGS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.REPLIES)) {
        db.createObjectStore(STORES.REPLIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.LIGHTUPS)) {
        db.createObjectStore(STORES.LIGHTUPS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.WARS)) {
        db.createObjectStore(STORES.WARS, { keyPath: 'id' });
      }
    };
  });
  return dbPromise;
};

// Generic Helpers
const getAll = async <T>(storeName: string): Promise<T[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
};

const getOne = async <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const put = async <T>(storeName: string, value: T): Promise<T> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(value);
        tx.oncomplete = () => resolve(value);
        tx.onerror = () => reject(tx.error);
    });
};

const deleteItem = async (storeName: string, key: IDBValidKey): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};


export const dbService = {
  // Initialize DB
  init: async () => {
    if (typeof window === 'undefined') return;
    
    try {
        const users = await getAll<User>(STORES.USERS);
        if (users.length === 0) {
            // Default admin user
            const defaultUser: User = { 
                id: 1, 
                username: 'Admin User', 
                email: 'admin@chaldea.org', 
                role: 'ADMIN', 
                password: 'admin',
                status: 'ACTIVE',
                registerIp: '127.0.0.1',
                createdAt: Date.now()
            };
            await put(STORES.USERS, defaultUser);
        }
    } catch (e) {
        console.error("Failed to initialize DB", e);
    }
  },

  getAllServants: async (): Promise<Servant[]> => {
      return getAll<Servant>(STORES.SERVANTS);
  },

  saveServant: async (servant: Servant): Promise<Servant> => {
      return put<Servant>(STORES.SERVANTS, servant);
  },

  deleteServant: async (id: number): Promise<void> => {
      return deleteItem(STORES.SERVANTS, id);
  },

  // Bulk upsert for the Atlas Academy Sync
  bulkUpsert: async (servants: Servant[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SERVANTS, 'readwrite');
      const store = tx.objectStore(STORES.SERVANTS);
      
      servants.forEach(s => {
          store.put(s);
      });
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error("Bulk upsert failed: " + tx.error?.message));
    });
  },

  // --- Wars / Quests ---

  getAllWars: async (): Promise<War[]> => {
    return getAll<War>(STORES.WARS);
  },

  saveWar: async (war: War): Promise<War> => {
    return put<War>(STORES.WARS, war);
  },

  bulkUpsertWars: async (wars: War[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.WARS, 'readwrite');
      const store = tx.objectStore(STORES.WARS);
      
      wars.forEach(w => {
          store.put(w);
      });
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error("Bulk upsert wars failed"));
    });
  },

  // --- User Management ---

  getAllUsers: async (): Promise<User[]> => {
      return getAll<User>(STORES.USERS);
  },

  saveUser: async (user: User): Promise<User> => {
      return put<User>(STORES.USERS, user);
  },

  authenticateUser: async (usernameOrEmail: string, password: string): Promise<User | null> => {
      const users = await getAll<User>(STORES.USERS);
      const user = users.find(u => 
        (u.username === usernameOrEmail || u.email === usernameOrEmail) && 
        u.password === password
      );
      
      if (user) {
          if (user.status === 'SUSPENDED') {
              throw new Error('This account has been suspended.');
          }
          const { password, ...safeUser } = user;
          return safeUser as User;
      }
      return null;
  },

  registerUser: async (email: string, username: string, password: string, ip?: string): Promise<User> => {
      const users = await getAll<User>(STORES.USERS);
      
      if (users.some(u => u.email === email)) {
          throw new Error('Email already registered.');
      }
      if (users.some(u => u.username === username)) {
          throw new Error('Username already taken.');
      }

      const newUser: User = {
          id: Date.now(),
          username,
          email,
          role: 'USER',
          password,
          status: 'ACTIVE',
          registerIp: ip || 'unknown',
          createdAt: Date.now()
      };

      await put(STORES.USERS, newUser);
      
      const { password: _, ...safeUser } = newUser;
      return safeUser as User;
  },

  // --- Rating System ---

  getAllRatings: async (): Promise<Rating[]> => {
      return getAll<Rating>(STORES.RATINGS);
  },

  getRatingsForServant: async (servantId: number): Promise<Rating[]> => {
      const allRatings = await getAll<Rating>(STORES.RATINGS);
      const servantRatings = allRatings.filter(r => r.servantId === servantId);
      servantRatings.sort((a, b) => b.timestamp - a.timestamp);
      return servantRatings;
  },

  getUserRating: async (userId: number, servantId: number): Promise<Rating | undefined> => {
      const allRatings = await getAll<Rating>(STORES.RATINGS);
      return allRatings.find(r => r.servantId === servantId && r.userId === userId);
  },

  saveRating: async (rating: Omit<Rating, 'id' | 'timestamp'>): Promise<Rating> => {
      const allRatings = await getAll<Rating>(STORES.RATINGS);
      const existing = allRatings.find(r => r.userId === rating.userId && r.servantId === rating.servantId);
      
      const newRating: Rating = {
          ...rating,
          id: existing ? existing.id : crypto.randomUUID(),
          timestamp: Date.now()
      };

      await put(STORES.RATINGS, newRating);
      return newRating;
  },

  // --- Replies & LightUps ---

  getAllReplies: async (): Promise<Reply[]> => {
      return getAll<Reply>(STORES.REPLIES);
  },

  getRepliesForRating: async (ratingId: string): Promise<Reply[]> => {
      const allReplies = await getAll<Reply>(STORES.REPLIES);
      const relevant = allReplies.filter(r => r.ratingId === ratingId);
      relevant.sort((a, b) => a.timestamp - b.timestamp);
      return relevant;
  },

  saveReply: async (ratingId: string, userId: number, username: string, content: string): Promise<Reply> => {
      const newReply: Reply = {
          id: crypto.randomUUID(),
          ratingId,
          userId,
          username,
          content,
          timestamp: Date.now()
      };
      await put(STORES.REPLIES, newReply);
      return newReply;
  },

  toggleLightUp: async (ratingId: string, userId: number): Promise<boolean> => {
      const allLightUps = await getAll<LightUp>(STORES.LIGHTUPS);
      const existing = allLightUps.find(l => l.ratingId === ratingId && l.userId === userId);
      
      if (existing) {
          await deleteItem(STORES.LIGHTUPS, existing.id);
          return false;
      } else {
          const newLightUp: LightUp = {
              id: crypto.randomUUID(),
              ratingId,
              userId,
              timestamp: Date.now()
          };
          await put(STORES.LIGHTUPS, newLightUp);
          return true;
      }
  },

  getLightUpsForRating: async (ratingId: string): Promise<number> => {
      const allLightUps = await getAll<LightUp>(STORES.LIGHTUPS);
      return allLightUps.filter(l => l.ratingId === ratingId).length;
  },

  hasUserLitUp: async (ratingId: string, userId: number): Promise<boolean> => {
      const allLightUps = await getAll<LightUp>(STORES.LIGHTUPS);
      return allLightUps.some(l => l.ratingId === ratingId && l.userId === userId);
  },

  // --- Top Rating Fetcher for Rankings ---
  getTopReviewForServant: async (servantId: number): Promise<Rating | null> => {
      const ratings = await getAll<Rating>(STORES.RATINGS);
      const servantRatings = ratings.filter(r => r.servantId === servantId && r.comment && r.comment.length > 0);
      
      if (servantRatings.length === 0) return null;

      const lightUps = await getAll<LightUp>(STORES.LIGHTUPS);
      
      // Calculate lightups for each rating
      const ratingsWithCounts = servantRatings.map(r => {
          const count = lightUps.filter(l => l.ratingId === r.id).length;
          return { ...r, lightUpCount: count };
      });

      // Sort by lightUpCount desc, then timestamp desc
      ratingsWithCounts.sort((a, b) => {
          if (b.lightUpCount !== a.lightUpCount) return b.lightUpCount - a.lightUpCount;
          return b.timestamp - a.timestamp;
      });

      return ratingsWithCounts[0];
  }
};
