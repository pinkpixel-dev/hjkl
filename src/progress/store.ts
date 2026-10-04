import type { DrillDef } from '../drills/types';

const KEY = 'hjkl:progress:v1';

export interface Progress {
  /** Fewest keystrokes used to solve each drill. */
  best: Record<string, number>;
  last: { lessonId: string; drillIndex: number } | null;
}

const empty = (): Progress => ({ best: {}, last: null });

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch {
    return empty();
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage blocked (private window etc). Progress just won't persist.
  }
}

/** Records a solve. Returns true if it beat the previous best. */
export function recordSolve(progress: Progress, drillId: string, keyCount: number): boolean {
  const prev = progress.best[drillId];
  if (prev !== undefined && prev <= keyCount) return false;
  progress.best[drillId] = keyCount;
  return true;
}

const COACH_KEY = 'hjkl:coach:v1';

export interface CoachPrefs {
  enabled: boolean;
  model: string | null;
}

export function loadCoachPrefs(): CoachPrefs {
  try {
    const raw = localStorage.getItem(COACH_KEY);
    return raw ? { enabled: false, model: null, ...JSON.parse(raw) } : { enabled: false, model: null };
  } catch {
    return { enabled: false, model: null };
  }
}

export function saveCoachPrefs(prefs: CoachPrefs): void {
  try {
    localStorage.setItem(COACH_KEY, JSON.stringify(prefs));
  } catch {
    // Not critical: the coach just won't auto-start next time.
  }
}

const GENERATED_KEY = 'hjkl:generated:v1';

/** AI-written drills, stored as authored definitions per lesson id. */
export type GeneratedStore = Record<string, DrillDef[]>;

export function loadGenerated(): GeneratedStore {
  try {
    return JSON.parse(localStorage.getItem(GENERATED_KEY) ?? '{}') as GeneratedStore;
  } catch {
    return {};
  }
}

export function saveGenerated(store: GeneratedStore): void {
  try {
    localStorage.setItem(GENERATED_KEY, JSON.stringify(store));
  } catch {
    // Generated drills just won't survive a reload.
  }
}
