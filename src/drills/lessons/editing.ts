import type { LessonDef } from '../types';

export const fixes: LessonDef = {
  id: 'fixes',
  title: 'Small fixes',
  commands: [
    { keys: 'r', name: 'replace one character', vscode: null },
    { keys: 'R', name: 'type over text', vscode: 'Insert key, type' },
    { keys: 's', name: 'swap a character for text', vscode: null },
    { keys: 'S', name: 'rewrite the whole line', vscode: 'Home, Shift+End, type' },
    { keys: 'J', name: 'join with the next line', vscode: 'Ctrl+J (Mac)' },
    { keys: '~', name: 'flip upper/lower case', vscode: null },
    { keys: '<C-a>', name: 'add 1 to a number', vscode: null },
    { keys: '<C-x>', name: 'subtract 1 from a number', vscode: null },
  ],
  drills: [
    { id: 'fixes-1', prompt: 'Fix the typo', start: 'c‸st', goal: 'cat', solution: 'ra' },
    { id: 'fixes-2', prompt: 'Capitalize it', start: '‸hello', goal: 'Hello', solution: '~' },
    { id: 'fixes-3', prompt: 'Join the lines', start: '‸one\ntwo', goal: 'one two', solution: 'J' },
    { id: 'fixes-4', prompt: 'Overwrite the year', start: 'year: ‸1999', goal: 'year: 2026', solution: 'R2026<Esc>' },
    { id: 'fixes-5', prompt: 'Spell out "it\'s"', start: "it‸'s", goal: 'it is', solution: 's i<Esc>' },
    { id: 'fixes-6', prompt: 'Rewrite the line', start: 'messy ‸line', goal: 'clean', solution: 'Sclean<Esc>' },
    { id: 'fixes-7', prompt: 'Bump the version', start: '‸version = 3', goal: 'version = 4', solution: '<C-a>' },
    { id: 'fixes-8', prompt: 'Lose two lives', start: '‸lives: 5', goal: 'lives: 3', solution: '2<C-x>' },
    { id: 'fixes-9', prompt: 'Join all three', start: '‸a\nb\nc', goal: 'a b c', solution: '3J' },
  ],
};

export const objects: LessonDef = {
  id: 'objects',
  title: 'Text objects',
  commands: [
    { keys: 'aw', name: 'a word plus its space', vscode: 'Ctrl+D' },
    { keys: 'a"', name: 'a string, quotes included', vscode: 'Shift+Alt+→' },
    { keys: "i'", name: 'inside single quotes', vscode: 'Shift+Alt+→' },
    { keys: 'i{', name: 'inside braces', vscode: 'Shift+Alt+→' },
    { keys: 'a(', name: 'parens included', vscode: 'Shift+Alt+→' },
    { keys: 'a[', name: 'brackets included', vscode: 'Shift+Alt+→' },
    { keys: 'ap', name: 'a paragraph (block)', vscode: null },
  ],
  drills: [
    { id: 'objects-1', prompt: 'Delete the word and its space', start: 'one ex‸tra two', goal: 'one two', solution: 'daw' },
    { id: 'objects-2', prompt: 'Remove the string, quotes and all', start: 'say(‸"hi")', goal: 'say()', solution: 'da"' },
    { id: 'objects-3', prompt: 'Change the message', start: "msg = 'h‸ey'", goal: "msg = 'yo'", solution: "ci'yo<Esc>" },
    { id: 'objects-4', prompt: 'Empty the block', start: 'fn() {‸return 1}', goal: 'fn() {}', solution: 'di{' },
    { id: 'objects-5', prompt: 'Drop the arguments, parens too', start: 'call(‸a, b) + 1', goal: 'call + 1', solution: 'da(' },
    { id: 'objects-6', prompt: 'Drop the index, brackets too', start: 'x = list[‸0] + 1', goal: 'x = list + 1', solution: 'da[' },
    { id: 'objects-7', prompt: 'Delete the middle block', start: 'a\nb\n\n‸c\nd\n\ne', goal: 'a\nb\n\ne', solution: 'dap' },
    { id: 'objects-8', prompt: 'Say it twice', start: '‸very good', goal: 'very very good', solution: 'yawP' },
  ],
};

export const combos: LessonDef = {
  id: 'combos',
  title: 'Combos',
  commands: [
    { keys: '3w', name: 'a count repeats a motion', vscode: null },
    { keys: '5x', name: 'a count repeats a command', vscode: null },
    { keys: 'c2w', name: 'operator + count + motion', vscode: null },
    { keys: 'd0', name: 'delete back to line start', vscode: 'Ctrl+Backspace (roughly)' },
    { keys: 'dj', name: 'delete this line and the next', vscode: null },
    { keys: '>>', name: 'indent the line', vscode: 'Ctrl+]' },
    { keys: 'gU', name: 'uppercase (takes a motion)', vscode: null },
  ],
  drills: [
    { id: 'combos-1', prompt: 'Skip three words', start: '‸a b c d e', goal: 'a b c ‸d e', solution: '3w' },
    { id: 'combos-2', prompt: 'Delete the junk', start: '‸xxxxxkeep', goal: 'keep', solution: '5x' },
    { id: 'combos-3', prompt: 'Change two words', start: 'the ‸big red ball', goal: 'the blue ball', solution: 'c2wblue<Esc>' },
    { id: 'combos-4', prompt: 'Delete back to the start', start: 'junk junk ‸keep', goal: 'keep', solution: 'd0' },
    { id: 'combos-5', prompt: 'Delete two lines with a motion', start: '‸a\nb\nc', goal: 'c', solution: 'dj' },
    { id: 'combos-6', prompt: 'Indent the line', start: '‸return x', goal: '  return x', solution: '>>' },
    { id: 'combos-7', prompt: 'Indent three lines', start: '‸a\nb\nc\nd', goal: '  a\n  b\n  c\nd', solution: '3>>' },
    { id: 'combos-8', prompt: 'Shout the label', start: '‸todo: fix', goal: 'TODO: fix', solution: 'gUw' },
    { id: 'combos-9', prompt: 'Delete three words', start: '‸one two three four', goal: 'four', solution: 'd3w' },
  ],
};
