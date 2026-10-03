import { LESSONS } from './drills/lessons';
import { grade, isSolved, type EditorSnapshot } from './drills/drill-engine';
import { createVimEditor } from './editor/vim-editor';
import { KeystrokeTracker } from './editor/keystroke-tracker';
import { loadCoachPrefs, loadProgress, recordSolve, saveCoachPrefs, saveProgress } from './progress/store';
import { CoachClient } from './ai/coach-client';
import { DEFAULT_MODEL, MODELS, type ModelKey } from './ai/model-config';
import { feedbackMessages, hintMessages } from './ai/prompts';
import type { ChatMessage } from './ai/protocol';
import { DrillView } from './ui/drill-view';
import { renderSidebar } from './ui/sidebar';
import { renderCheatsheet } from './ui/cheatsheet';
import { renderCoachPanel } from './ui/coach-panel';
import { h } from './ui/dom';

export function startApp(root: HTMLElement): void {
  const progress = loadProgress();
  const coachPrefs = loadCoachPrefs();
  const coach = new CoachClient();
  let coachModel: ModelKey = coachPrefs.model && coachPrefs.model in MODELS ? (coachPrefs.model as ModelKey) : DEFAULT_MODEL;

  const startLesson = Math.max(0, LESSONS.findIndex((l) => l.id === progress.last?.lessonId));
  let lessonIndex = startLesson;
  let drillIndex = Math.min(progress.last?.drillIndex ?? 0, LESSONS[startLesson].drills.length - 1);
  let solved = false;

  const sidebar = h('nav', { class: 'sidebar', 'aria-label': 'Lessons' });
  const cheatsheetSlot = h('div', {});
  const coachSlot = h('div', { class: 'coach-panel' });
  const total = LESSONS.reduce((n, l) => n + l.drills.length, 0);
  const score = h('span', { class: 'score' });

  const view = new DrillView({
    onReset: () => openDrill(lessonIndex, drillIndex),
    onPick: (i) => openDrill(lessonIndex, i),
    onNext: () => next(),
    onHint: () => askCoach(hintMessages(current(), LESSONS[lessonIndex], tracker.recorded), 80),
  });

  root.replaceChildren(
    h('header', { class: 'topbar' }, h('span', { class: 'logo' }, 'hjkl'), score),
    h('div', { class: 'layout' }, sidebar, h('main', { class: 'main' }, view.root), h('aside', { class: 'aside' }, cheatsheetSlot, coachSlot)),
  );

  const current = () => LESSONS[lessonIndex].drills[drillIndex];

  // Asking again aborts the previous reply, which then resolves late. Only the newest may touch the view.
  let askSeq = 0;
  function askCoach(messages: ChatMessage[], maxTokens?: number) {
    if (!coach.ready) return;
    const seq = ++askSeq;
    view.coach.start();
    coach
      .ask(messages, (t) => seq === askSeq && view.coach.append(t), maxTokens)
      .then(() => seq === askSeq && view.coach.finish());
  }

  coach.subscribe((state) => {
    renderCoachPanel(coachSlot, state, coachModel, {
      onEnable: (model) => {
        coachModel = model;
        saveCoachPrefs({ enabled: true, model });
        coach.enable(model);
      },
      onDisable: () => {
        saveCoachPrefs({ enabled: false, model: coachModel });
        coach.disable();
      },
    });
    view.setCoachReady(state.status === 'ready');
  });

  const onChange = (snap: EditorSnapshot) => {
    if (solved || !isSolved(current(), snap)) return;
    solved = true;
    tracker.stop();
    const keys = tracker.recorded;
    const newBest = recordSolve(progress, current().id, keys.length);
    saveProgress(progress);
    view.showResult(keys, newBest);
    refreshChrome();
    // Only explain when there was a shorter path. At or under par there's nothing to fix.
    if (grade(keys.length, current().par) === 'over') {
      askCoach(feedbackMessages(current(), LESSONS[lessonIndex], keys));
    }
  };

  const editor = createVimEditor(view.editorSlot, onChange);
  const tracker = new KeystrokeTracker(editor.view.dom, (keys) => view.updateKeys(keys));

  function refreshChrome() {
    const lesson = LESSONS[lessonIndex];
    renderSidebar(sidebar, LESSONS, progress, lesson.id, (i) => openDrill(i, 0));
    renderCheatsheet(cheatsheetSlot, lesson);
    score.textContent = `${Object.keys(progress.best).length} / ${total} solved`;
  }

  function openDrill(li: number, di: number) {
    coach.abort();
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
  // The model is cached after the first download, so turning it back on is much quicker.
  if (coachPrefs.enabled) coach.enable(coachModel);
}
