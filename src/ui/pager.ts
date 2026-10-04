import { Sparkles, Square } from 'lucide';
import type { Drill } from '../drills/types';
import { h, icon } from './dom';

export type MoreState = { status: 'hidden' } | { status: 'idle' } | { status: 'running'; made: number; target: number; here: boolean };

/** Drill dots for the current set, plus the button that asks the coach for more drills. */
export class Pager {
  readonly root = h('div', { class: 'pager-wrap' });
  private dots = h('nav', { class: 'pager', 'aria-label': 'Drills in this set' });
  private more = h('button', { class: 'btn btn-ghost more-btn', hidden: true });
  private state: MoreState = { status: 'hidden' };

  constructor(
    private onPick: (index: number) => void,
    private onMore: () => void,
    private onStop: () => void,
  ) {
    this.more.addEventListener('click', () => (this.state.status === 'running' ? this.onStop() : this.onMore()));
    this.root.append(this.dots, this.more);
  }

  render(drills: Drill[], current: number, best: Record<string, number>): void {
    this.dots.replaceChildren(
      ...drills.map((d, i) => {
        const label = `${d.generated ? 'AI drill' : 'Drill'} ${i + 1}: ${d.prompt}`;
        return h('button', {
          class: `dot${i === current ? ' is-current' : ''}${best[d.id] !== undefined ? ' is-done' : ''}${d.generated ? ' is-ai' : ''}`,
          title: label,
          'aria-label': label,
          'aria-current': i === current ? 'step' : undefined,
          onclick: () => this.onPick(i),
        });
      }),
    );
  }

  markCurrentDone(): void {
    this.dots.querySelector('.dot.is-current')?.classList.add('is-done');
  }

  setMore(state: MoreState): void {
    this.state = state;
    this.more.hidden = state.status === 'hidden';
    if (state.status === 'running') {
      this.more.title = 'Stop writing drills';
      this.more.replaceChildren(icon(Square, 14), `Writing ${state.made}/${state.target}${state.here ? '' : ' elsewhere'}`);
      this.more.classList.add('is-running');
    } else {
      this.more.title = 'Have the coach write 5 more drills for this lesson';
      this.more.replaceChildren(icon(Sparkles, 14), '5 more');
      this.more.classList.remove('is-running');
    }
  }
}
