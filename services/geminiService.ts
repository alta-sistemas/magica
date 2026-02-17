import { GoogleGenAI, Type } from "@google/genai";
import { HalftoneShape, AIAnalysisResult } from '../types';

export const analyzeImage = async (base64Image: string): Promise<AIAnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Convert pure base64 if it has prefix
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Efficient vision model
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64
            }
          },
          {
            text: `Analyze this image for DTF (Direct to Film) t-shirt printing. 
            Suggest the best halftone pattern style (Círculo, Quadrado, Linha, Diamante) and grid size (in pixels, between 4 and 15) to make it look artistic and printable. 
            Consider the level of detail. Vintage/distressed styles usually benefit from Lines or Diamonds. High detail needs smaller grid sizes.
            Provide the reasoning in Portuguese (pt-BR).`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedShape: {
              type: Type.STRING,
              enum: [HalftoneShape.CIRCLE, HalftoneShape.SQUARE, HalftoneShape.LINE, HalftoneShape.DIAMOND]
            },
            suggestedGridSize: {
              type: Type.NUMBER,
              description: "A number between 4 and 15"
            },
            reasoning: {
              type: Type.STRING
            }
          },
          required: ["suggestedShape", "suggestedGridSize", "reasoning"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback
    return {
      suggestedShape: HalftoneShape.CIRCLE,
      suggestedGridSize: 6,
      reasoning: "Falha na análise, revertendo para padrões."
    };
  }
};