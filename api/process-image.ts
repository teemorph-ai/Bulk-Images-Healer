import { GoogleGenAI, Modality } from "@google/genai";

// Types are redefined here to keep the serverless function self-contained.
enum Corner {
  TopLeft = 'top left',
  TopRight = 'top right',
  BottomLeft = 'bottom left',
  BottomRight = 'bottom right',
}

enum Tool {
  Heal = 'heal',
  GenerativeRemove = 'generative-remove',
}

// Vercel Edge Runtime configuration
export const config = {
  runtime: 'edge',
};

const getPromptForTool = (tool: Tool, corner: Corner): string => {
    switch (tool) {
        case Tool.Heal:
            return `Using a spot healing brush effect, seamlessly remove the small object located in the ${corner} corner of this image. Ensure the background is perfectly reconstructed and the final image maintains its original quality, resolution, and style. Do not add any new elements or change the overall composition.`;
        case Tool.GenerativeRemove:
            return `Generatively remove the object located in the ${corner} corner of this image. Inpaint the removed area to perfectly match the surrounding background, textures, and lighting. The result should be photorealistic and indistinguishable from the original image, maintaining all original quality and details.`;
        default:
            return `Remove the object in the ${corner} corner.`;
    }
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { base64ImageData, mimeType, corner, tool } = await req.json();

    if (!base64ImageData || !mimeType || !corner || !tool) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable is not set on the server. Please check your Vercel deployment settings.");
    }
    const ai = new GoogleGenAI({ apiKey });

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
          return new Response(JSON.stringify({ resultBase64: part.inlineData.data }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    throw new Error("No image was returned from the API. The content may have been blocked due to safety settings.");

  } catch (error) {
    console.error("Error in process-image API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}