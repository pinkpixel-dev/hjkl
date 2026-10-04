import { BookOpen } from 'lucide';
import type { Lesson } from '../drills/types';
import { h, icon } from './dom';
import { commandTable } from './reference';

export function renderCheatsheet(container: HTMLElement, lesson: Lesson, onOpenAll: () => void): void {
  container.replaceChildren(
    h(
      'div',
      { class: 'side-head' },
      h('h2', { class: 'side-heading' }, 'Cheat sheet'),
      h(
        'button',
        { class: 'btn btn-ghost', type: 'button', title: 'Every command from every lesson', onclick: onOpenAll },
        icon(BookOpen, 14),
        'All commands',
      ),
    ),
    commandTable(lesson.commands),
  );
}
