import { Check, RotateCw } from 'lucide';
import type { Lesson } from '../drills/types';
import type { Progress } from '../progress/store';
import { h, icon } from './dom';

export function renderSidebar(
  container: HTMLElement,
  lessons: Lesson[],
  progress: Progress,
  currentId: string,
  reviewCount: number,
  onSelect: (lessonIndex: number) => void,
  onReview: () => void,
): void {
  const inReview = currentId === 'review';
  const review = h(
    'button',
    {
      class: `lesson lesson-review${inReview ? ' is-current' : ''}`,
      'aria-current': inReview ? 'true' : undefined,
      disabled: !reviewCount && !inReview,
      title: reviewCount ? `${reviewCount} ${reviewCount === 1 ? 'drill' : 'drills'} still over par` : 'Nothing to review yet. Drills you solve over par show up here.',
      onclick: onReview,
    },
    h('span', { class: 'lesson-num' }, icon(RotateCw, 13)),
    h('span', { class: 'lesson-title' }, 'Review'),
    h('span', { class: 'lesson-count' }, String(reviewCount)),
  );
  const items = lessons.map((lesson, index) => {
    const done = lesson.drills.filter((d) => progress.best[d.id] !== undefined).length;
    const complete = done === lesson.drills.length;
    const current = lesson.id === currentId;
    return h(
      'li',
      {},
      h(
        'button',
        {
          class: `lesson${current ? ' is-current' : ''}${complete ? ' is-complete' : ''}`,
          'aria-current': current ? 'true' : undefined,
          title: `${lesson.title}: ${done} of ${lesson.drills.length} drills solved`,
          onclick: () => onSelect(index),
        },
        h('span', { class: 'lesson-num' }, complete ? icon(Check, 14) : String(index + 1)),
        h('span', { class: 'lesson-title' }, lesson.title),
        h('span', { class: 'lesson-count' }, `${done}/${lesson.drills.length}`),
      ),
    );
  });
  container.replaceChildren(review, h('h2', { class: 'side-heading' }, 'Lessons'), h('ol', { class: 'lessons' }, ...items));
}
