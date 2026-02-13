import { GoogleGenAI, Type } from "@google/genai";
import { LevelConfig, CommandBlock, CommandType, Direction, Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

export const getHintFromAI = async (level: LevelConfig, currentBlocks: CommandBlock[], lang: Language): Promise<string> => {
  try {
    const blockNames = currentBlocks.map(b => b.type).join(", ");
    
    const langContext = lang === 'km' 
        ? "Language: Khmer (Cambodian). Respond ONLY in Khmer." 
        : "Language: English. Respond in simple English for a child.";

    const prompt = `
      You are a helpful coding tutor for a primary school student (age 7-10).
      ${langContext}
      
      Context:
      The child is playing a grid-based coding game.
      Grid Size: ${level.gridSize}x${level.gridSize}.
      Start: (${level.start.x}, ${level.start.y}) facing ${Direction[level.startDirection]}.
      Goal: (${level.goal.x}, ${level.goal.y}).
      Obstacles: ${JSON.stringify(level.obstacles)}.
      
      Available Commands: 
      - WALK: UP, DOWN, LEFT, RIGHT
      - JUMP (Moves 2 steps): JUMP_UP, JUMP_DOWN, JUMP_LEFT, JUMP_RIGHT
      
      Current Code Sequence: [${blockNames}].
      
      Task:
      Analyze if the current code will reach the goal. 
      If it is wrong, give a gentle, encouraging hint on what to fix. 
      Do not give the exact solution code, just a hint (e.g., "Try walking UP" or "Jump RIGHT over the rock").
      Keep it short (1-2 sentences).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    const fallback = lang === 'km' ? "មិនអាចទទួលបានជំនួយទេ សូមព្យាយាមម្តងទៀត។" : "Could not get a hint, please try again.";
    return response.text || fallback;
  } catch (error) {
    console.error("Error getting hint:", error);
    const fallback = lang === 'km' ? "មានបញ្ហាក្នុងការភ្ជាប់ សូមព្យាយាមម្តងទៀត។" : "Connection error, please try again.";
    return fallback;
  }
};

export const generateNewLevel = async (difficulty: 'easy' | 'medium' | 'hard', lang: Language): Promise<LevelConfig | null> => {
  try {
    const langContext = lang === 'km' ? "Khmer" : "English";
    
    const prompt = `
      Create a JSON object for a grid-based robot coding puzzle level.
      Difficulty: ${difficulty}.
      Grid Size: between 5 and 8.
      Language for Text: ${langContext}.
      
      Schema:
      {
        "name": "Level Name",
        "gridSize": integer,
        "start": {"x": int, "y": int},
        "startDirection": 0 (North), 1 (East), 2 (South), or 3 (West),
        "goal": {"x": int, "y": int},
        "obstacles": [{"x": int, "y": int}, ...],
        "description": "Short description in ${langContext}"
      }
      
      Ensure the path is solvable.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            gridSize: { type: Type.INTEGER },
            start: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.INTEGER },
                y: { type: Type.INTEGER },
              }
            },
            startDirection: { type: Type.INTEGER },
            goal: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.INTEGER },
                y: { type: Type.INTEGER },
              }
            },
            obstacles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.INTEGER },
                  y: { type: Type.INTEGER },
                }
              }
            },
            description: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const data = JSON.parse(text);
    return {
      id: Date.now(),
      ...data
    } as LevelConfig;

  } catch (error) {
    console.error("Error generating level:", error);
    return null;
  }
};