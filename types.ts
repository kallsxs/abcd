export interface Point {
  x: number;
  y: number;
}

export interface ParticleConfig {
  friction: number;
  ease: number;
  spacing: number;
  radius: number;
  repulsionRadius: number;
  repulsionForce: number;
}

export enum ShapeType {
  TEXT = 'TEXT',
  AI_SHAPE = 'AI_SHAPE',
  RANDOM = 'RANDOM'
}

export interface GenerationState {
  isGenerating: boolean;
  error: string | null;
  currentPrompt: string;
}

// Global types for MediaPipe
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}
