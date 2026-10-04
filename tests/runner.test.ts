import { expect, test } from 'vitest';
import { Vim } from '@replit/codemirror-vim';
import { playKeys } from '../src/drills/runner';
import { parseKeys } from '../src/drills/keys';

test('playKeys reports where the keys end up', () => {
  expect(playKeys('one two', 0, parseKeys('dw'))).toEqual({ text: 'two', cursor: 0, busy: false });
  expect(playKeys('one two', 0, parseKeys('cwnew'))).toMatchObject({ text: 'new two', busy: true });
});

test("playKeys leaves the learner's vim state alone", () => {
  const before = Vim.getVimGlobalState_();
  const registers = before.registerController;
  const jumps = before.jumpList;
  playKeys('a\nb\ntarget', 0, parseKeys('/tar<CR>yy'));
  const after = Vim.getVimGlobalState_();
  expect(after.registerController).toBe(registers);
  expect(after.jumpList).toBe(jumps);
  expect(after.searchQuery).toBe(before.searchQuery);
});
