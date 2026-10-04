import { Sparkles } from 'lucide';
import { h, icon, keyChip } from './dom';

/** Renders streamed coach text, turning `backticked` spans into <kbd> chips. */
function renderText(text: string): Node[] {
  return text.split(/(`[^`]*`)/g).flatMap((part): Node[] => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return [keyChip(part.slice(1, -1))];
    return part ? [document.createTextNode(part.replace(/`/g, ''))] : [];
  });
}

/** The coach's reply box under the drill. Shows a thinking state until the first token. */
export class CoachOutput {
  readonly root = h('section', { class: 'coach-output', 'aria-live': 'polite', hidden: true });
  private body = h('p', { class: 'coach-text' });
  private text = '';

  constructor() {
    this.root.append(h('span', { class: 'coach-label' }, icon(Sparkles, 14), 'Coach'), this.body);
  }

  start(): void {
    this.text = '';
    this.body.replaceChildren(h('span', { class: 'faint' }, 'Thinking…'));
    this.root.classList.add('is-busy');
    this.root.hidden = false;
  }

  append(chunk: string): void {
    this.text += chunk;
    this.body.replaceChildren(...renderText(this.text.trimStart()));
  }

  finish(): void {
    this.root.classList.remove('is-busy');
    if (!this.text.trim()) this.clear();
  }

  clear(): void {
    this.text = '';
    this.root.hidden = true;
    this.root.classList.remove('is-busy');
  }
}
