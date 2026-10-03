import { EditorState, EditorSelection, StateField, type Extension } from '@codemirror/state';
import { EditorView, Decoration, lineNumbers, drawSelection, type DecorationSet } from '@codemirror/view';
import { history } from '@codemirror/commands';
import { vim, getCM } from '@replit/codemirror-vim';
import { snapshot } from '../drills/runner';
import type { EditorSnapshot } from '../drills/drill-engine';
import type { Drill } from '../drills/types';
import { editorTheme } from './theme';

export interface VimEditor {
  view: EditorView;
  load(drill: Drill): void;
  focus(): void;
}

/** Highlights the character a cursor drill wants you to land on. */
function goalMarker(drill: Drill): Extension {
  const pos = drill.goalCursor;
  const char = pos === null ? '' : drill.startText.charAt(pos);
  if (pos === null || char === '' || char === '\n') return [];
  const deco = Decoration.mark({ class: 'cm-goal-char' }).range(pos, pos + 1);
  return StateField.define<DecorationSet>({
    create: () => Decoration.set([deco]),
    update: (set, tr) => set.map(tr.changes),
    provide: (field) => EditorView.decorations.from(field),
  });
}

export function createVimEditor(parent: HTMLElement, onChange: (snap: EditorSnapshot) => void): VimEditor {
  const view = new EditorView({ parent });

  const emit = () => onChange(snapshot(view));

  const load = (drill: Drill) => {
    view.setState(
      EditorState.create({
        doc: drill.startText,
        selection: EditorSelection.cursor(drill.startCursor),
        extensions: [
          vim({ status: true }),
          history(),
          lineNumbers(),
          drawSelection(),
          editorTheme,
          goalMarker(drill),
          EditorView.contentAttributes.of({ 'aria-label': 'Vim practice buffer' }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged || u.selectionSet) emit();
          }),
        ],
      }),
    );
    // setState rebuilds the vim plugin, so listen on the fresh instance.
    // Leaving insert mode doesn't always move the cursor, so mode changes re-check too.
    getCM(view)?.on('vim-mode-change', emit);
  };

  return { view, load, focus: () => view.focus() };
}
