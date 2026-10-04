const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Dead', 'Unidentified']);

const NAMED_KEYS: Record<string, string> = {
  Escape: '<Esc>',
  Enter: '<CR>',
  Backspace: '<BS>',
  Delete: '<Del>',
  Tab: '<Tab>',
  ArrowLeft: '<Left>',
  ArrowRight: '<Right>',
  ArrowUp: '<Up>',
  ArrowDown: '<Down>',
  Home: '<Home>',
  End: '<End>',
};

/** Split vim notation like `ciwnew<Esc>` into single keys. */
export function parseKeys(notation: string): string[] {
  return notation.match(/<[A-Za-z][A-Za-z0-9-]*>|[\s\S]/g) ?? [];
}

/** Convert a keydown event to vim notation, or null for modifier-only presses. */
export function eventToKey(e: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(e.key)) return null;
  const named = NAMED_KEYS[e.key];
  if (e.ctrlKey && !e.altKey && !e.metaKey) {
    const base = named ? named.slice(1, -1) : e.key.toLowerCase();
    return `<C-${base}>`;
  }
  if (named) return named;
  return e.key.length === 1 ? e.key : `<${e.key}>`;
}

/** Display form for a single key: makes spaces visible. */
export function displayKey(key: string): string {
  return key === ' ' ? '␣' : key;
}

const FRIENDLY: Record<string, string> = {
  '<CR>': 'Enter',
  '<Esc>': 'Escape',
  '<BS>': 'Backspace',
  '<Del>': 'Delete',
  '<Tab>': 'Tab',
  '<Left>': 'Left',
  '<Right>': 'Right',
  '<Up>': 'Up',
  '<Down>': 'Down',
  '<Home>': 'Home',
  '<End>': 'End',
  ' ': 'Space',
};

/** Plain-English name for keys whose vim notation isn't obvious, e.g. `<CR>` → `Enter`. */
export function friendlyKey(key: string): string | null {
  if (FRIENDLY[key]) return FRIENDLY[key];
  const ctrl = key.match(/^<C-(.+)>$/);
  return ctrl ? `Ctrl+${ctrl[1].length === 1 ? ctrl[1].toUpperCase() : ctrl[1]}` : null;
}
