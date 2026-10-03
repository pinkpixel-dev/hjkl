import { EditorView } from '@codemirror/view';

export const editorTheme = EditorView.theme(
  {
    '&': {
      color: 'var(--text)',
      backgroundColor: 'var(--surface)',
      fontSize: '1.05rem',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
    },
    '&.cm-focused': { outline: '2px solid var(--focus)', outlineOffset: '2px' },
    '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.7', padding: '0.75rem 0' },
    '.cm-content': { caretColor: 'var(--accent)' },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: 'var(--faint)',
      border: 'none',
      paddingLeft: '0.5rem',
    },
    '.cm-fat-cursor': { background: 'var(--accent) !important', color: 'var(--accent-ink) !important' },
    '&:not(.cm-focused) .cm-fat-cursor': { background: 'none !important', outline: '1px solid var(--accent)' },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { background: 'var(--selection) !important' },
    '.cm-goal-char': {
      textDecoration: 'underline 2px var(--goal)',
      textUnderlineOffset: '5px',
      color: 'var(--goal)',
    },
    '.cm-panels': { backgroundColor: 'var(--surface-2)', color: 'var(--muted)', borderTop: '1px solid var(--border)' },
    '.cm-vim-panel': { fontFamily: 'var(--font-mono)', padding: '0.25rem 0.75rem', fontSize: '0.85rem' },
    '.cm-vim-panel input': { color: 'var(--text)', fontFamily: 'var(--font-mono)' },
  },
  { dark: true },
);
