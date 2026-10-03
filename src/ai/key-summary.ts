import { LESSONS } from '../drills/lessons';

export type KeyGroup = { kind: 'command'; keys: string; count: number } | { kind: 'typed'; text: string };

const MEANING = new Map(LESSONS.flatMap((l) => l.commands.map((c) => [c.keys, c.name] as const)));

const INSERT_ENTRY = new Set(['i', 'a', 'I', 'A', 'o', 'O', 's', 'S', 'C']);
const OPERATORS = new Set(['d', 'c', 'y']);
const CHAR_ARG = new Set(['f', 'F', 't', 'T', 'r']);

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

  while (i < keys.length) {
    let cmd = '';
    while (/^[1-9]$/.test(keys[i] ?? '') || (cmd && keys[i] === '0')) cmd += take();
    const key = take();
    cmd += key;

    if (OPERATORS.has(key)) {
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
      if (INSERT_ENTRY.has(key)) typeUntilEsc();
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
      const meaning = MEANING.get(g.keys) ?? MEANING.get(g.keys.replace(/^\d+/, ''));
      return `${g.keys}${g.count > 1 ? ` ×${g.count}` : ''}${meaning ? ` (${meaning})` : ''}`;
    })
    .join(', ');
}
