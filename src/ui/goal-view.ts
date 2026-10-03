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
  const before = drill.startText.split('\n');
  const lines = drill.goalText.split('\n').map((line, i) =>
    h('span', { class: line === before[i] ? 'goal-line' : 'goal-line is-changed' }, line || ' '),
  );
  return h('pre', { class: 'goal' }, ...lines);
}
