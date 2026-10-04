import { describe, expect, test } from 'vitest';
import { LESSONS } from '../src/drills/lessons';
import { buildFromText, choosePrompt, describeChange, diffWords, parseContent, toDrill } from '../src/drills/generated';
import { verifyDrill } from '../src/drills/runner';

/** Small deterministic PRNG so the tests don't flake. */
function seeded(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
}

const SAMPLE = 'let title = "draft" // (old notes)\nitems = [apple, pear], total: 3\nsave the report today';

describe('parseContent', () => {
  test('strips fences, trailing spaces and extra lines', () => {
    expect(parseContent('```js\nconst a = 1;  \n\nconst b = 2;\n```')).toBe('const a = 1;\nconst b = 2;');
  });

  test('rejects text that is too long for a drill', () => {
    expect(parseContent('x'.repeat(80))).toBeNull();
    expect(parseContent('')).toBeNull();
  });
});

describe('buildFromText', () => {
  test.each(LESSONS.map((l) => [l.id, l] as const))('%s builds drills that solve in real vim', (_id, lesson) => {
    const random = seeded(7);
    for (let i = 0; i < 4; i++) {
      const candidate = buildFromText(SAMPLE, lesson, lesson.drills, random);
      expect(candidate).not.toBeNull();
      if (!candidate) return;
      const { drill } = toDrill(candidate, describeChange(candidate.change), lesson, `t-${i}`);
      expect(drill.generated).toBe(true);
      expect(verifyDrill(drill)).toBe(true);
      expect(verifyDrill(drill, [])).toBe(false);
    }
  });

  test('never glues typed text onto another word or edits only punctuation', () => {
    const random = seeded(11);
    for (const lesson of LESSONS) {
      for (let i = 0; i < 6; i++) {
        const c = buildFromText(SAMPLE, lesson, lesson.drills, random);
        if (!c || c.change.kind !== 'edit') continue;
        expect(c.change.removed + c.change.inserted).toMatch(/[A-Za-z0-9]/);
        expect(c.goal).not.toMatch(/[ \t]$/m);
        const before = new Set(SAMPLE.toLowerCase().match(/\w+/g));
        for (const w of c.goal.toLowerCase().match(/\w+/g) ?? []) expect(before.has(w)).toBe(true);
      }
    }
  });

  test('returns null when there are no words to work with', () => {
    expect(buildFromText('1 2 3', LESSONS[1], LESSONS[1].drills)).toBeNull();
  });
});

describe('prompts', () => {
  test('diffWords widens to whole words', () => {
    expect(diffWords('the red car', 'the blue car')).toEqual({ removed: 'red', inserted: 'blue' });
    expect(diffWords('keep\ndrop me\nkeep', 'keep\nkeep')).toEqual({ removed: 'drop me', inserted: '' });
  });

  test('describeChange is always accurate', () => {
    expect(describeChange({ kind: 'edit', removed: 'red', inserted: 'blue' })).toBe('Change "red" to "blue"');
    expect(describeChange({ kind: 'edit', removed: 'extra', inserted: '' })).toBe('Delete "extra"');
    expect(describeChange({ kind: 'move', landOn: 'brown', at: 'start', char: 'b' })).toBe('Land on "brown"');
    expect(describeChange({ kind: 'move', landOn: 'status', at: 'end', char: 's' })).toBe('Land on the end of "status"');
    expect(describeChange({ kind: 'move', landOn: 'call', at: 'char', char: '(' })).toBe('Land on the "("');
  });

  test("keeps the model's prompt only when it mentions what changed", () => {
    const change = { kind: 'edit', removed: 'red', inserted: 'blue' } as const;
    expect(choosePrompt('"Paint it blue."', change)).toBe('Paint it blue');
    expect(choosePrompt('Remove "red', change)).toBe('Change "red" to "blue"');
    expect(choosePrompt('Remove extra blue', change)).toBe('Change "red" to "blue"');
    expect(choosePrompt('Drop the red', { kind: 'edit', removed: 'red', inserted: '' })).toBe('Drop the red');
    expect(describeChange({ kind: 'edit', removed: '', inserted: 'row', copied: true })).toBe('Duplicate "row"');
    expect(choosePrompt('Jump to the next word', change)).toBe('Change "red" to "blue"');
    expect(choosePrompt('Here is a long instruction that rambles on and on', change)).toBe('Change "red" to "blue"');
  });
});
