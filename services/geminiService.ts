import { Corner, Tool } from '../types';

export const removeObjectFromImage = async (
  base64ImageData: string,
  mimeType: string,
  corner: Corner,
  tool: Tool,
): Promise<string> => {
  const response = await fetch('/api/process-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64ImageData,
      mimeType,
      corner,
      tool,
    }),
  });

  if (!response.ok) {
    let errorMessage = `A server error occurred (status: ${response.status}).`;
    try {
      // The API route should return a JSON error object, try to parse it.
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // If parsing fails, the response was not JSON. It might be a plain text
      // error from the server infrastructure (e.g., Vercel edge function crash).
      const errorText = await response.text();
      // Only use the raw text if it's not a huge HTML page.
      if (errorText && errorText.length < 500 && !errorText.toLowerCase().includes('<html>')) {
        errorMessage = errorText;
      }
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  if (!data.resultBase64) {
      throw new Error("API response was successful but did not contain a valid image.");
  }

  return data.resultBase64;
};