import type { Drill, Lesson } from '../drills/types';

/**
 * Drills you've solved but never at par, worst first (by how far over par, relative to par).
 * Hitting par on one drops it from the next review.
 */
export function buildReview(lessons: Lesson[], best: Record<string, number>): Drill[] {
  const overBy = (d: Drill) => (best[d.id] - d.par) / d.par;
  return lessons
    .flatMap((l) => l.drills)
    .filter((d) => best[d.id] !== undefined && best[d.id] > d.par)
    .sort((a, b) => overBy(b) - overBy(a));
}
