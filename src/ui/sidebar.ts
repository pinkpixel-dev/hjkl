import { Check } from 'lucide';
import type { Lesson } from '../drills/types';
import type { Progress } from '../progress/store';
import { h, icon } from './dom';

export function renderSidebar(
  container: HTMLElement,
  lessons: Lesson[],
  progress: Progress,
  currentLessonId: string,
  onSelect: (lessonIndex: number) => void,
): void {
  const items = lessons.map((lesson, index) => {
    const done = lesson.drills.filter((d) => progress.best[d.id] !== undefined).length;
    const complete = done === lesson.drills.length;
    const current = lesson.id === currentLessonId;
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
  container.replaceChildren(h('h2', { class: 'side-heading' }, 'Lessons'), h('ol', { class: 'lessons' }, ...items));
}
