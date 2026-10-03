import { LESSONS } from './drills/lessons';
import { grade, isSolved, type EditorSnapshot } from './drills/drill-engine';
import type { Drill, Lesson } from './drills/types';
import { createVimEditor } from './editor/vim-editor';
import { KeystrokeTracker } from './editor/keystroke-tracker';
import { loadCoachPrefs, loadProgress, recordSolve, saveCoachPrefs, saveProgress } from './progress/store';
import { buildReview } from './progress/review';
import { CoachClient } from './ai/coach-client';
import { DEFAULT_MODEL, MODELS, type ModelKey } from './ai/model-config';
import { feedbackMessages, hintMessages } from './ai/prompts';
import type { ChatMessage } from './ai/protocol';
import { DrillView } from './ui/drill-view';
import { renderSidebar } from './ui/sidebar';
import { renderCheatsheet } from './ui/cheatsheet';
import { renderCoachPanel } from './ui/coach-panel';
import { h } from './ui/dom';

/** Where the learner is: a lesson index, or the review queue. */
type Place = number | 'review';

const homeLesson = (drill: Drill): Lesson => LESSONS.find((l) => l.id === drill.lessonId)!;

export function startApp(root: HTMLElement): void {
  const progress = loadProgress();
  const coachPrefs = loadCoachPrefs();
  const coach = new CoachClient();
  let coachModel: ModelKey = coachPrefs.model && coachPrefs.model in MODELS ? (coachPrefs.model as ModelKey) : DEFAULT_MODEL;

  // The review queue is a snapshot for this pass, so drills don't vanish while you work through it.
  let reviewDrills: Drill[] = buildReview(LESSONS, progress.best);
  const lastId = progress.last?.lessonId;
  let place: Place =
    lastId === 'review' && reviewDrills.length ? 'review' : Math.max(0, LESSONS.findIndex((l) => l.id === lastId));
  let drillIndex = 0;
  let solved = false;

  const drillsAt = (p: Place) => (p === 'review' ? reviewDrills : LESSONS[p].drills);
  drillIndex = Math.min(progress.last?.drillIndex ?? 0, drillsAt(place).length - 1);
  const current = () => drillsAt(place)[drillIndex];

  const sidebar = h('nav', { class: 'sidebar', 'aria-label': 'Lessons' });
  const cheatsheetSlot = h('div', {});
  const coachSlot = h('div', { class: 'coach-panel' });
  const total = LESSONS.reduce((n, l) => n + l.drills.length, 0);
  const score = h('span', { class: 'score' });

  const view = new DrillView({
    onReset: () => openDrill(place, drillIndex),
    onPick: (i) => openDrill(place, i),
    onNext: () => next(),
    onHint: () => askCoach(hintMessages(current(), homeLesson(current()), tracker.recorded), 80),
  });

  root.replaceChildren(
    h('header', { class: 'topbar' }, h('span', { class: 'logo' }, 'hjkl'), score),
    h('div', { class: 'layout' }, sidebar, h('main', { class: 'main' }, view.root), h('aside', { class: 'aside' }, cheatsheetSlot, coachSlot)),
  );

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
    const drill = current();
    if (solved || !isSolved(drill, snap)) return;
    solved = true;
    tracker.stop();
    const keys = tracker.recorded;
    const newBest = recordSolve(progress, drill.id, keys.length);
    saveProgress(progress);
    view.showResult(keys, newBest);
    refreshChrome();
    // Only explain when there was a shorter path. At or under par there's nothing to fix.
    if (grade(keys.length, drill.par) === 'over') askCoach(feedbackMessages(drill, homeLesson(drill), keys));
  };

  const editor = createVimEditor(view.editorSlot, onChange);
  const tracker = new KeystrokeTracker(editor.view.dom, (keys) => view.updateKeys(keys));

  function refreshChrome() {
    const drill = current();
    const reviewCount = buildReview(LESSONS, progress.best).length;
    const currentId = place === 'review' ? 'review' : LESSONS[place].id;
    renderSidebar(sidebar, LESSONS, progress, currentId, reviewCount, (i) => openDrill(i, 0), openReview);
    renderCheatsheet(cheatsheetSlot, homeLesson(drill));
    score.textContent = `${Object.keys(progress.best).length} / ${total} solved`;
  }

  function crumb(p: Place, drill: Drill): string {
    if (p === 'review') return `Review · ${homeLesson(drill).title}`;
    return `Lesson ${p + 1} · ${LESSONS[p].title}`;
  }

  function openDrill(p: Place, di: number) {
    coach.abort();
    place = p;
    drillIndex = di;
    solved = false;
    const drill = current();
    progress.last = { lessonId: p === 'review' ? 'review' : LESSONS[p].id, drillIndex: di };
    saveProgress(progress);
    view.show(drillsAt(p), crumb(p, drill), di, progress.best);
    editor.load(drill);
    tracker.start();
    refreshChrome();
    editor.focus();
  }

  /** Starts a fresh pass over everything still over par. */
  function openReview() {
    reviewDrills = buildReview(LESSONS, progress.best);
    if (reviewDrills.length) openDrill('review', 0);
  }

  function firstUnfinishedLesson(): number {
    const i = LESSONS.findIndex((l) => l.drills.some((d) => progress.best[d.id] === undefined));
    return Math.max(0, i);
  }

  function next() {
    if (drillIndex + 1 < drillsAt(place).length) return openDrill(place, drillIndex + 1);
    if (place === 'review') {
      // End of the pass: go again if anything is still over par, otherwise back to lessons.
      reviewDrills = buildReview(LESSONS, progress.best);
      return reviewDrills.length ? openDrill('review', 0) : openDrill(firstUnfinishedLesson(), 0);
    }
    openDrill(place + 1 < LESSONS.length ? place + 1 : 0, 0);
  }

  openDrill(place, drillIndex);
  // The model is cached after the first download, so turning it back on is much quicker.
  if (coachPrefs.enabled) coach.enable(coachModel);
}
