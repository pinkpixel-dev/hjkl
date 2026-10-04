import { buildDrill, CURSOR_MARK } from './drill-engine';
import { parseKeys } from './keys';
import { playKeys } from './runner';
import { groupKeys, type KeyGroup } from '../ai/key-summary';
import type { Drill, DrillDef, Lesson } from './types';

const MAX_TEXT = 140;
const MAX_LINES = 3;
const MAX_ATTEMPTS = 150;

/**
 * Pulls usable buffer text out of a model reply: drops code fences, trims trailing spaces,
 * and keeps at most a few short lines.
 */
export function parseContent(raw: string): string | null {
  const lines = raw
    .replace(/```[a-z]*\n?/gi, '')
    .split('\n')
    .map((l) => l.replace(/\s+$/, '').replace(CURSOR_MARK, ''))
    .filter((l) => l.trim())
    .slice(0, MAX_LINES);
  const text = lines.join('\n');
  if (!text || text.length > MAX_TEXT || lines.some((l) => l.length > 60)) return null;
  return text;
}

/** A drill built from new text, before it has a prompt. */
export interface Candidate {
  start: string;
  goal: string;
  solution: string;
  /** What changed, for writing and checking the prompt. */
  change:
    | { kind: 'edit'; removed: string; inserted: string; copied?: boolean }
    | { kind: 'move'; landOn: string; at: 'start' | 'end' | 'inside' | 'char'; char: string };
}

type Swap = (original: string, kind: 'typed' | 'search' | 'pattern') => string;

/** Turns groups back into raw keys, swapping typed text and search terms via `swap`. */
function rebuild(groups: KeyGroup[], swap: Swap): string[] {
  return groups.flatMap((g) => {
    if (g.kind === 'typed') return [...swap(g.text, 'typed')];
    if (/^[/?].+<CR>$/.test(g.keys)) return parseKeys(`${g.keys[0]}${swap(g.keys.slice(1, -4), 'search')}<CR>`);
    // `:s/old/new/g`: aim the pattern at a word in the new text. Punctuation patterns stay as they are.
    const sub = g.keys.match(/^:(%?)s\/([^/]*)\/([^/]*)\/(g?)<CR>$/);
    if (sub) {
      const [, range, from, to, flags] = sub;
      const pattern = /[A-Za-z]/.test(from) ? swap(from, 'pattern') : from;
      return parseKeys(`:${range}s/${pattern}/${to && swap(to, 'typed')}/${flags}<CR>`);
    }
    return Array.from({ length: g.count }, () => parseKeys(g.keys)).flat();
  });
}

const words = (text: string) => [...new Set(text.match(/[A-Za-z]{3,}/g) ?? [])];
const tokens = (text: string) => new Set((text.toLowerCase().match(/\w+/g) ?? []));

/** Spots worth trying: word starts and punctuation that motions like `f,` or `ci(` care about. */
function spots(text: string): number[] {
  const found = new Set([0]);
  for (const m of text.matchAll(/(?<!\w)\w|[(\[{"',:;.=]/g)) found.add(m.index ?? 0);
  return [...found].filter((i) => text[i] !== '\n');
}

/**
 * Builds a drill on `text` by reusing the key patterns of the lesson's hand-written drills.
 * Every candidate is played in real vim, so the goal and par are always right. Returns null if
 * none of the lesson's patterns do something meaningful on this text.
 */
export function buildFromText(
  text: string,
  lesson: Lesson,
  existing: Drill[],
  random: () => number = Math.random,
): Candidate | null {
  const templates = lesson.drills.filter((d) => !d.generated).map((d) => groupKeys(d.solution));
  const pool = words(text);
  if (!templates.length || !pool.length) return null;
  const pick = <T>(xs: T[]) => xs[Math.floor(random() * xs.length)];
  const positions = spots(text);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const template = pick(templates);
    const cursor = pick(positions);
    const keys = rebuild(template, (original, kind) => {
      // Search terms only need a short prefix of a word that's in the buffer.
      if (kind === 'search') return pick(pool).slice(0, 3);
      if (kind === 'pattern') return pick(pool);
      // Typed words become words from the new text; punctuation like `;` or `)` stays as it was.
      return original.replace(/[A-Za-z]{2,}(?: [A-Za-z]+)*/, () => pick(pool));
    });
    const editing = template.some(
      (g) => g.kind === 'typed' || (g.kind === 'command' && /^\d*([dcxpPsSCDUoOAIyYJrR~>:]|g[Uu~]|<C-[ax]>)/.test(g.keys)),
    );

    const end = playKeys(text, cursor, keys);
    if (end.busy) continue;
    if (existing.some((d) => d.startText === text && d.solution.join('') === keys.join(''))) continue;
    const start = text.slice(0, cursor) + CURSOR_MARK + text.slice(cursor);

    if (editing) {
      if (end.text === text || !end.text.trim() || /[ \t]$/m.test(end.text)) continue;
      const { removed, inserted } = diffWords(text, end.text);
      // Skip edits that only shuffle punctuation, or glue typed text onto another word
      // ("tomorrow42"): every new word must be a real word from the snippet.
      if (!/[A-Za-z0-9]/.test(removed + inserted)) continue;
      const before = tokens(text);
      const allowed = new Set(pool.map((w) => w.toLowerCase()));
      if ([...tokens(end.text)].some((w) => !before.has(w) && !allowed.has(w))) continue;
      const copied = !removed && text.split('\n').some((line) => line.trim() === inserted.split('\n')[0]);
      return { start, goal: end.text, solution: keys.join(''), change: { kind: 'edit', removed, inserted, copied } };
    }
    if (end.text !== text || end.cursor === cursor) continue;
    const goal = text.slice(0, end.cursor) + CURSOR_MARK + text.slice(end.cursor);
    return { start, goal, solution: keys.join(''), change: { kind: 'move', ...landing(text, end.cursor) } };
  }
  return null;
}

/** The removed and inserted text between two buffers, widened to whole words where an edit splits one. */
export function diffWords(before: string, after: string): { removed: string; inserted: string } {
  let head = 0;
  while (head < before.length && head < after.length && before[head] === after[head]) head++;
  let tail = 0;
  while (
    tail < before.length - head &&
    tail < after.length - head &&
    before[before.length - 1 - tail] === after[after.length - 1 - tail]
  )
    tail++;
  const isWord = (c: string | undefined) => c !== undefined && /\w/.test(c);
  // Widen both sides together, so "red" → "blue" reads as whole words in both, but deleting a
  // full line doesn't drag in the next one.
  let left = 0;
  while (head - left > 0 && isWord(before[head - left - 1]) && (isWord(before[head]) || isWord(after[head]))) left++;
  let right = 0;
  while (
    isWord(before[before.length - tail + right]) &&
    (isWord(before[before.length - tail - 1]) || isWord(after[after.length - tail - 1]))
  )
    right++;
  const span = (s: string) => {
    const from = head - left;
    const to = s.length - tail + right;
    return from >= s.length - tail && left === 0 && right === 0 ? '' : s.slice(from, to).trim();
  };
  return { removed: span(before), inserted: span(after) };
}

/** Describes where a cursor lands: the start, end or middle of a word, or on punctuation. */
function landing(text: string, at: number): { landOn: string; at: 'start' | 'end' | 'inside' | 'char'; char: string } {
  const char = text.charAt(at);
  if (!/\w/.test(char)) return { landOn: text.slice(0, at).match(/\w+\W*$/)?.[0].match(/\w+/)?.[0] ?? char, at: 'char', char };
  const from = text.slice(0, at).search(/\w*$/);
  const word = text.slice(from).match(/^\w+/)?.[0] ?? char;
  const where = at === from ? 'start' : at === from + word.length - 1 ? 'end' : 'inside';
  return { landOn: word, at: where, char };
}

const clip = (s: string) => (s.length > 18 ? `${s.slice(0, 16).trimEnd()}…` : s).replace(/\n/g, ' ');

/** An always-accurate prompt written straight from the change. */
export function describeChange(change: Candidate['change']): string {
  if (change.kind === 'move') {
    const word = clip(change.landOn);
    if (change.at === 'start') return `Land on "${word}"`;
    if (change.at === 'end') return `Land on the end of "${word}"`;
    if (change.at === 'inside') return `Land on the "${change.char}" in "${word}"`;
    return `Land on the "${change.char}"`;
  }
  const { removed, inserted } = change;
  if (removed && inserted) return `Change "${clip(removed)}" to "${clip(inserted)}"`;
  if (removed) return `Delete "${clip(removed)}"`;
  return change.copied ? `Duplicate "${clip(inserted)}"` : `Add "${clip(inserted)}"`;
}

/**
 * Keeps the model's prompt only if it's short and mentions something that actually changed.
 * Otherwise falls back to the plain description, so the prompt never contradicts the goal.
 */
export function choosePrompt(raw: string, change: Candidate['change']): string {
  let prompt = raw.split('\n')[0].trim().replace(/[.!]+$/, '').replace(/^\*+|\*+$/g, '');
  // Strip one pair of wrapping quotes, but leave quotes inside the prompt alone.
  const wrapped = prompt.match(/^(["'`])(.*)\1$/);
  if (wrapped) prompt = wrapped[2].trim().replace(/[.!]+$/, '');
  if ((prompt.match(/"/g) ?? []).length % 2) return describeChange(change);
  const fallback = describeChange(change);
  if (!prompt || prompt.split(/\s+/).length > 7 || prompt.length > 50) return fallback;
  if (change.kind === 'move') return fallback;
  const lower = prompt.toLowerCase();
  const mentions = (text: string) => words(text.toLowerCase()).some((w) => lower.includes(w));
  const deleting = /^(remove|delete|drop|cut|clear|erase)\b/.test(lower);
  // A prompt has to name what's new if anything is typed, and only say "delete" when nothing is.
  const fits = change.inserted ? mentions(change.inserted) && !deleting : mentions(change.removed) && deleting;
  return fits ? prompt : fallback;
}

export function toDrill(candidate: Candidate, prompt: string, lesson: Lesson, id: string): { drill: Drill; def: DrillDef } {
  const def: DrillDef = { id, prompt, start: candidate.start, goal: candidate.goal, solution: candidate.solution };
  return { drill: { ...buildDrill(def, lesson.id), generated: true }, def };
}

/** Lessons with saved AI drills appended. Returns fresh lesson objects, so the originals stay hand-written only. */
export function withGenerated(lessons: Lesson[], saved: Record<string, DrillDef[]>): Lesson[] {
  return lessons.map((l) => ({
    ...l,
    drills: [...l.drills, ...(saved[l.id] ?? []).map((def) => ({ ...buildDrill(def, l.id), generated: true }))],
  }));
}
