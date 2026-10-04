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
  // Lines matching from the top and from the bottom are unchanged; whatever sits between them
  // in the goal is new. A pure deletion leaves nothing between, so nothing lights up.
  const before = drill.startText.split('\n');
  const after = drill.goalText.split('\n');
  let top = 0;
  while (top < before.length && top < after.length && before[top] === after[top]) top++;
  let bottom = 0;
  while (
    bottom < before.length - top &&
    bottom < after.length - top &&
    before[before.length - 1 - bottom] === after[after.length - 1 - bottom]
  )
    bottom++;
  const lines = after.map((line, i) => {
    const changed = i >= top && i < after.length - bottom;
    return h('span', { class: changed ? 'goal-line is-changed' : 'goal-line' }, line || ' ');
  });
  return h('pre', { class: 'goal' }, ...lines);
}
