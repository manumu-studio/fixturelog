// JuniorVoiceAssistant.types.ts - props and state labels for the cluster-to-assistant visual.

export type JuniorVoiceAssistantState = 'dispersed' | 'forming' | 'formed';

export interface JuniorVoiceAssistantProps {
  readonly className?: string;
  readonly label?: string;
  readonly formingHint?: boolean;
}

export interface AssistantDot {
  dispersedX: number;
  dispersedY: number;
  formedX: number;
  formedY: number;
  formedZ: number;
  centerX: number;
  centerY: number;
  sphereRadius: number;
  currentX: number;
  currentY: number;
  currentDepth: number;
  color: string;
  formedColor: string;
  radius: number;
  phaseX: number;
  phaseY: number;
  speed: number;
}
