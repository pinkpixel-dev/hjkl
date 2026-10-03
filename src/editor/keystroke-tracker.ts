import { eventToKey } from '../drills/keys';

/**
 * Records every key pressed inside the editor, in vim notation.
 * Listens to raw keydown because vim's own keypress signal skips insert-mode typing.
 */
export class KeystrokeTracker {
  private keys: string[] = [];
  private active = false;

  constructor(target: HTMLElement, private onKey: (keys: readonly string[]) => void) {
    target.addEventListener('keydown', (e) => this.handle(e), { capture: true });
  }

  private handle(e: KeyboardEvent) {
    if (!this.active || e.isComposing) return;
    const key = eventToKey(e);
    if (!key) return;
    this.keys.push(key);
    this.onKey(this.keys);
  }

  start() {
    this.keys = [];
    this.active = true;
    this.onKey(this.keys);
  }

  stop() {
    this.active = false;
  }

  get recorded(): readonly string[] {
    return this.keys;
  }
}
