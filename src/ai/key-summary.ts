import { LESSONS } from '../drills/lessons';

export type KeyGroup = { kind: 'command'; keys: string; count: number } | { kind: 'typed'; text: string };

const MEANING = new Map(LESSONS.flatMap((l) => l.commands.map((c) => [c.keys, c.name] as const)));

const INSERT_ENTRY = new Set(['i', 'a', 'I', 'A', 'o', 'O', 's', 'S', 'C']);
const OPERATORS = new Set(['d', 'c', 'y']);
const CHAR_ARG = new Set(['f', 'F', 't', 'T', 'r']);
const SEARCH = new Set(['/', '?']);
const VISUAL_ENTRY = new Set(['v', 'V']);

/**
 * Splits raw keys into vim-shaped groups: `cw`, `f,` and `2dd` stay whole, and
 * text typed in insert mode becomes one `typed` group. It's a reading aid for
 * the model, not a full vim parser, so unusual sequences fall back to single keys.
 */
export function groupKeys(keys: readonly string[]): KeyGroup[] {
  const groups: KeyGroup[] = [];
  let i = 0;
  const take = () => keys[i++] ?? '';

  const push = (cmd: string) => {
    const last = groups[groups.length - 1];
    if (last?.kind === 'command' && last.keys === cmd) last.count++;
    else groups.push({ kind: 'command', keys: cmd, count: 1 });
  };

  const typeUntilEsc = () => {
    let text = '';
    while (i < keys.length && keys[i] !== '<Esc>') {
      const k = take();
      text += k === '<CR>' ? '\n' : k.length === 1 ? k : '';
    }
    if (text) groups.push({ kind: 'typed', text });
  };

  let visual = false;
  while (i < keys.length) {
    let cmd = '';
    while (/^[1-9]$/.test(keys[i] ?? '') || (cmd && keys[i] === '0')) cmd += take();
    const key = take();
    cmd += key;

    if (SEARCH.has(key)) {
      // `/fin<CR>` is one search, not four keys.
      while (i < keys.length && keys[i] !== '<CR>' && keys[i] !== '<Esc>') cmd += take();
      push(cmd + take());
    } else if (visual && (OPERATORS.has(key) || key === 'U' || key === '>' || key === '<')) {
      // In visual mode operators act on the selection right away.
      visual = false;
      push(cmd);
      if (key === 'c') typeUntilEsc();
    } else if (OPERATORS.has(key)) {
      while (/^[0-9]$/.test(keys[i] ?? '')) cmd += take(); // inner count, as in d2w
      const motion = take();
      cmd += motion;
      if (motion === 'i' || motion === 'a' || CHAR_ARG.has(motion)) cmd += take();
      push(cmd);
      if (key === 'c') typeUntilEsc();
    } else if (CHAR_ARG.has(key)) {
      push(cmd + take());
    } else {
      push(cmd);
      if (VISUAL_ENTRY.has(key)) visual = true;
      else if (key === '<Esc>') visual = false;
      else if (!visual && INSERT_ENTRY.has(key)) typeUntilEsc();
    }
  }
  return groups;
}

/** Human-readable form for prompts, e.g. `x ×3 (delete character), i (insert before cursor), typed "blue", <Esc>`. */
export function describeKeys(keys: readonly string[]): string {
  if (!keys.length) return '(nothing yet)';
  return groupKeys(keys)
    .map((g) => {
      if (g.kind === 'typed') return `typed ${JSON.stringify(g.text)}`;
      const meaning = MEANING.get(g.keys) ?? MEANING.get(g.keys.replace(/^\d+/, '')) ?? (SEARCH.has(g.keys[0]) ? 'search' : undefined);
      return `${g.keys}${g.count > 1 ? ` ×${g.count}` : ''}${meaning ? ` (${meaning})` : ''}`;
    })
    .join(', ');
}
