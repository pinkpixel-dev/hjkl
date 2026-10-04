import { ArrowRight, Eye, Lightbulb, RotateCcw } from 'lucide';
import { displayKey } from '../drills/keys';
import { grade, type Grade } from '../drills/drill-engine';
import type { Drill } from '../drills/types';
import { h, icon, keyChips } from './dom';
import { renderGoal } from './goal-view';
import { CoachOutput } from './coach-output';
import { Pager } from './pager';

const GRADE_TEXT: Record<Grade, string> = {
  under: 'Under par. Nice.',
  par: 'Right on par.',
  over: 'Solved.',
};

export interface DrillViewHandlers {
  onReset(): void;
  onNext(): void;
  onPick(drillIndex: number): void;
  onHint(): void;
  onMore(): void;
  onStopMore(): void;
}

/** The center panel: prompt, editor slot, goal, live keys and result. */
export class DrillView {
  readonly root: HTMLElement;
  readonly editorSlot = h('div', { class: 'editor-slot' });
  private heading = h('h1', { class: 'drill-prompt' });
  private crumbs = h('p', { class: 'drill-crumbs' });
  readonly pager: Pager;
  private goalSlot = h('div', { class: 'goal-slot' });
  private counter = h('span', { class: 'counter', 'aria-live': 'off' });
  private liveKeys = h('div', { class: 'live-keys' });
  private result = h('section', { class: 'result', 'aria-live': 'polite', hidden: true });
  private answer = h('div', { class: 'answer', hidden: true });
  readonly coach = new CoachOutput();
  private nextBtn: HTMLButtonElement;
  private hintBtn: HTMLButtonElement;
  private drill: Drill | null = null;

  constructor(handlers: DrillViewHandlers) {
    this.pager = new Pager(handlers.onPick, handlers.onMore, handlers.onStopMore);
    this.nextBtn = h(
      'button',
      { class: 'btn btn-primary', title: 'Next drill (Enter after solving)', onclick: () => handlers.onNext() },
      'Next',
      icon(ArrowRight),
    );
    const resetBtn = h(
      'button',
      { class: 'btn', title: 'Start this drill over', onclick: () => handlers.onReset() },
      icon(RotateCcw),
      'Reset',
    );
    this.hintBtn = h(
      'button',
      { class: 'btn', title: 'Ask the coach for a nudge', hidden: true, onclick: () => handlers.onHint() },
      icon(Lightbulb),
      'Hint',
    );
    const answerBtn = h(
      'button',
      { class: 'btn', title: 'Show the reference keystrokes', onclick: () => this.toggleAnswer() },
      icon(Eye),
      'Answer',
    );

    this.root = h(
      'div',
      { class: 'drill' },
      h('header', { class: 'drill-head' }, h('div', {}, this.crumbs, this.heading), this.pager.root),
      h(
        'div',
        { class: 'panes' },
        h('section', { class: 'pane' }, h('h2', { class: 'pane-label' }, 'Buffer'), this.editorSlot),
        h('section', { class: 'pane' }, h('h2', { class: 'pane-label' }, 'Goal'), this.goalSlot),
      ),
      h('div', { class: 'keybar' }, this.counter, this.liveKeys, h('div', { class: 'actions' }, this.hintBtn, answerBtn, resetBtn)),
      this.answer,
      this.result,
      this.coach.root,
    );
  }

  /** `drills` is the current set (a lesson, or the review queue); `crumb` labels where we are. */
  show(drills: Drill[], crumb: string, drillIndex: number, bestById: Record<string, number>): void {
    const drill = drills[drillIndex];
    this.drill = drill;
    this.crumbs.textContent = crumb;
    this.heading.textContent = drill.prompt;
    this.goalSlot.replaceChildren(renderGoal(drill));
    this.result.hidden = true;
    this.answer.hidden = true;
    this.hintBtn.disabled = false;
    this.coach.clear();
    this.answer.replaceChildren(h('span', { class: 'faint' }, 'Reference'), keyChips(drill.solution, displayKey));
    this.pager.render(drills, drillIndex, bestById);
    this.updateKeys([]);
  }

  updateKeys(keys: readonly string[]): void {
    if (!this.drill) return;
    const over = keys.length > this.drill.par;
    this.counter.textContent = `${keys.length} / ${this.drill.par}`;
    this.counter.title = `${keys.length} keys used, par is ${this.drill.par}`;
    this.counter.classList.toggle('is-over', over);
    this.liveKeys.replaceChildren(keys.length ? keyChips(keys.slice(-24), displayKey) : h('span', { class: 'faint' }, 'Keys show up here'));
  }

  showResult(keys: readonly string[], newBest: boolean): void {
    if (!this.drill) return;
    const g = grade(keys.length, this.drill.par);
    const used = `${keys.length} ${keys.length === 1 ? 'key' : 'keys'}`;
    const detail = g === 'over' ? `${used}, par is ${this.drill.par}.` : `${used}.`;
    this.result.className = `result grade-${g}`;
    this.result.replaceChildren(
      h('div', { class: 'result-text' }, h('strong', {}, GRADE_TEXT[g]), ` ${detail}`, newBest ? h('span', { class: 'badge' }, 'New best') : null),
      h('div', { class: 'result-keys' }, h('span', { class: 'faint' }, 'Reference'), keyChips(this.drill.solution, displayKey)),
      this.nextBtn,
    );
    this.result.hidden = false;
    this.answer.hidden = true;
    this.pager.markCurrentDone();
    this.hintBtn.disabled = true;
    this.nextBtn.focus();
  }

  setCoachReady(ready: boolean): void {
    this.hintBtn.hidden = !ready;
    if (!ready) this.coach.clear();
  }

  private toggleAnswer(): void {
    this.answer.hidden = !this.answer.hidden;
  }
}
