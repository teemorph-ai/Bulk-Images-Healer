export enum Corner {
  TopLeft = 'top left',
  TopRight = 'top right',
  BottomLeft = 'bottom left',
  BottomRight = 'bottom right',
}

export enum Tool {
  Heal = 'heal',
  GenerativeRemove = 'generative-remove',
}

export interface AppImage {
  originalFile: File;
  originalUrl: string;
  processedUrl?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
  toolUsed?: Tool;
}