import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Point } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Define the response schema for coordinates
const coordinateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    points: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          x: { type: Type.NUMBER, description: "X coordinate (0-100)" },
          y: { type: Type.NUMBER, description: "Y coordinate (0-100)" },
        },
        required: ["x", "y"],
      },
      description: "A list of 2D points outlining the shape.",
    },
  },
  required: ["points"],
};

export const generateShapeCoordinates = async (prompt: string): Promise<Point[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a list of 2D coordinates (x, y) that form the outline of a "${prompt}". 
      The coordinates should be normalized on a 100x100 grid. 
      Provide enough points (at least 150-300) to clearly define the shape visually when connected by dots. 
      Focus on the silhouette.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: coordinateSchema,
        temperature: 0.7, // Slightly creative but structured
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    const data = JSON.parse(jsonText);
    
    if (data.points && Array.isArray(data.points)) {
      return data.points.map((p: any) => ({ x: p.x, y: p.y }));
    }
    
    return [];
  } catch (error) {
    console.error("Gemini Shape Generation Error:", error);
    throw error;
  }
};
