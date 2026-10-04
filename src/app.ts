import { LESSONS } from './drills/lessons';
import { grade, isSolved, type EditorSnapshot } from './drills/drill-engine';
import type { Drill, Lesson } from './drills/types';
import { createVimEditor } from './editor/vim-editor';
import { KeystrokeTracker } from './editor/keystroke-tracker';
import {
  loadCoachPrefs,
  loadGenerated,
  loadProgress,
  recordSolve,
  saveCoachPrefs,
  saveGenerated,
  saveProgress,
} from './progress/store';
import { withGenerated } from './drills/generated';
import { DrillGenerator } from './ai/drill-generator';
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

export function startApp(root: HTMLElement): void {
  const progress = loadProgress();
  const generated = loadGenerated();
  // Hand-written lessons plus any AI drills saved from earlier sessions. New ones get pushed in live.
  const lessons = withGenerated(LESSONS, generated);
  const homeLesson = (drill: Drill): Lesson => lessons.find((l) => l.id === drill.lessonId)!;
  const coachPrefs = loadCoachPrefs();
  const coach = new CoachClient();
  const generator = new DrillGenerator(coach);
  let coachModel: ModelKey = coachPrefs.model && coachPrefs.model in MODELS ? (coachPrefs.model as ModelKey) : DEFAULT_MODEL;

  // The review queue is a snapshot for this pass, so drills don't vanish while you work through it.
  let reviewDrills: Drill[] = buildReview(lessons, progress.best);
  const lastId = progress.last?.lessonId;
  let place: Place =
    lastId === 'review' && reviewDrills.length ? 'review' : Math.max(0, lessons.findIndex((l) => l.id === lastId));
  let drillIndex = 0;
  let solved = false;

  const drillsAt = (p: Place) => (p === 'review' ? reviewDrills : lessons[p].drills);
  drillIndex = Math.min(progress.last?.drillIndex ?? 0, drillsAt(place).length - 1);
  const current = () => drillsAt(place)[drillIndex];

  const sidebar = h('nav', { class: 'sidebar', 'aria-label': 'Lessons' });
  const cheatsheetSlot = h('div', {});
  const coachSlot = h('div', { class: 'coach-panel' });
  const score = h('span', { class: 'score' });

  const view = new DrillView({
    onReset: () => openDrill(place, drillIndex),
    onPick: (i) => openDrill(place, i),
    onNext: () => next(),
    onHint: () => askCoach(hintMessages(current(), homeLesson(current()), tracker.recorded), 80),
    onMore: () => generateMore(),
    onStopMore: () => generator.stop(),
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
      .ask(messages, (t) => seq === askSeq && view.coach.append(t), { maxTokens })
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
    refreshMore();
  });

  /** The "5 more" button shows while the coach is ready in a lesson, or while a batch is running. */
  function refreshMore() {
    if (generator.running) {
      view.pager.setMore({ status: 'running', made: batchMade, target: 5, here: place !== 'review' && lessons[place].id === generator.lessonId });
    } else {
      view.pager.setMore({ status: coach.ready && place !== 'review' ? 'idle' : 'hidden' });
    }
  }

  let batchMade = 0;
  function generateMore() {
    if (place === 'review' || generator.running) return;
    const lesson = lessons[place];
    batchMade = 0;
    generator.run(lesson, 5, {
      onDrill: (drill, def) => {
        lesson.drills.push(drill);
        (generated[lesson.id] ??= []).push(def);
        saveGenerated(generated);
        // Only redraw the dots if we're looking at this lesson; don't disturb the drill in progress.
        if (place !== 'review' && lessons[place] === lesson) view.pager.render(lesson.drills, drillIndex, progress.best);
        refreshChrome();
      },
      onProgress: (made) => {
        batchMade = made;
        refreshMore();
      },
      onDone: () => refreshMore(),
    });
  }

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
    const reviewCount = buildReview(lessons, progress.best).length;
    const currentId = place === 'review' ? 'review' : lessons[place].id;
    renderSidebar(sidebar, lessons, progress, currentId, reviewCount, (i) => openDrill(i, 0), openReview);
    renderCheatsheet(cheatsheetSlot, homeLesson(drill));
    const total = lessons.reduce((n, l) => n + l.drills.length, 0);
    score.textContent = `${Object.keys(progress.best).length} / ${total} solved`;
  }

  function crumb(p: Place, drill: Drill): string {
    if (p === 'review') return `Review · ${homeLesson(drill).title}`;
    return `Lesson ${p + 1} · ${lessons[p].title}`;
  }

  function openDrill(p: Place, di: number) {
    coach.abort();
    place = p;
    drillIndex = di;
    solved = false;
    const drill = current();
    progress.last = { lessonId: p === 'review' ? 'review' : lessons[p].id, drillIndex: di };
    saveProgress(progress);
    view.show(drillsAt(p), crumb(p, drill), di, progress.best);
    editor.load(drill);
    tracker.start();
    refreshChrome();
    refreshMore();
    editor.focus();
  }

  /** Starts a fresh pass over everything still over par. */
  function openReview() {
    reviewDrills = buildReview(lessons, progress.best);
    if (reviewDrills.length) openDrill('review', 0);
  }

  function firstUnfinishedLesson(): number {
    const i = lessons.findIndex((l) => l.drills.some((d) => progress.best[d.id] === undefined));
    return Math.max(0, i);
  }

  function next() {
    if (drillIndex + 1 < drillsAt(place).length) return openDrill(place, drillIndex + 1);
    if (place === 'review') {
      // End of the pass: go again if anything is still over par, otherwise back to lessons.
      reviewDrills = buildReview(lessons, progress.best);
      return reviewDrills.length ? openDrill('review', 0) : openDrill(firstUnfinishedLesson(), 0);
    }
    openDrill(place + 1 < lessons.length ? place + 1 : 0, 0);
  }

  openDrill(place, drillIndex);
  // The model is cached after the first download, so turning it back on is much quicker.
  if (coachPrefs.enabled) coach.enable(coachModel);
}
