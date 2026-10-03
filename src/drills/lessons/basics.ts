import type { LessonDef } from '../types';

export const hjkl: LessonDef = {
  id: 'hjkl',
  title: 'Move with hjkl',
  commands: [
    { keys: 'h', name: 'left', vscode: '←' },
    { keys: 'j', name: 'down', vscode: '↓' },
    { keys: 'k', name: 'up', vscode: '↑' },
    { keys: 'l', name: 'right', vscode: '→' },
  ],
  drills: [
    { id: 'hjkl-1', prompt: 'Put the cursor on "is"', start: '‸vim is fun', goal: 'vim ‸is fun', solution: 'llll' },
    { id: 'hjkl-2', prompt: 'Go up a line', start: 'line one\n‸line two\nline three', goal: '‸line one\nline two\nline three', solution: 'k' },
    { id: 'hjkl-3', prompt: 'Get to "gamma"', start: '‸alpha\nbeta\ngamma', goal: 'alpha\nbeta\n‸gamma', solution: 'jj' },
    { id: 'hjkl-4', prompt: 'Back to the start', start: 'ab‸cdef', goal: '‸abcdef', solution: 'hh' },
    { id: 'hjkl-5', prompt: 'Land on the "r"', start: '‸one\ntwo\nthree', goal: 'one\ntwo\nth‸ree', solution: 'jjll' },
  ],
};

export const insert: LessonDef = {
  id: 'insert',
  title: 'Insert & escape',
  commands: [
    { keys: 'i', name: 'insert before cursor', vscode: 'Just type' },
    { keys: 'a', name: 'insert after cursor', vscode: '→ then type' },
    { keys: '<Esc>', name: 'back to normal mode', vscode: null },
    { keys: 'x', name: 'delete character', vscode: 'Delete' },
  ],
  drills: [
    { id: 'insert-1', prompt: 'Remove the extra "l"', start: '‸Helllo', goal: 'Hello', solution: 'llx' },
    { id: 'insert-2', prompt: 'Add the missing "a"', start: '‸ct', goal: 'cat', solution: 'aa<Esc>' },
    { id: 'insert-3', prompt: 'Add the missing "w"', start: 'hello ‸orld', goal: 'hello world', solution: 'iw<Esc>' },
    { id: 'insert-4', prompt: 'Say it with feeling', start: 'I ‸vim', goal: 'I love vim', solution: 'ilove <Esc>' },
    { id: 'insert-5', prompt: 'Clean up the junk', start: '‸xxvim', goal: 'vim', solution: 'xx' },
  ],
};

export const words: LessonDef = {
  id: 'words',
  title: 'Word jumps',
  commands: [
    { keys: 'w', name: 'next word start', vscode: 'Ctrl+→' },
    { keys: 'b', name: 'previous word start', vscode: 'Ctrl+←' },
    { keys: 'e', name: 'end of word', vscode: 'Ctrl+→ (roughly)' },
  ],
  drills: [
    { id: 'words-1', prompt: 'Jump to "brown"', start: '‸the quick brown fox', goal: 'the quick ‸brown fox', solution: 'ww' },
    { id: 'words-2', prompt: 'Jump back to "quick"', start: 'the quick brown ‸fox', goal: 'the ‸quick brown fox', solution: 'bb' },
    { id: 'words-3', prompt: 'Land on the end of "quick"', start: '‸the quick brown fox', goal: 'the quic‸k brown fox', solution: 'ee' },
    { id: 'words-4', prompt: 'Upgrade the editor', start: '‸I like vim', goal: 'I like neovim', solution: 'wwineo<Esc>' },
    { id: 'words-5', prompt: 'Make it plural', start: '‸save the file', goal: 'save the files', solution: 'eeeas<Esc>' },
  ],
};

export const lines: LessonDef = {
  id: 'lines',
  title: 'Line jumps',
  commands: [
    { keys: '0', name: 'start of line', vscode: 'Home' },
    { keys: '$', name: 'end of line', vscode: 'End' },
    { keys: 'I', name: 'insert at line start', vscode: 'Home then type' },
    { keys: 'A', name: 'append at line end', vscode: 'End then type' },
    { keys: 'o', name: 'new line below', vscode: 'Ctrl+Enter' },
    { keys: 'O', name: 'new line above', vscode: 'Ctrl+Shift+Enter' },
  ],
  drills: [
    { id: 'lines-1', prompt: 'Go to the end of the line', start: 'some ‸long line', goal: 'some long lin‸e', solution: '$' },
    { id: 'lines-2', prompt: 'Go to the start of the line', start: 'some long ‸line', goal: '‸some long line', solution: '0' },
    { id: 'lines-3', prompt: 'Add the semicolon', start: '‸let x = 1', goal: 'let x = 1;', solution: 'A;<Esc>' },
    { id: 'lines-4', prompt: 'Add a prefix', start: 'b‸ar', goal: 'foobar', solution: 'Ifoo<Esc>' },
    { id: 'lines-5', prompt: 'Add the third item', start: 'item one\n‸item two', goal: 'item one\nitem two\nitem three', solution: 'oitem three<Esc>' },
    { id: 'lines-6', prompt: 'Add a line above', start: '‸second', goal: 'first\nsecond', solution: 'Ofirst<Esc>' },
  ],
};
