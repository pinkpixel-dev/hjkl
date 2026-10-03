// jsdom has no layout engine. CodeMirror measures text ranges, so give it empty rects.
const emptyRects = () => Object.assign([], { item: () => null }) as unknown as DOMRectList;
const emptyRect = () => new DOMRect(0, 0, 0, 0);

Range.prototype.getClientRects = emptyRects;
Range.prototype.getBoundingClientRect = emptyRect;

// Vertical motion (j/k) asks the layout engine where the next line is. Without layout,
// answer by logical line and column, which is what a real browser does for unwrapped text.
import { EditorSelection, type SelectionRange } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

EditorView.prototype.moveVertically = function (start: SelectionRange, forward: boolean): SelectionRange {
  const doc = this.state.doc;
  const line = doc.lineAt(start.head);
  // goalColumn is in pixels in CodeMirror, meaningless here, so use the character column.
  const column = start.head - line.from;
  const target = forward ? line.number + 1 : line.number - 1;
  if (target < 1) return EditorSelection.cursor(0);
  if (target > doc.lines) return EditorSelection.cursor(doc.length);
  const next = doc.line(target);
  return EditorSelection.cursor(Math.min(next.from + column, next.to));
};
