import { GoogleGenAI, Type } from "@google/genai";
import { LevelConfig, CommandBlock, CommandType, Direction } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

export const getHintFromAI = async (level: LevelConfig, currentBlocks: CommandBlock[]): Promise<string> => {
  try {
    const blockNames = currentBlocks.map(b => b.type).join(", ");
    
    const prompt = `
      You are a helpful coding tutor for a Cambodian child (age 7-10).
      Language: Khmer (Cambodian).
      
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
      If it is wrong, give a gentle, encouraging hint in Khmer on what to fix. 
      Do not give the exact solution code, just a hint (e.g., "Try walking UP" or "Jump RIGHT over the rock").
      Keep it short (1-2 sentences).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "មិនអាចទទួលបានជំនួយទេ សូមព្យាយាមម្តងទៀត។";
  } catch (error) {
    console.error("Error getting hint:", error);
    return "មានបញ្ហាក្នុងការភ្ជាប់ សូមព្យាយាមម្តងទៀត។";
  }
};

export const generateNewLevel = async (difficulty: 'easy' | 'medium' | 'hard'): Promise<LevelConfig | null> => {
  try {
    const prompt = `
      Create a JSON object for a grid-based robot coding puzzle level.
      Difficulty: ${difficulty}.
      Grid Size: between 5 and 8.
      
      Schema:
      {
        "name": "Level Name in Khmer",
        "gridSize": integer,
        "start": {"x": int, "y": int},
        "startDirection": 0 (North), 1 (East), 2 (South), or 3 (West),
        "goal": {"x": int, "y": int},
        "obstacles": [{"x": int, "y": int}, ...],
        "description": "Short description in Khmer"
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