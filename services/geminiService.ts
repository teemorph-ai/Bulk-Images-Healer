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

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  if (!data.resultBase64) {
      throw new Error("API did not return a valid image.");
  }

  return data.resultBase64;
};