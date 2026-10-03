export type ModelKey = 'gemma-4-e2b' | 'gemma-3-1b';
/** q4f16 needs the WebGPU shader-f16 feature; q4 is the fallback. */
export type CoachDtype = 'q4f16' | 'q4';

export interface CoachModel {
  key: ModelKey;
  label: string;
  /** Short tradeoff shown in the picker. */
  note: string;
  repo: string;
  /** Approximate text-only download per dtype, used for the progress bar. */
  approxBytes: Record<CoachDtype, number>;
}

// Both load through the text-generation path, so Transformers.js only fetches
// embed_tokens + decoder for Gemma 4 and skips the vision and audio encoders.
export const MODELS: Record<ModelKey, CoachModel> = {
  'gemma-4-e2b': {
    key: 'gemma-4-e2b',
    label: 'Gemma 4 E2B',
    note: 'better',
    repo: 'onnx-community/gemma-4-E2B-it-ONNX',
    approxBytes: { q4f16: 3.11e9, q4: 3.63e9 },
  },
  'gemma-3-1b': {
    key: 'gemma-3-1b',
    label: 'Gemma 3 1B',
    note: 'faster',
    repo: 'onnx-community/gemma-3-1b-it-ONNX',
    approxBytes: { q4f16: 0.77e9, q4: 0.86e9 },
  },
};

export const DEFAULT_MODEL: ModelKey = 'gemma-4-e2b';

export function formatBytes(bytes: number): string {
  return bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`;
}
