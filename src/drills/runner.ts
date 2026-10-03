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
export function runKeys(view: EditorView, keys: string[]): void {
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
 * Run keys against a drill in a detached editor and report whether they solve it.
 * Used by tests and to check AI-generated drills before they reach the player.
 */
export function verifyDrill(drill: Drill, keys: string[] = drill.solution): boolean {
  // Mounted offscreen rather than detached: j/k need real layout to measure lines.
  const parent = document.createElement('div');
  parent.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;visibility:hidden';
  document.body.append(parent);
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: drill.startText,
      selection: EditorSelection.cursor(drill.startCursor),
      extensions: [vim(), history()],
    }),
  });
  try {
    runKeys(view, keys);
    return isSolved(drill, snapshot(view));
  } finally {
    view.destroy();
    parent.remove();
  }
}
