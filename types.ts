export enum AgentRole {
  PRODUCT_OWNER = 'PRODUCT_OWNER',
  MECHANIC = 'MECHANIC',
  INNOVATOR = 'INNOVATOR',
  TECH_LEAD = 'TECH_LEAD',
  DESIGNER = 'DESIGNER',
  QA_ENGINEER = 'QA_ENGINEER',
  SYNTHESIZER = 'SYNTHESIZER',
  CRITIC = 'CRITIC'
}

export type AppMode = 'STATIC_SITE' | 'TG_BOT' | 'PROMPT_OPTIMIZER';
export type BotLanguage = 'javascript' | 'python';

export interface Agent {
  id: AgentRole;
  name: string;
  title: string;
  description: string;
}

export interface LogMessage {
  id: string;
  agentId: AgentRole;
  content: string;
  timestamp: number;
  mode?: AppMode;
}

export interface PipelineState {
  isProcessing: boolean;
  currentStep: AgentRole | null;
  progress: number; // 0 to 100
  finished: boolean;
  phase: 'draft' | 'critique' | 'refinement';
  mode: AppMode;
}

export type AccentColor = 'cyan' | 'violet' | 'emerald' | 'amber';

export interface Attachment {
  id: string;
  file: File;
  previewUrl: string;
  mimeType: string;
}

export interface VirtualFile {
  name: string;
  language: string;
  content: string;
  readOnly?: boolean;
}

export interface TerminalLog {
  id: string;
  type: 'info' | 'error' | 'success' | 'command';
  content: string;
  timestamp: number;
}