import { EditorState, EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { history } from '@codemirror/commands';
import { vim, getCM, Vim } from '@replit/codemirror-vim';
import { isSolved, type EditorSnapshot } from './drill-engine';
import type { Drill } from './types';

/** Read text, cursor and mode from a live vim editor. */
export function snapshot(view: EditorView): EditorSnapshot {
  const vimState = getCM(view)?.state.vim;
  return {
    text: view.state.doc.toString(),
    cursor: view.state.selection.main.head,
    // An open / or : prompt counts as busy so a search preview can't finish a drill early.
    busy: Boolean(vimState?.insertMode || vimState?.visualMode || view.dom.querySelector('.cm-vim-panel input')),
  };
}

/** Presses a key on the vim prompt input (/, ?, :). The prompt listens for legacy keyCode. */
function pressPromptKey(input: HTMLInputElement, keyCode: number) {
  const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
  Object.defineProperty(e, 'keyCode', { get: () => keyCode });
  input.dispatchEvent(e);
}

/** Feed keys through vim the same way a keyboard would, including typing into the / prompt. */
export function runKeys(view: EditorView, keys: readonly string[]): void {
  const cm = getCM(view);
  if (!cm) return;
  for (const key of keys) {
    const prompt = view.dom.querySelector<HTMLInputElement>('.cm-vim-panel input');
    if (prompt) {
      if (key === '<CR>') pressPromptKey(prompt, 13);
      else if (key === '<Esc>') pressPromptKey(prompt, 27);
      else if (key.length === 1) {
        prompt.value += key;
        prompt.dispatchEvent(new Event('input', { bubbles: true }));
      }
      continue;
    }
    const handled = Vim.handleKey(cm, key, 'user');
    if (handled || !cm.state.vim?.insertMode) continue;
    if (key === '<CR>') cm.replaceSelection('\n');
    else if (key.length === 1) cm.replaceSelection(key);
  }
}

/**
 * vim keeps registers, search, jump list and the last insert (for `.`) in one global object.
 * Checking a drill offscreen must not touch the learner's live state, so run it in a fresh
 * state and put theirs back afterwards.
 */
function withIsolatedVimState<T>(fn: () => T): T {
  const saved = { ...Vim.getVimGlobalState_() };
  Vim.resetVimGlobalState_();
  try {
    return fn();
  } finally {
    Object.assign(Vim.getVimGlobalState_(), saved);
  }
}

/**
 * Plays keys from a starting buffer in an offscreen editor and returns where it ends up.
 * Mounted offscreen rather than detached: j/k need real layout to measure lines.
 */
export function playKeys(text: string, cursor: number, keys: readonly string[]): EditorSnapshot {
  const parent = document.createElement('div');
  parent.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;visibility:hidden';
  document.body.append(parent);
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: text,
      selection: EditorSelection.cursor(Math.min(cursor, text.length)),
      extensions: [vim(), history()],
    }),
  });
  try {
    return withIsolatedVimState(() => {
      runKeys(view, keys);
      return snapshot(view);
    });
  } finally {
    view.destroy();
    parent.remove();
  }
}

/** True if the keys solve the drill. Used by tests to prove every reference solution works. */
export function verifyDrill(drill: Drill, keys: readonly string[] = drill.solution): boolean {
  return isSolved(drill, playKeys(drill.startText, drill.startCursor, keys));
}
