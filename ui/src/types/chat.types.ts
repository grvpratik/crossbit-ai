import type React from 'react';
import type { Message } from '@ai-sdk/react';
import type { AccountIdentifierEnum } from '@/lib/solana';

/**
 * Represents a user address with its type classification
 */
export interface UserAddress {
  address: string;
  type: AccountIdentifierEnum;
}

/**
 * Chat mode configuration interface
 */
export interface ChatMode {
  modeId: string;
  modeName: string;
  icon?: React.ComponentType<{ className?: string }>;
  featured: boolean;
  disabled?: boolean;
  requiredAddress?: number;
  requiredTokenTypes?: AccountIdentifierEnum[];
}

/**
 * Chat input component props
 */
export interface ChatInputProps {
  messages: Message[];
  chatId: string;
  mode: ChatMode | null;
  setMode: (mode: ChatMode | null) => void;
  status: 'idle' | 'submitted' | 'streaming';
  append: (message: { role: 'user'; content: string }) => void;
  stop: () => void;
}

/**
 * Research progress annotation structure
 */
export interface ResearchProgress {
  type: 'research_progress';
  steps: string[];
  currentStep: string | null;
  overallProgress: number;
  completed: boolean;
  summary?: any;
}
