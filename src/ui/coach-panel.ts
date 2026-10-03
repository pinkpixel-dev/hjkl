import { Cpu, Power, TriangleAlert } from 'lucide';
import { MODELS, formatBytes, type ModelKey } from '../ai/model-config';
import { webgpuSupported, type CoachState } from '../ai/coach-client';
import { h, icon } from './dom';

export interface CoachPanelHandlers {
  onEnable(model: ModelKey): void;
  onDisable(): void;
}

/** Sidebar card that turns the coach on, shows download progress, and reports status. */
export function renderCoachPanel(
  container: HTMLElement,
  state: CoachState,
  selected: ModelKey,
  handlers: CoachPanelHandlers,
): void {
  const heading = h('h2', { class: 'side-heading' }, 'AI coach');

  if (!webgpuSupported()) {
    container.replaceChildren(heading, h('p', { class: 'coach-note' }, 'Needs a browser with WebGPU.'));
    return;
  }

  if (state.status === 'off' || state.status === 'error') {
    const select = h(
      'select',
      { class: 'select', 'aria-label': 'Coach model' },
      ...Object.values(MODELS).map((m) =>
        h('option', { value: m.key, selected: m.key === selected }, `${m.label} · ${formatBytes(m.approxBytes.q4f16)}`),
      ),
    );
    const enable = h(
      'button',
      {
        class: 'btn btn-primary',
        title: 'Download the model once and run it on your GPU',
        onclick: () => handlers.onEnable(select.value as ModelKey),
      },
      icon(Cpu),
      'Enable',
    );
    container.replaceChildren(
      heading,
      h('p', { class: 'coach-note' }, 'Runs Gemma on your GPU. Downloads once.'),
      h('div', { class: 'coach-row' }, select, enable),
    );
    if (state.status === 'error') {
      container.append(h('p', { class: 'coach-error', role: 'alert' }, icon(TriangleAlert, 14), state.message));
    }
    return;
  }

  const model = MODELS[state.model];
  const off = h('button', { class: 'btn', title: 'Turn the coach off', onclick: () => handlers.onDisable() }, icon(Power), 'Off');

  if (state.status === 'loading') {
    const pct = Math.round(state.fraction * 100);
    container.replaceChildren(
      heading,
      h('p', { class: 'coach-note' }, `Loading ${model.label}…`),
      h('progress', { class: 'coach-progress', max: 100, value: pct, 'aria-label': `Model download ${pct}%` }),
      h(
        'div',
        { class: 'coach-row' },
        h('span', { class: 'coach-meta' }, `${formatBytes(state.loaded)} / ${formatBytes(model.approxBytes[state.dtype ?? 'q4f16'])}`),
        off,
      ),
    );
    return;
  }

  const speed = state.tokensPerSecond ? ` · ${state.tokensPerSecond.toFixed(1)} tok/s` : '';
  container.replaceChildren(
    heading,
    h(
      'div',
      { class: 'coach-row' },
      h('span', { class: 'coach-ready' }, h('span', { class: 'status-dot', 'aria-hidden': 'true' }), `${model.label}`),
      off,
    ),
    h('p', { class: 'coach-meta' }, `${state.dtype}${speed}`),
  );
}
