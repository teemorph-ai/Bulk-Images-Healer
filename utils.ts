
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // The result includes the "data:image/jpeg;base64," prefix.
      // We need to strip this prefix for the Gemini API.
      if (result.includes(',')) {
          resolve(result.split(',')[1]);
      } else {
          reject(new Error("Invalid data URL format"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const getMimeType = (file: File): string => {
  return file.type;
};
