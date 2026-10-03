import { LESSONS } from './drills/lessons';
import { isSolved, type EditorSnapshot } from './drills/drill-engine';
import { createVimEditor } from './editor/vim-editor';
import { KeystrokeTracker } from './editor/keystroke-tracker';
import { loadProgress, recordSolve, saveProgress } from './progress/store';
import { DrillView } from './ui/drill-view';
import { renderSidebar } from './ui/sidebar';
import { renderCheatsheet } from './ui/cheatsheet';
import { h } from './ui/dom';

export function startApp(root: HTMLElement): void {
  const progress = loadProgress();
  const startLesson = Math.max(0, LESSONS.findIndex((l) => l.id === progress.last?.lessonId));
  let lessonIndex = startLesson;
  let drillIndex = Math.min(progress.last?.drillIndex ?? 0, LESSONS[startLesson].drills.length - 1);
  let solved = false;

  const sidebar = h('nav', { class: 'sidebar', 'aria-label': 'Lessons' });
  const aside = h('aside', { class: 'aside' });
  const total = LESSONS.reduce((n, l) => n + l.drills.length, 0);
  const score = h('span', { class: 'score' });

  const view = new DrillView({
    onReset: () => openDrill(lessonIndex, drillIndex),
    onPick: (i) => openDrill(lessonIndex, i),
    onNext: () => next(),
  });

  root.replaceChildren(
    h('header', { class: 'topbar' }, h('span', { class: 'logo' }, 'hjkl'), score),
    h('div', { class: 'layout' }, sidebar, h('main', { class: 'main' }, view.root), aside),
  );

  const current = () => LESSONS[lessonIndex].drills[drillIndex];

  const onChange = (snap: EditorSnapshot) => {
    if (solved || !isSolved(current(), snap)) return;
    solved = true;
    tracker.stop();
    const keys = tracker.recorded;
    const newBest = recordSolve(progress, current().id, keys.length);
    saveProgress(progress);
    view.showResult(keys, newBest);
    refreshChrome();
  };

  const editor = createVimEditor(view.editorSlot, onChange);
  const tracker = new KeystrokeTracker(editor.view.dom, (keys) => view.updateKeys(keys));

  function refreshChrome() {
    const lesson = LESSONS[lessonIndex];
    renderSidebar(sidebar, LESSONS, progress, lesson.id, (i) => openDrill(i, 0));
    renderCheatsheet(aside, lesson);
    const done = Object.keys(progress.best).length;
    score.textContent = `${done} / ${total} solved`;
  }

  function openDrill(li: number, di: number) {
    lessonIndex = li;
    drillIndex = di;
    solved = false;
    progress.last = { lessonId: LESSONS[li].id, drillIndex: di };
    saveProgress(progress);
    view.show(LESSONS[li], li, di, progress.best);
    editor.load(current());
    tracker.start();
    refreshChrome();
    editor.focus();
  }

  function next() {
    const lesson = LESSONS[lessonIndex];
    if (drillIndex + 1 < lesson.drills.length) openDrill(lessonIndex, drillIndex + 1);
    else if (lessonIndex + 1 < LESSONS.length) openDrill(lessonIndex + 1, 0);
    else openDrill(0, 0);
  }

  openDrill(lessonIndex, drillIndex);
}
