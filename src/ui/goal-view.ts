import type { Drill } from '../drills/types';
import { h } from './dom';

/** Shows what the buffer should look like: the target char, or the changed lines. */
export function renderGoal(drill: Drill): HTMLElement {
  if (drill.kind === 'cursor' && drill.goalCursor !== null) {
    const text = drill.goalText;
    const at = drill.goalCursor;
    return h(
      'pre',
      { class: 'goal', 'aria-label': `Move the cursor to position ${at + 1}` },
      text.slice(0, at),
      h('mark', { class: 'goal-char' }, text.charAt(at) || ' '),
      text.slice(at + 1),
    );
  }
  // A goal line is "changed" only if the start buffer doesn't already have it.
  // Counting matches (not comparing by index) keeps deletions from lighting up every line below.
  const available = new Map<string, number>();
  for (const line of drill.startText.split('\n')) available.set(line, (available.get(line) ?? 0) + 1);
  const lines = drill.goalText.split('\n').map((line) => {
    const left = available.get(line) ?? 0;
    if (left) available.set(line, left - 1);
    return h('span', { class: left ? 'goal-line' : 'goal-line is-changed' }, line || ' ');
  });
  return h('pre', { class: 'goal' }, ...lines);
}
