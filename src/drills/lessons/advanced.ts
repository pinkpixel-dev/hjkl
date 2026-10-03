import type { LessonDef } from '../types';

export const search: LessonDef = {
  id: 'search',
  title: 'Search',
  commands: [
    { keys: '/', name: 'search forward', vscode: 'Ctrl+F' },
    { keys: 'n', name: 'next match', vscode: 'Enter (in find)' },
    { keys: '*', name: 'search word under cursor', vscode: 'Ctrl+F3' },
  ],
  drills: [
    { id: 'search-1', prompt: 'Find the line', start: '‸one\ntwo\nthree\nfour\nfive\nsix\nseven\nfind me', goal: 'one\ntwo\nthree\nfour\nfive\nsix\nseven\n‸find me', solution: '/fin<CR>' },
    { id: 'search-2', prompt: 'Find the bug', start: '‸x\nx\nx\nx\nx\nlook here for the bug', goal: 'x\nx\nx\nx\nx\nlook here for the ‸bug', solution: '/bu<CR>' },
    { id: 'search-3', prompt: 'Jump to where "total" shows up again', start: '‸total = 1\nx = 2\ny = total', goal: 'total = 1\nx = 2\ny = ‸total', solution: '*' },
    { id: 'search-4', prompt: 'Find the last "id"', start: '‸id = 1\nfoo(bar)\nprint(id)\nreturn id', goal: 'id = 1\nfoo(bar)\nprint(id)\nreturn ‸id', solution: '*n' },
  ],
};

export const visual: LessonDef = {
  id: 'visual',
  title: 'Visual mode',
  commands: [
    { keys: 'v', name: 'select characters', vscode: 'Shift+arrows' },
    { keys: 'V', name: 'select whole lines', vscode: 'Ctrl+L' },
    { keys: 'U', name: 'uppercase selection', vscode: null },
    { keys: '>', name: 'indent selection', vscode: 'Tab' },
    { keys: 'd', name: 'delete selection', vscode: 'Delete' },
    { keys: 'y', name: 'copy selection', vscode: 'Ctrl+C' },
  ],
  drills: [
    { id: 'visual-1', prompt: 'Delete two lines with V', start: '‸a\nb\nc', goal: 'c', solution: 'Vjd' },
    { id: 'visual-2', prompt: 'Delete across the line break', start: 'ab‸cd\nef', goal: 'ab', solution: 'vjd' },
    { id: 'visual-3', prompt: 'Copy both lines below', start: '‸a\nb', goal: 'a\nb\na\nb', solution: 'Vjyjp' },
    { id: 'visual-4', prompt: 'Make it loud', start: '‸loud noises', goal: 'LOUD noises', solution: 'veU' },
    { id: 'visual-5', prompt: 'Swap the greeting', start: 'say ‸hello there friend', goal: 'say bye friend', solution: 'veecbye<Esc>' },
    { id: 'visual-6', prompt: 'Indent two lines', start: '‸a\nb\nc', goal: '  a\n  b\nc', solution: 'Vj>' },
  ],
};
