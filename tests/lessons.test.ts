import { describe, expect, test } from 'vitest';
import { LESSONS } from '../src/drills/lessons';
import { verifyDrill } from '../src/drills/runner';
import { parseKeys } from '../src/drills/keys';

describe('lesson drills', () => {
  const drills = LESSONS.flatMap((lesson) => lesson.drills);

  test('drill ids are unique', () => {
    expect(new Set(drills.map((d) => d.id)).size).toBe(drills.length);
  });

  test.each(drills.map((d) => [d.id, d] as const))('%s reference solution solves it in real vim', (_id, drill) => {
    expect(verifyDrill(drill)).toBe(true);
  });

  test.each(drills.map((d) => [d.id, d] as const))('%s is not already solved at the start', (_id, drill) => {
    expect(verifyDrill(drill, [])).toBe(false);
  });
});

describe('verifyDrill', () => {
  const drill = LESSONS.find((l) => l.id === 'change')!.drills[0];

  test('rejects a wrong answer', () => {
    expect(verifyDrill(drill, parseKeys('cwgreen<Esc>'))).toBe(false);
  });

  test('rejects an edit left in insert mode', () => {
    expect(verifyDrill(drill, parseKeys('cwblue'))).toBe(false);
  });
});
