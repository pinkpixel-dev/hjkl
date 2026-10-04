import { Search, X } from 'lucide';
import type { Command, Lesson } from '../drills/types';
import { h, icon, keyChip } from './dom';

/** One row of the cheat sheet. Shared by the lesson panel and the full reference. */
export function commandRow(c: Command): HTMLTableRowElement {
  return h(
    'tr',
    {},
    h('td', {}, keyChip(c.keys)),
    h('td', { class: 'cmd-name' }, c.name),
    h('td', { class: 'cmd-vscode' }, c.vscode ?? h('span', { class: 'faint', title: 'No VS Code equivalent' }, '—')),
  );
}

export function commandTable(commands: Command[], caption?: string): HTMLTableElement {
  return h(
    'table',
    { class: 'cheatsheet' },
    caption ? h('caption', { class: 'ref-lesson' }, caption) : null,
    h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Vim'), h('th', { scope: 'col' }, 'Does'), h('th', { scope: 'col' }, 'VS Code'))),
    h('tbody', {}, ...commands.map(commandRow)),
  );
}

const matches = (c: Command, query: string) => [c.keys, c.name, c.vscode ?? ''].some((s) => s.toLowerCase().includes(query));

/**
 * Every command from every lesson in a searchable dialog. Built once; the filter just
 * hides rows, so typing stays instant.
 */
export function createReference(lessons: Lesson[], onClose: () => void): { open(): void } {
  const sections = lessons.map((lesson) => {
    const table = commandTable(lesson.commands, lesson.title);
    const rows = [...table.tBodies[0].rows];
    return { lesson, table, rows };
  });
  const empty = h('p', { class: 'ref-empty faint', hidden: true }, 'No commands match that.');

  const filter = (raw: string) => {
    const query = raw.trim().toLowerCase();
    let shown = 0;
    for (const { lesson, table, rows } of sections) {
      let visible = 0;
      lesson.commands.forEach((c, i) => {
        const hit = !query || matches(c, query);
        rows[i].hidden = !hit;
        if (hit) visible++;
      });
      table.hidden = visible === 0;
      shown += visible;
    }
    empty.hidden = shown > 0;
  };

  const search = h('input', {
    type: 'search',
    class: 'ref-search',
    placeholder: 'Filter by key, action or VS Code shortcut',
    'aria-label': 'Filter commands',
    autocomplete: 'off',
    spellcheck: 'false',
    oninput: () => filter(search.value),
  });

  const dialog = h(
    'dialog',
    { class: 'reference', 'aria-labelledby': 'ref-title' },
    h(
      'header',
      { class: 'ref-head' },
      h('h2', { id: 'ref-title' }, 'Vim reference'),
      h(
        'button',
        { class: 'btn btn-ghost ref-close', type: 'button', title: 'Close (Esc)', 'aria-label': 'Close', onclick: () => dialog.close() },
        icon(X, 16),
      ),
      h('label', { class: 'ref-search-wrap' }, icon(Search, 15), search),
    ),
    h('div', { class: 'ref-body' }, ...sections.map((s) => s.table), empty),
  );
  // Clicks on the backdrop land on the dialog itself, not its content.
  dialog.addEventListener('click', (e) => e.target === dialog && dialog.close());
  dialog.addEventListener('close', onClose);
  document.body.append(dialog);

  return {
    open() {
      search.value = '';
      filter('');
      dialog.showModal();
      search.focus();
    },
  };
}
