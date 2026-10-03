/// <reference lib="webworker" />
import {
  AutoModelForCausalLM,
  AutoTokenizer,
  InterruptableStoppingCriteria,
  TextStreamer,
  env,
  type PreTrainedModel,
  type PreTrainedTokenizer,
} from '@huggingface/transformers';
import { MODELS } from './model-config';
import type { FromWorker, ToWorker } from './protocol';

env.allowLocalModels = false;

let tokenizer: PreTrainedTokenizer | null = null;
let model: PreTrainedModel | null = null;
const stopping = new InterruptableStoppingCriteria();

const post = (msg: FromWorker) => self.postMessage(msg);

interface GpuAdapterLike {
  features: { has(name: string): boolean };
}

/** Same fallback order as the old chatbot worker: some setups only answer one preference. */
async function findAdapter(): Promise<GpuAdapterLike | null> {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(o?: object): Promise<GpuAdapterLike | null> } }).gpu;
  if (!gpu) return null;
  for (const powerPreference of ['high-performance', undefined, 'low-power']) {
    const adapter = await gpu.requestAdapter(powerPreference ? { powerPreference } : undefined);
    if (adapter) return adapter;
  }
  return null;
}

async function load(key: keyof typeof MODELS) {
  const adapter = await findAdapter();
  if (!adapter) {
    post({ type: 'error', fatal: true, message: 'WebGPU is not available in this browser.' });
    return;
  }
  // q4f16 is smaller and faster but needs fp16 shader support.
  const dtype = adapter.features.has('shader-f16') ? 'q4f16' : 'q4';
  const { repo } = MODELS[key];
  post({ type: 'loading', dtype });

  tokenizer = await AutoTokenizer.from_pretrained(repo);
  model = await AutoModelForCausalLM.from_pretrained(repo, {
    dtype,
    device: 'webgpu',
    progress_callback: (info) => {
      if (info.status === 'progress_total') post({ type: 'progress', loaded: info.loaded });
    },
  });
  post({ type: 'ready' });
}

async function generate(id: number, messages: Parameters<PreTrainedTokenizer['apply_chat_template']>[0], maxTokens: number) {
  if (!tokenizer || !model) return;
  stopping.reset();
  const inputs = tokenizer.apply_chat_template(messages, { add_generation_prompt: true, return_dict: true }) as Record<string, unknown>;

  let tokens = 0;
  let firstAt = 0;
  const streamer = new TextStreamer(tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function: (text: string) => {
      if (!firstAt) firstAt = performance.now();
      tokens++;
      post({ type: 'token', id, text });
    },
  });

  await model.generate({
    ...inputs,
    max_new_tokens: maxTokens,
    do_sample: false,
    streamer,
    stopping_criteria: stopping,
  });
  const seconds = firstAt ? (performance.now() - firstAt) / 1000 : 0;
  post({ type: 'done', id, tokensPerSecond: seconds > 0 ? tokens / seconds : 0 });
}

// Generations run one at a time. Abort skips the queue so it can stop the current one.
let queue: Promise<void> = Promise.resolve();

self.onmessage = (e: MessageEvent<ToWorker>) => {
  const msg = e.data;
  if (msg.type === 'abort') {
    stopping.interrupt();
    return;
  }
  const run = msg.type === 'load' ? () => load(msg.model) : () => generate(msg.id, msg.messages, msg.maxTokens);
  queue = queue.then(run).catch((err) => {
    post({ type: 'error', fatal: msg.type === 'load', message: err instanceof Error ? err.message : String(err) });
  });
};
