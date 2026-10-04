import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';

/**
 * Transformers.js loads ONNX Runtime's wasm from the jsDelivr CDN, pinned to the exact
 * onnxruntime-web version, so the copy Vite emits is never fetched. It's also 26.9 MB, over
 * Cloudflare's 25 MiB per-file limit, so leave it out of the build.
 */
const dropOrtWasm = (): Plugin => ({
  name: 'drop-ort-wasm',
  apply: 'build',
  generateBundle(_, bundle) {
    for (const file of Object.keys(bundle)) if (file.endsWith('.wasm')) delete bundle[file];
  },
});

export default defineConfig({
  plugins: [dropOrtWasm()],
  worker: { format: 'es', plugins: () => [dropOrtWasm()] },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
  },
});
