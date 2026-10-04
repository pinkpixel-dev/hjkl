import { createElement, type IconNode } from 'lucide';
import { friendlyKey } from '../drills/keys';

type Attrs = Record<string, string | number | boolean | EventListener | undefined>;
type Child = Node | string | null | undefined | false;

/** Tiny element builder. `on*` attrs become listeners, booleans toggle attributes. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (typeof value === 'function') el.addEventListener(name.slice(2), value);
    else if (value === true) el.setAttribute(name, '');
    else el.setAttribute(name, String(value));
  }
  for (const child of children) {
    if (child) el.append(child);
  }
  return el;
}

export function icon(node: IconNode, size = 16): SVGElement {
  const svg = createElement(node);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  return svg;
}

/** One key as a <kbd>. Special keys keep their vim notation with a plain name underneath. */
export function keyChip(key: string, display: (k: string) => string = (k) => k): HTMLElement {
  const friendly = friendlyKey(key);
  if (!friendly) return h('kbd', {}, display(key));
  return h('kbd', { class: 'kbd-named', title: friendly }, display(key), h('small', {}, friendly));
}

/** Renders a key sequence as <kbd> chips. */
export function keyChips(keys: readonly string[], display: (k: string) => string): HTMLElement {
  return h('span', { class: 'chips' }, ...keys.map((k) => keyChip(k, display)));
}
