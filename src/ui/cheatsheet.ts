import type { Lesson } from '../drills/types';
import { h } from './dom';

export function renderCheatsheet(container: HTMLElement, lesson: Lesson): void {
  const rows = lesson.commands.map((c) =>
    h(
      'tr',
      {},
      h('td', {}, h('kbd', {}, c.keys)),
      h('td', { class: 'cmd-name' }, c.name),
      h('td', { class: 'cmd-vscode' }, c.vscode ?? h('span', { class: 'faint', title: 'No VS Code equivalent' }, '—')),
    ),
  );
  container.replaceChildren(
    h('h2', { class: 'side-heading' }, 'Cheat sheet'),
    h(
      'table',
      { class: 'cheatsheet' },
      h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Vim'), h('th', { scope: 'col' }, 'Does'), h('th', { scope: 'col' }, 'VS Code'))),
      h('tbody', {}, ...rows),
    ),
  );
}
