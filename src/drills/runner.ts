import { EditorState, EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { history } from '@codemirror/commands';
import { vim, getCM, Vim } from '@replit/codemirror-vim';
import { isSolved, type EditorSnapshot } from './drill-engine';
import type { Drill } from './types';

type VimCM = NonNullable<ReturnType<typeof getCM>>;

/** Read text, cursor and mode from a live vim editor. */
export function snapshot(view: EditorView): EditorSnapshot {
  const vimState = getCM(view)?.state.vim;
  return {
    text: view.state.doc.toString(),
    cursor: view.state.selection.main.head,
    busy: Boolean(vimState?.insertMode || vimState?.visualMode),
  };
}

/** Feed keys through vim the same way a keyboard would. */
export function runKeys(cm: VimCM, keys: string[]): void {
  for (const key of keys) {
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
    const cm = getCM(view);
    if (!cm) return false;
    runKeys(cm, keys);
    return isSolved(drill, snapshot(view));
  } finally {
    view.destroy();
    parent.remove();
  }
}
