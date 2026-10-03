import type { LessonDef } from '../types';

export const deleting: LessonDef = {
  id: 'delete',
  title: 'Delete things',
  commands: [
    { keys: 'dw', name: 'delete word', vscode: 'Ctrl+Delete' },
    { keys: 'dd', name: 'delete line', vscode: 'Ctrl+Shift+K' },
    { keys: 'D', name: 'delete to line end', vscode: 'Shift+End, Delete' },
    { keys: '2dd', name: 'counts repeat a command', vscode: null },
  ],
  drills: [
    { id: 'delete-1', prompt: 'One "really" is enough', start: '‸really really cool', goal: 'really cool', solution: 'dw' },
    { id: 'delete-2', prompt: 'Delete the middle line', start: 'keep\n‸delete me\nkeep too', goal: 'keep\nkeep too', solution: 'dd' },
    { id: 'delete-3', prompt: 'Drop the comment', start: 'done;‸ // old', goal: 'done;', solution: 'D' },
    { id: 'delete-4', prompt: 'Delete two words', start: '‸a b c d', goal: 'c d', solution: 'd2w' },
    { id: 'delete-5', prompt: 'Delete two lines', start: 'one\n‸two\nthree\nfour', goal: 'one\nfour', solution: '2dd' },
    { id: 'delete-6', prompt: 'Delete the extra word', start: 'one ‸extra two', goal: 'one two', solution: 'dw' },
    { id: 'delete-7', prompt: 'Delete three lines', start: '‸a\nb\nc\nd', goal: 'd', solution: '3dd' },
    { id: 'delete-8', prompt: 'Cut the filler', start: 'this is ‸really very cool', goal: 'this is cool', solution: 'd2w' },
  ],
};

export const change: LessonDef = {
  id: 'change',
  title: 'Change things',
  commands: [
    { keys: 'cw', name: 'change to word end', vscode: 'Ctrl+Shift+→, type' },
    { keys: 'ciw', name: 'change whole word', vscode: 'Ctrl+D, type' },
    { keys: 'ci"', name: 'change inside quotes', vscode: 'Shift+Alt+→, type' },
    { keys: 'ci(', name: 'change inside parens', vscode: 'Shift+Alt+→, type' },
    { keys: 'C', name: 'change to line end', vscode: 'Shift+End, type' },
  ],
  drills: [
    { id: 'change-1', prompt: 'Paint it blue', start: 'the ‸red car', goal: 'the blue car', solution: 'cwblue<Esc>' },
    { id: 'change-2', prompt: 'Swap the color', start: 'the bl‸ack cat', goal: 'the white cat', solution: 'ciwwhite<Esc>' },
    { id: 'change-3', prompt: 'Rename them', start: 'name = "Al‸ex"', goal: 'name = "Sam"', solution: 'ci"Sam<Esc>' },
    { id: 'change-4', prompt: 'Empty the call', start: 'print(‸"hi")', goal: 'print()', solution: 'ci(<Esc>' },
    { id: 'change-5', prompt: 'Replace the value', start: 'x = ‸old value', goal: 'x = 42', solution: 'C42<Esc>' },
    { id: 'change-6', prompt: 'Change the port', start: 'port = ‸3000', goal: 'port = 8080', solution: 'cw8080<Esc>' },
    { id: 'change-7', prompt: 'Change the index', start: 'list[‸old]', goal: 'list[new]', solution: 'ci[new<Esc>' },
    { id: 'change-8', prompt: 'Rewrite the status', start: 'status: ‸broken stuff', goal: 'status: ok', solution: 'Cok<Esc>' },
  ],
};

export const paste: LessonDef = {
  id: 'paste',
  title: 'Copy & paste',
  commands: [
    { keys: 'yy', name: 'copy line', vscode: 'Ctrl+C (no selection)' },
    { keys: 'p', name: 'paste after', vscode: 'Ctrl+V' },
    { keys: 'P', name: 'paste before', vscode: 'Ctrl+V' },
    { keys: '.', name: 'repeat last change', vscode: null },
    { keys: 'u', name: 'undo', vscode: 'Ctrl+Z' },
  ],
  drills: [
    { id: 'paste-1', prompt: 'Duplicate the line', start: '‸row', goal: 'row\nrow', solution: 'yyp' },
    { id: 'paste-2', prompt: 'Swap the lines', start: '‸b\na', goal: 'a\nb', solution: 'ddp' },
    { id: 'paste-3', prompt: 'Fix the swapped letters', start: 't‸eh', goal: 'the', solution: 'xp' },
    { id: 'paste-4', prompt: 'Make it all new', start: '‸old old old', goal: 'new new new', solution: 'cwnew<Esc>w.w.' },
    { id: 'paste-5', prompt: 'Delete two lines, the dot way', start: '‸1\n2\n3\n4', goal: '3\n4', solution: 'dd.' },
    { id: 'paste-6', prompt: 'Make three rows', start: '‸row', goal: 'row\nrow\nrow', solution: 'yypp' },
    { id: 'paste-7', prompt: 'Move the line down', start: '‸first\nsecond\nthird', goal: 'second\nfirst\nthird', solution: 'ddp' },
    { id: 'paste-8', prompt: 'Make them all "y"', start: '‸x x x', goal: 'y y y', solution: 'cwy<Esc>w.w.' },
  ],
};

export const find: LessonDef = {
  id: 'find',
  title: 'Find on a line',
  commands: [
    { keys: 'f', name: 'jump to a character', vscode: null },
    { keys: 't', name: 'jump to just before it', vscode: null },
    { keys: ';', name: 'repeat the last f/t', vscode: null },
  ],
  drills: [
    { id: 'find-1', prompt: 'Jump to the comma', start: '‸call(a, b)', goal: 'call(a‸, b)', solution: 'f,' },
    { id: 'find-2', prompt: 'Jump to the third dot', start: '‸a.b.c.d', goal: 'a.b.c‸.d', solution: 'f.;;' },
    { id: 'find-3', prompt: 'Delete up to the colon', start: '‸delete until here: keep', goal: ': keep', solution: 'dt:' },
    { id: 'find-4', prompt: 'Cut everything after the name', start: '‸name: x, age: y', goal: 'name: x', solution: 'f,D' },
    { id: 'find-5', prompt: 'Change the condition', start: '‸if (ready) {', goal: 'if (done) {', solution: 'f(ci(done<Esc>' },
    { id: 'find-6', prompt: 'Stop just before the paren', start: '‸call(x)', goal: 'cal‸l(x)', solution: 't(' },
    { id: 'find-7', prompt: 'Change everything up to the comma', start: '‸old stuff here, keep', goal: 'new, keep', solution: 'ct,new<Esc>' },
    { id: 'find-8', prompt: 'Delete through the colon', start: '‸key:value', goal: 'value', solution: 'df:' },
  ],
};
