import { describe, expect, test } from 'vitest';
import { describeKeys, groupKeys } from '../src/ai/key-summary';
import { parseKeys } from '../src/drills/keys';

const groups = (notation: string) => groupKeys(parseKeys(notation));

describe('groupKeys', () => {
  test('collapses repeats', () => {
    expect(groups('xxx')).toEqual([{ kind: 'command', keys: 'x', count: 3 }]);
  });

  test('keeps operator + motion together and captures changed text', () => {
    expect(groups('cwblue<Esc>')).toEqual([
      { kind: 'command', keys: 'cw', count: 1 },
      { kind: 'typed', text: 'blue' },
      { kind: 'command', keys: '<Esc>', count: 1 },
    ]);
  });

  test('handles text objects, counts and find arguments', () => {
    expect(groups('ci"Sam<Esc>')[0]).toEqual({ kind: 'command', keys: 'ci"', count: 1 });
    expect(groups('d2w')).toEqual([{ kind: 'command', keys: 'd2w', count: 1 }]);
    expect(groups('2dd')).toEqual([{ kind: 'command', keys: '2dd', count: 1 }]);
    expect(groups('f.;;')).toEqual([
      { kind: 'command', keys: 'f.', count: 1 },
      { kind: 'command', keys: ';', count: 2 },
    ]);
  });

  test('typed letters are not mistaken for commands', () => {
    expect(groups('ib<Esc>')).toEqual([
      { kind: 'command', keys: 'i', count: 1 },
      { kind: 'typed', text: 'b' },
      { kind: 'command', keys: '<Esc>', count: 1 },
    ]);
  });
});

describe('describeKeys', () => {
  test('labels known commands for the model', () => {
    expect(describeKeys(parseKeys('xxxiblue<Esc>'))).toBe(
      'x ×3 (delete character), i (insert before cursor), typed "blue", <Esc> (back to normal mode)',
    );
  });

  test('falls back to the base command meaning for counts', () => {
    expect(describeKeys(parseKeys('2dd'))).toBe('2dd (counts repeat a command)');
  });
});
