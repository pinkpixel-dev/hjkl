import { MODELS, type CoachDtype, type ModelKey } from './model-config';
import type { ChatMessage, FromWorker, ToWorker } from './protocol';

export type CoachState =
  | { status: 'off' }
  | { status: 'loading'; model: ModelKey; dtype: CoachDtype | null; fraction: number; loaded: number }
  | { status: 'ready'; model: ModelKey; dtype: CoachDtype; tokensPerSecond: number | null }
  | { status: 'error'; model: ModelKey; message: string };

export interface Reply {
  text: string;
  /** True if a newer request (or turning the coach off) cut this one short. */
  aborted: boolean;
}

interface Pending {
  onToken(text: string): void;
  resolve(reply: Reply): void;
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
  private idleWaiters: (() => void)[] = [];
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
    this.settleAll();
    this.set({ status: 'off' });
  }

  /** Streams a reply. Starting a new request aborts the one in flight. */
  ask(
    messages: ChatMessage[],
    onToken: (text: string) => void,
    { maxTokens = 120, sample = false }: { maxTokens?: number; sample?: boolean } = {},
  ): Promise<Reply> {
    if (!this.ready) return Promise.resolve({ text: '', aborted: true });
    this.abort();
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, { onToken, resolve, text: '' });
      this.send({ type: 'generate', id, messages, maxTokens, sample });
    });
  }

  /** Stops the current reply. Its promise resolves with whatever text had arrived. */
  abort(): void {
    if (!this.pending.size) return;
    this.send({ type: 'abort' });
    this.settleAll();
  }

  /** Resolves once nothing is generating, so background work can wait its turn. */
  whenIdle(): Promise<void> {
    if (!this.pending.size) return Promise.resolve();
    return new Promise((resolve) => this.idleWaiters.push(resolve));
  }

  private settleAll(aborted = true) {
    this.pending.forEach((p) => p.resolve({ text: p.text, aborted }));
    this.pending.clear();
    this.flushIdle();
  }

  private flushIdle() {
    if (this.pending.size) return;
    const waiters = this.idleWaiters;
    this.idleWaiters = [];
    // Let the caller that finished react first, then wake background work.
    setTimeout(() => waiters.forEach((w) => w()));
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
        p?.resolve({ text: p.text, aborted: false });
        this.flushIdle();
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
          this.settleAll();
        }
        break;
    }
  }
}
