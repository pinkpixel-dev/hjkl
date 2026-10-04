import { LESSONS } from '../drills/lessons';

export type KeyGroup = { kind: 'command'; keys: string; count: number } | { kind: 'typed'; text: string };

const MEANING = new Map(LESSONS.flatMap((l) => l.commands.map((c) => [c.keys, c.name] as const)));

const INSERT_ENTRY = new Set(['i', 'a', 'I', 'A', 'o', 'O', 's', 'S', 'C', 'R']);
const OPERATORS = new Set(['d', 'c', 'y', '>', '<']);
/** `g` operators like `gU`, written as one operator key. */
const G_OPERATORS = new Set(['gU', 'gu', 'g~']);
const CHAR_ARG = new Set(['f', 'F', 't', 'T', 'r']);
const SEARCH = new Set(['/', '?']);
/** Keys that open a prompt line, typed until Enter. */
const PROMPTS = new Set([...SEARCH, ':']);
/** Keys that take a register name: `"a`, `@a`. */
const REGISTER_ARG = new Set(['"', '@']);
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
  let recording = false;
  while (i < keys.length) {
    let cmd = '';
    while (/^[1-9]$/.test(keys[i] ?? '') || (cmd && keys[i] === '0')) cmd += take();
    let key = take();
    // `gg`, `gU` and friends are one command.
    if (key === 'g') key += take();
    cmd += key;

    if (PROMPTS.has(key)) {
      // `/fin<CR>` is one search and `:s/a/b/<CR>` one ex command, not a pile of keys.
      while (i < keys.length && keys[i] !== '<CR>' && keys[i] !== '<Esc>') cmd += take();
      push(cmd + take());
    } else if (visual && (OPERATORS.has(key) || key === 'U' || key === '>' || key === '<')) {
      // In visual mode operators act on the selection right away.
      visual = false;
      push(cmd);
      if (key === 'c') typeUntilEsc();
    } else if (REGISTER_ARG.has(key)) {
      push(cmd + take());
    } else if (key === 'q') {
      // The first q names a register and starts recording; the next one stops.
      push(recording ? cmd : cmd + take());
      recording = !recording;
    } else if (OPERATORS.has(key) || G_OPERATORS.has(key)) {
      while (/^[0-9]$/.test(keys[i] ?? '')) cmd += take(); // inner count, as in d2w
      let motion = take();
      if (motion === 'g') motion += take(); // dgg
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

/** Labels for commands whose exact keys aren't in any lesson's list, like `@b` or `:s/x/y/<CR>`. */
function fallbackMeaning(keys: string): string | undefined {
  if (SEARCH.has(keys[0])) return 'search';
  if (keys[0] === ':') return 'ex command';
  if (keys[0] === '"') return `use register ${keys[1]}`;
  if (keys[0] === '@') return `play macro ${keys[1]}`;
  if (/^q.$/.test(keys)) return `record macro into ${keys[1]}`;
  return undefined;
}

/** Human-readable form for prompts, e.g. `x ×3 (delete character), i (insert before cursor), typed "blue", <Esc>`. */
export function describeKeys(keys: readonly string[]): string {
  if (!keys.length) return '(nothing yet)';
  return groupKeys(keys)
    .map((g) => {
      if (g.kind === 'typed') return `typed ${JSON.stringify(g.text)}`;
      const meaning = MEANING.get(g.keys) ?? MEANING.get(g.keys.replace(/^\d+/, '')) ?? fallbackMeaning(g.keys);
      return `${g.keys}${g.count > 1 ? ` ×${g.count}` : ''}${meaning ? ` (${meaning})` : ''}`;
    })
    .join(', ');
}
