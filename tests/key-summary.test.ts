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

describe('search and visual mode', () => {
  test('a search is one group', () => {
    expect(groups('/fin<CR>n')).toEqual([
      { kind: 'command', keys: '/fin<CR>', count: 1 },
      { kind: 'command', keys: 'n', count: 1 },
    ]);
    expect(describeKeys(parseKeys('/bu<CR>'))).toBe('/bu<CR> (search)');
  });

  test('operators in visual mode act on the selection', () => {
    expect(groups('ved')).toEqual([
      { kind: 'command', keys: 'v', count: 1 },
      { kind: 'command', keys: 'e', count: 1 },
      { kind: 'command', keys: 'd', count: 1 },
    ]);
    expect(groups('veecbye<Esc>').slice(2)).toEqual([
      { kind: 'command', keys: 'c', count: 1 },
      { kind: 'typed', text: 'bye' },
      { kind: 'command', keys: '<Esc>', count: 1 },
    ]);
  });

  test('i inside visual mode is not insert', () => {
    expect(groups('viwU').map((g) => (g.kind === 'command' ? g.keys : g.text))).toEqual(['v', 'i', 'w', 'U']);
  });
});

describe('jumps, ex commands, macros and registers', () => {
  const keysOf = (notation: string) => groups(notation).map((g) => (g.kind === 'command' ? g.keys : `"${g.text}"`));

  test('g commands and operators stay whole', () => {
    expect(keysOf('ggdgg')).toEqual(['gg', 'dgg']);
    expect(keysOf('gUw3>>')).toEqual(['gUw', '3>>']);
  });

  test('an ex command is one group', () => {
    expect(keysOf(':%s/x/y/g<CR>')).toEqual([':%s/x/y/g<CR>']);
    expect(describeKeys(parseKeys(':s/a/b/<CR>'))).toBe(':s/a/b/<CR> (ex command)');
  });

  test('recording a macro', () => {
    expect(keysOf('qaI"<Esc>jq2@a@@')).toEqual(['qa', 'I', '"""', '<Esc>', 'j', 'q', '2@a', '@@']);
    expect(describeKeys(parseKeys('qbq@b'))).toBe('qb (record macro into b), q (stop recording), @b (play macro b)');
  });

  test('registers and replace mode', () => {
    expect(keysOf('"ayy"ap')).toEqual(['"a', 'yy', '"a', 'p']);
    expect(keysOf('R2026<Esc>')).toEqual(['R', '"2026"', '<Esc>']);
  });
});
