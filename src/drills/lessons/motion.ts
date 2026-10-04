import type { LessonDef } from '../types';

export const jump: LessonDef = {
  id: 'jump',
  title: 'File jumps',
  commands: [
    { keys: 'gg', name: 'top of the file', vscode: 'Ctrl+Home' },
    { keys: 'G', name: 'bottom of the file', vscode: 'Ctrl+End' },
    { keys: '^', name: 'first non-blank character', vscode: 'Home' },
    { keys: '%', name: 'matching bracket', vscode: 'Ctrl+Shift+\\' },
    { keys: '}', name: 'next blank line', vscode: null },
    { keys: '{', name: 'previous blank line', vscode: null },
  ],
  drills: [
    { id: 'jump-1', prompt: 'Go to the last line', start: '‸a\nb\nc\nd\ne\nlast', goal: 'a\nb\nc\nd\ne\n‸last', solution: 'G' },
    { id: 'jump-2', prompt: 'Back to the top', start: 'one\ntwo\nthree\nfo‸ur', goal: '‸one\ntwo\nthree\nfour', solution: 'gg' },
    { id: 'jump-3', prompt: 'Skip the indent', start: '‸    return x', goal: '    ‸return x', solution: '^' },
    { id: 'jump-4', prompt: 'Jump to the closing paren', start: '‸(a + (b * c))', goal: '(a + (b * c)‸)', solution: '%' },
    { id: 'jump-5', prompt: 'Find the matching brace', start: 'if (x) ‸{\n  run()\n}', goal: 'if (x) {\n  run()\n‸}', solution: '%' },
    { id: 'jump-6', prompt: 'Get to the first line of the next block', start: '‸a\nb\n\nc\nd', goal: 'a\nb\n\n‸c\nd', solution: '}j' },
    { id: 'jump-7', prompt: 'Back to the start of the block above', start: 'x\n\na\nb\n\nc\n‸d', goal: 'x\n\n‸a\nb\n\nc\nd', solution: '{{j' },
    { id: 'jump-8', prompt: 'Delete up to the top of the file', start: 'drop\ndrop\n‸drop\nkeep', goal: 'keep', solution: 'dgg' },
  ],
};

export const backward: LessonDef = {
  id: 'backward',
  title: 'Find backward',
  commands: [
    { keys: 'F', name: 'jump back to a character', vscode: null },
    { keys: 'T', name: 'jump back to just after it', vscode: null },
    { keys: ',', name: 'repeat f/t the other way', vscode: null },
    { keys: '?', name: 'search backward', vscode: 'Shift+F3' },
    { keys: 'N', name: 'previous match', vscode: 'Shift+Enter (in find)' },
    { keys: '#', name: 'search word under cursor, backward', vscode: null },
  ],
  drills: [
    { id: 'backward-1', prompt: 'Back to the paren', start: 'call(a, b‸)', goal: 'call‸(a, b)', solution: 'F(' },
    { id: 'backward-2', prompt: 'Back two dots', start: 'path.to.some.deep.v‸alue', goal: 'path.to.some‸.deep.value', solution: 'F.;' },
    { id: 'backward-3', prompt: 'Delete back to the paren', start: 'print(old value‸)', goal: 'print()', solution: 'dT(' },
    { id: 'backward-4', prompt: 'Search back up for "needle"', start: 'top\nx\nneedle\nx\nx\nx\n‸end', goal: 'top\nx\n‸needle\nx\nx\nx\nend', solution: '?ne<CR>' },
    { id: 'backward-5', prompt: 'Back to the previous "id"', start: 'id = 1\nfoo()\nreturn ‸id', goal: '‸id = 1\nfoo()\nreturn id', solution: '#' },
    { id: 'backward-6', prompt: 'Two "id"s back', start: 'x = id\nid += 1\nprint(id)\n‸id', goal: 'x = id\n‸id += 1\nprint(id)\nid', solution: '#n' },
  ],
};
