import { MODELS, type CoachDtype, type ModelKey } from './model-config';
import type { ChatMessage, FromWorker, ToWorker } from './protocol';

export type CoachState =
  | { status: 'off' }
  | { status: 'loading'; model: ModelKey; dtype: CoachDtype | null; fraction: number; loaded: number }
  | { status: 'ready'; model: ModelKey; dtype: CoachDtype; tokensPerSecond: number | null }
  | { status: 'error'; model: ModelKey; message: string };

interface Pending {
  onToken(text: string): void;
  resolve(text: string): void;
  text: string;
}

export function webgpuSupported(): boolean {
  return 'gpu' in navigator;
}

/** Owns the model worker. One generation at a time; starting a new one aborts the last. */
export class CoachClient {
  private worker: Worker | null = null;
  private dtype: CoachDtype = 'q4f16';
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private listeners = new Set<(s: CoachState) => void>();
  state: CoachState = { status: 'off' };

  subscribe(fn: (s: CoachState) => void): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  private set(state: CoachState) {
    this.state = state;
    this.listeners.forEach((fn) => fn(state));
  }

  get ready(): boolean {
    return this.state.status === 'ready';
  }

  enable(model: ModelKey): void {
    this.disable();
    this.worker = new Worker(new URL('./coach.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e: MessageEvent<FromWorker>) => this.handle(model, e.data);
    this.worker.onerror = (e) => this.set({ status: 'error', model, message: e.message || 'The coach worker crashed.' });
    this.set({ status: 'loading', model, dtype: null, fraction: 0, loaded: 0 });
    this.send({ type: 'load', model });
  }

  disable(): void {
    this.worker?.terminate();
    this.worker = null;
    this.pending.forEach((p) => p.resolve(p.text));
    this.pending.clear();
    this.set({ status: 'off' });
  }

  /** Streams a reply. Resolves with the full text, or partial text if it was aborted. */
  ask(messages: ChatMessage[], onToken: (text: string) => void, maxTokens = 120): Promise<string> {
    if (!this.ready) return Promise.resolve('');
    this.abort();
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, { onToken, resolve, text: '' });
      this.send({ type: 'generate', id, messages, maxTokens });
    });
  }

  /** Stops the current reply and drops its remaining tokens. */
  abort(): void {
    if (!this.pending.size) return;
    this.send({ type: 'abort' });
    this.pending.forEach((p) => p.resolve(p.text));
    this.pending.clear();
  }

  private send(msg: ToWorker) {
    this.worker?.postMessage(msg);
  }

  private handle(model: ModelKey, msg: FromWorker) {
    switch (msg.type) {
      case 'loading':
        this.dtype = msg.dtype;
        this.set({ status: 'loading', model, dtype: msg.dtype, fraction: 0, loaded: 0 });
        break;
      case 'progress': {
        const fraction = Math.min(msg.loaded / MODELS[model].approxBytes[this.dtype], 0.99);
        this.set({ status: 'loading', model, dtype: this.dtype, fraction, loaded: msg.loaded });
        break;
      }
      case 'ready':
        this.set({ status: 'ready', model, dtype: this.dtype, tokensPerSecond: null });
        break;
      case 'token': {
        const p = this.pending.get(msg.id);
        if (!p) break;
        p.text += msg.text;
        p.onToken(msg.text);
        break;
      }
      case 'done': {
        const p = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        p?.resolve(p.text);
        if (this.state.status === 'ready' && msg.tokensPerSecond > 0) {
          this.set({ ...this.state, tokensPerSecond: msg.tokensPerSecond });
        }
        break;
      }
      case 'error':
        if (msg.fatal) {
          this.worker?.terminate();
          this.worker = null;
          this.set({ status: 'error', model, message: msg.message });
        } else {
          console.error('Coach generation failed:', msg.message);
          this.pending.forEach((p) => p.resolve(p.text));
          this.pending.clear();
        }
        break;
    }
  }
}
