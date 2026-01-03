
import { Servant, Attribute, SkillModel, NpModel, ProfileModel, War } from '../types';
import { CLASSES } from './mockData';

// Helper to get API URL based on region
// Map 'EN' to 'NA' as that is the Atlas Academy standard for the English server
const getApiRegion = (region: string) => region === 'EN' ? 'NA' : region;

// Interfaces for the external API response
interface AtlasFunction {
    funcId: number;
    funcType: string;
    funcPopupText?: string;
    funcPopupIcon?: string;
    buffs?: { name: string; icon?: string; detail?: string }[];
    svals?: Record<string, number>[];
}

interface AtlasSkill {
    id: number;
    num: number;
    name: string;
    detail: string;
    icon?: string;
    coolDown: number[];
    functions?: AtlasFunction[];
}

interface AtlasAppendPassive {
    num: number;
    skill: AtlasSkill;
}

interface AtlasNP {
    id: number;
    num: number;
    name: string;
    detail: string;
    card: string;
    rank: string;
    type: string;
    functions?: AtlasFunction[];
}

interface AtlasServant {
  id: number;
  collectionNo: number;
  name: string;
  originalName: string;
  className: string;
  type: string;
  rarity: number;
  atkMax: number;
  hpMax: number;
  atkBase: number;
  hpBase: number;
  cost: number;
  attribute: string;
  cards: string[];
  traits: { id: number; name: string }[];
  face?: string;
  extraAssets?: {
    charaGraph?: {
      ascension?: Record<string, string>;
      costume?: Record<string, string>;
    }
  };
  skills: AtlasSkill[];
  classPassive: AtlasSkill[];
  appendPassive: AtlasAppendPassive[];
  noblePhantasms: AtlasNP[];
  profile?: {
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
}

interface AtlasWar {
    id: number;
    age: string;
    name: string;
    longName: string;
    banner?: string;
    headerImage?: string;
    priority: number;
}

// Logic to transform raw Atlas JSON to Application Servant Type
export const transformAtlasData = (data: any[], region: string, limit: number = 50): Servant[] => {
    const apiRegion = getApiRegion(region);

    // Filter for playable servants only (CollectionNo > 0 is the gold standard for playable)
    // We sort by collectionNo DESC to ensure if we ever hit the limit, we keep the NEWEST servants.
    const validServants = (data as AtlasServant[])
      .filter(s => s.collectionNo > 0)
      .sort((a, b) => b.collectionNo - a.collectionNo)
      .slice(0, limit);

    const mappedServants: Servant[] = validServants.map(s => {
      // Map Class Name to ID
      const classObj = CLASSES.find(c => c.name.toLowerCase() === s.className.toLowerCase());
      const classId = classObj ? classObj.id : 100; // 100 for Unknown/New classes

      // Map Attribute string to Enum
      let attribute = Attribute.EARTH;
      const attrLower = s.attribute ? s.attribute.toLowerCase() : 'earth';
      if (Object.values(Attribute).includes(attrLower as Attribute)) {
        attribute = attrLower as Attribute;
      }

      // Construct URLs
      // Use dynamic region for fallback, though Atlas often stores assets in a shared path or JP structure
      const faceUrl = s.face || `https://static.atlasacademy.io/${apiRegion}/Faces/f_${s.id}0.png`;

      // Construct Ascension Images (CharaGraph)
      // Use extraAssets to get correct ascension and costume images
      const charaGraph = s.extraAssets?.charaGraph || {};
      const ascensionMap = charaGraph.ascension || {};
      const costumeMap = charaGraph.costume || {};

      // Sort ascensions by key (1, 2, 3, 4)
      const ascensionImages = Object.keys(ascensionMap)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(key => ascensionMap[key]);

      // Get costumes
      const costumeImages = Object.values(costumeMap);

      let images = [...ascensionImages, ...costumeImages];

      // Fallback manual construction if extraAssets is missing
      if (images.length === 0) {
          images = [
              `https://static.atlasacademy.io/${apiRegion}/CharaGraph/${s.id}/${s.id}a.png`,
              `https://static.atlasacademy.io/${apiRegion}/CharaGraph/${s.id}/${s.id}b.png`,
              `https://static.atlasacademy.io/${apiRegion}/CharaGraph/${s.id}/${s.id}c.png`,
              `https://static.atlasacademy.io/${apiRegion}/CharaGraph/${s.id}/${s.id}d.png`
          ];
      }

      const mapFunction = (f: AtlasFunction) => ({
        funcId: f.funcId,
        funcType: f.funcType,
        funcPopupText: f.funcPopupText,
        funcPopupIcon: f.funcPopupIcon,
        buffs: f.buffs ? f.buffs.map(b => ({ name: b.name, icon: b.icon, detail: b.detail })) : [],
        svals: f.svals || []
      });

      // Map new fields
      const noblePhantasms: NpModel[] = s.noblePhantasms ? s.noblePhantasms.map(np => ({
          id: np.id,
          num: np.num,
          name: np.name,
          detail: np.detail,
          card: np.card,
          rank: np.rank,
          type: np.type,
          functions: np.functions ? np.functions.map(mapFunction) : []
      })) : [];

      const mapSkill = (skill: AtlasSkill, overrideNum?: number): SkillModel => ({
          id: skill.id,
          num: overrideNum ?? skill.num,
          name: skill.name,
          detail: skill.detail,
          icon: skill.icon,
          coolDown: skill.coolDown,
          functions: skill.functions ? skill.functions.map(mapFunction) : []
      });

      const skills = s.skills ? s.skills.map(sk => mapSkill(sk)) : [];
      const classPassive = s.classPassive ? s.classPassive.map(sk => mapSkill(sk)) : [];

      // Fix for Append Skills: they are wrapped in an object { num, skill }
      const appendPassive = s.appendPassive ? s.appendPassive.map(ap => mapSkill(ap.skill, ap.num)) : [];

      const profile: ProfileModel | undefined = s.profile ? {
          cv: s.profile.cv,
          illustrator: s.profile.illustrator,
          stats: s.profile.stats,
          comments: s.profile.comments
      } : undefined;


      return {
        id: s.id,
        collectionNo: s.collectionNo,
        name: s.name,
        originalName: s.originalName || s.name,
        type: 'Normal',
        rarity: s.rarity,
        classId: classId,
        className: s.className,
        attribute: attribute,
        atkMax: s.atkMax,
        hpMax: s.hpMax,
        atkBase: s.atkBase,
        hpBase: s.hpBase,
        cost: s.cost,
        cards: s.cards || [],
        images: images,
        face: faceUrl,
        traits: s.traits ? s.traits.map(t => t.name) : [],
        noblePhantasms,
        skills,
        classPassive,
        appendPassive,
        profile
      };
    });

    return mappedServants;
}

export const fetchAtlasData = async (region: string, onProgress: (msg: string) => void): Promise<Servant[]> => {
  try {
    const apiRegion = getApiRegion(region);
    const url = `https://api.atlasacademy.io/export/${apiRegion}/nice_servant.json`;

    onProgress(`Fetching data from Atlas Academy API (${region} Server)...`);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch from Atlas Academy (${region})`);

    onProgress('Parsing data...');
    const data: AtlasServant[] = await response.json();

    // Limit to 50 for development/debugging as requested
    const MAX_RECORDS = 1500;
    onProgress(`Processing records...`);

    return transformAtlasData(data, region, MAX_RECORDS);

  } catch (error) {
    console.error('Atlas Sync Error:', error);
    throw error;
  }
};

export const fetchWarData = async (region: string): Promise<War[]> => {
    try {
        const apiRegion = getApiRegion(region);
        const url = `https://api.atlasacademy.io/export/${apiRegion}/nice_war.json`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch War data from Atlas Academy');

        const data: AtlasWar[] = await response.json();

        // Return only index 0-32 as requested
        return data.slice(0, 33).map(w => ({
            id: w.id,
            age: w.age,
            name: w.name,
            longName: w.longName,
            banner: w.banner,
            headerImage: w.headerImage,
            priority: w.priority
        }));
    } catch (error) {
        console.error('Atlas War Fetch Error:', error);
        return [];
    }
}
