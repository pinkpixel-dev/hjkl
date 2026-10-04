import type { CoachDtype, ModelKey } from './model-config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type ToWorker =
  | { type: 'load'; model: ModelKey }
  /** `sample` adds randomness, so repeated drill requests don't all come out the same. */
  | { type: 'generate'; id: number; messages: ChatMessage[]; maxTokens: number; sample: boolean }
  | { type: 'abort' };

export type FromWorker =
  | { type: 'loading'; dtype: CoachDtype }
  | { type: 'progress'; loaded: number }
  | { type: 'ready' }
  | { type: 'token'; id: number; text: string }
  | { type: 'done'; id: number; tokensPerSecond: number }
  | { type: 'error'; message: string; fatal: boolean };
