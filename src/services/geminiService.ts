import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Servant } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateServantAnalysis = async (servant: Servant): Promise<string> => {
  try {
    const prompt = `
      As a Fate/Grand Order expert analyst, provide a strategic analysis for the following servant:
      Name: ${servant.name} (${servant.className})
      Rarity: ${servant.rarity} Stars
      Max ATK: ${servant.atkMax}
      Max HP: ${servant.hpMax}
      Traits: ${servant.traits.join(', ')}

      Please provide:
      1. A brief lore summary (2 sentences).
      2. Gameplay strengths and weaknesses.
      3. Recommended Craft Essence types (e.g., Buster Up, Arts Up).
      4. A "Rating" out of 10 for general farming and challenge quests.
      
      Format the output in clear Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are helpful FGO assistant.",
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate analysis. Please try again later.";
  }
};

export const createServantChat = (servant: Servant): Chat => {
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction: `You are an AI assistant specialized in Fate/Grand Order. 
            You are currently analyzing the servant: ${servant.name} (Class: ${servant.className}).
            Stats: ATK ${servant.atkMax}, HP ${servant.hpMax}.
            Deck: ${servant.cards ? servant.cards.join(', ') : 'Unknown'}.
            Traits: ${servant.traits.join(', ')}.
            Answer questions about this servant's lore, gameplay usage, team compositions, and lore. 
            Keep answers concise and helpful for a player.`
        }
    });
};

export const generateLoreDescription = async (name: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a very short, dramatic, one-sentence flavor text description for the Fate/Grand Order character: ${name}.`,
        });
        return response.text || "";
    } catch (e) {
        return "";
    }
}