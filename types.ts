export enum HalftoneShape {
  CIRCLE = 'Círculo',
  SQUARE = 'Quadrado',
  LINE = 'Linha',
  DIAMOND = 'Diamante'
}

export interface ProcessingSettings {
  blackThreshold: number; // 0-255, pixels darker than this become transparent
  gridSize: number; // Size of the halftone cell in pixels
  shape: HalftoneShape;
  colorMode: 'original' | 'mono'; // Keep colors or single color
  monoColor: string; // Hex code if mono
  intensity: number; // 0.1 - 2.0, Multiplier for dot size
  invert: boolean; // Invert the mask
}

export interface AIAnalysisResult {
  suggestedShape: HalftoneShape;
  suggestedGridSize: number;
  reasoning: string;
}

// --- Auth Types ---

export type UserRole = 'admin' | 'user';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  password: string; // In a real app, this would be hashed
  name: string;
  role: UserRole;
  credits: number;
  status: UserStatus;
  createdAt: string;
}
