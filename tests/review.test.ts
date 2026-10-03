import { describe, expect, test } from 'vitest';
import { LESSONS } from '../src/drills/lessons';
import { buildReview } from '../src/progress/review';

const drill = (id: string) => LESSONS.flatMap((l) => l.drills).find((d) => d.id === id)!;

describe('buildReview', () => {
  test('only includes solved drills that are still over par', () => {
    const best = {
      'hjkl-1': drill('hjkl-1').par, // at par
      'delete-1': drill('delete-1').par + 5, // over
      'change-1': drill('change-1').par - 1, // under
    };
    expect(buildReview(LESSONS, best).map((d) => d.id)).toEqual(['delete-1']);
  });

  test('worst relative miss comes first', () => {
    // delete-1 has par 2, change-1 has par 7. +2 on par 2 is worse than +4 on par 7.
    const best = { 'change-1': drill('change-1').par + 4, 'delete-1': drill('delete-1').par + 2 };
    expect(buildReview(LESSONS, best).map((d) => d.id)).toEqual(['delete-1', 'change-1']);
  });

  test('is empty with no progress', () => {
    expect(buildReview(LESSONS, {})).toEqual([]);
  });
});
