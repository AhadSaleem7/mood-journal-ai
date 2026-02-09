import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

// Define the schema to ensure Gemini returns exactly what we need
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    happiness_score: {
      type: Type.INTEGER,
      description: "A number from 1-100 where 1 is extremely sad/stressed and 100 is extremely happy",
    },
    dominant_emotion: {
      type: Type.STRING,
      description: "One of: Joy, Anxiety, Burnout, Sadness, Anger, Calm, Excitement, Neutral",
    },
    summary: {
      type: Type.STRING,
      description: "A one sentence summary of the emotional state",
    },
    Advice: {
      type: Type.STRING,
      description: "A one sentence of advice for the emotional state relaxation",
    },
  },
  required: ["happiness_score", "dominant_emotion", "summary", "Advice"],
};

export const analyzeJournalEntry = async (text: string): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Efficient model for text tasks
      contents: `Analyze this journal entry: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are an empathetic emotional analyst. Be precise with the happiness score."
      },
    });

    if (!response.text) {
      throw new Error("No response text from Gemini");
    }

    // Since we used responseSchema, we can safely parse the JSON directly
    const result = JSON.parse(response.text);
    return result as AnalysisResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};