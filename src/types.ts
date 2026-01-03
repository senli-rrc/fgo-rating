
export enum Attribute {
  EARTH = 'earth',
  SKY = 'sky',
  MAN = 'man',
  STAR = 'star',
  BEAST = 'beast'
}

export interface ClassModel {
  id: number;
  name: string;
}

export interface TraitModel {
  id: number;
  name: string;
}

export interface SkillModel {
  id: number;
  num?: number;
  name: string;
  detail: string;
  icon?: string;
  coolDown?: number[];
  functions?: {
    funcId: number;
    funcType?: string;
    funcPopupText?: string;
    funcPopupIcon?: string;
    buffs: { name: string; icon?: string; detail?: string }[];
    svals: Record<string, number>[];
  }[];
}

export interface NpModel {
  id: number;
  num?: number;
  name: string;
  detail: string;
  card: string;
  rank: string;
  type: string;
  functions?: {
    funcId: number;
    funcType?: string;
    funcPopupText?: string;
    funcPopupIcon?: string;
    buffs: { name: string; icon?: string; detail?: string }[];
    svals: Record<string, number>[];
  }[];
}

export interface ProfileModel {
  cv: string;
  illustrator: string;
  stats?: {
    strength: string;
    endurance: string;
    agility: string;
    magic: string;
    luck: string;
    np: string;
  };
  comments?: { id: number; comment: string }[];
}

export interface Servant {
  id: number;
  collectionNo: number;
  name: string;
  originalName: string;
  type: string; // e.g., "Normal", "Heroic Spirit"
  rarity: number; // 1-5
  classId: number;
  className: string; // Denormalized for frontend ease
  attribute: Attribute;
  atkMax: number;
  hpMax: number;
  atkBase: number;
  hpBase: number;
  cost: number;
  face: string; // URL to icon
  cards: string[]; // ['quick', 'arts', 'buster', ...]
  images: string[]; // URLs to CharaGraph/Portraits
  traits: string[]; // Denormalized list of trait names
  averageScore?: number; // Calculated field for display
  
  // Extended Data
  noblePhantasms?: NpModel[];
  skills?: SkillModel[];
  classPassive?: SkillModel[];
  appendPassive?: SkillModel[];
  profile?: ProfileModel;
}

export interface War {
  id: number;
  age: string;
  name: string;
  longName: string;
  banner?: string;
  headerImage?: string;
  priority: number;
}

export interface User {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN';
  password?: string; // Only used internally for mock auth
  email?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
  registerIp?: string;
  createdAt?: number;
}

export interface Rating {
  id: string;
  userId: number;
  username: string;
  servantId: number;
  score: number; // 1-10
  comment: string;
  timestamp: number;
}

export interface Reply {
  id: string;
  ratingId: string; // The parent review ID
  userId: number;
  username: string;
  content: string;
  timestamp: number;
}

export interface LightUp {
  id: string;
  ratingId: string;
  userId: number;
  timestamp: number;
}

// View State Management Types
export enum ViewState {
  HOME = 'HOME',
  DETAIL = 'DETAIL',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  ADMIN = 'ADMIN',
  REVIEWS = 'REVIEWS',
  MAIN_QUESTS = 'MAIN_QUESTS',
  RANKING = 'RANKING'
}