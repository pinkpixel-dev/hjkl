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
