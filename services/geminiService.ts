import { GoogleGenAI } from "@google/genai";
import { FTADStats } from "../types";

// Declare process for TypeScript to avoid build errors
declare var process: {
  env: {
    API_KEY: string;
  };
};

/**
 * Generates strategic insights using Gemini based on FTAD metrics.
 */
export const getAIInsights = async (stats: FTADStats, topDivisions: any[], topCategories: any[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze this Field Technical Assistance Division (FTAD) data focusing on TAP Finalization.
    
    Current Stats:
    - Total TA Requests: ${stats.totalTARequests}
    - Total Accomplished (Finalized): ${stats.accomplishedTAPs}
    - Accomplishment Percentage: ${stats.resolutionRate.toFixed(1)}%
    - Overall Registry Volume: ${stats.totalInterventions}
    
    Division Engagement:
    ${JSON.stringify(topDivisions)}
    
    Thematic Focus Areas:
    ${JSON.stringify(topCategories)}
    
    Provide 3-4 professional strategic insights. Focus on 'Finalization Efficiency', 'Completion Bottlenecks', and 'Service Delivery Quality'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a Senior Technical Assistance Strategist. You analyze TAP (Technical Assistance Plan) completion data to provide actionable leadership insights for regional education bureaus.",
        temperature: 0.7,
      },
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating TA strategic insights.";
  }
};