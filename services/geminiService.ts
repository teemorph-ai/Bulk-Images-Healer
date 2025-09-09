import { GoogleGenAI, Modality } from "@google/genai";
import { Corner, Tool } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const getPromptForTool = (tool: Tool, corner: Corner): string => {
    switch (tool) {
        case Tool.Heal:
            return `Using a spot healing brush effect, seamlessly remove the small object located in the ${corner} corner of this image. Ensure the background is perfectly reconstructed and the final image maintains its original quality, resolution, and style. Do not add any new elements or change the overall composition.`;
        case Tool.GenerativeRemove:
            return `Generatively remove the object located in the ${corner} corner of this image. Inpaint the removed area to perfectly match the surrounding background, textures, and lighting. The result should be photorealistic and indistinguishable from the original image, maintaining all original quality and details.`;
        default:
            throw new Error("Unknown tool selected");
    }
};

export const removeObjectFromImage = async (
  base64ImageData: string,
  mimeType: string,
  corner: Corner,
  tool: Tool,
): Promise<string> => {
  try {
    const prompt = getPromptForTool(tool, corner);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }

    throw new Error("No image was returned from the API. The content may have been blocked.");

  } catch (error) {
    console.error("Error editing image with Gemini API:", error);
    if (error instanceof Error) {
      throw new Error(`API Error: ${error.message}`);
    }
    throw new Error("An unknown API error occurred.");
  }
};