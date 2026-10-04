import type { LessonDef } from '../types';

export const substitute: LessonDef = {
  id: 'substitute',
  title: 'Substitute',
  commands: [
    { keys: ':s/a/b/', name: 'replace the first match on the line', vscode: 'Ctrl+H' },
    { keys: ':s/a/b/g', name: 'replace every match on the line', vscode: 'Ctrl+H, Replace All' },
    { keys: ':%s/a/b/g', name: 'replace every match in the file', vscode: 'Ctrl+H, Replace All' },
    { keys: ':%s/a//', name: 'delete the first match on every line', vscode: null },
  ],
  drills: [
    { id: 'substitute-1', prompt: 'Swap every "foo" on this line', start: '‸foo(foo, foo, foo)', goal: 'bar(bar, bar, bar)', solution: ':s/foo/bar/g<CR>' },
    { id: 'substitute-2', prompt: 'Rename x to y everywhere', start: '‸let x = 1\nx = x + 1\nprint(x)', goal: 'let y = 1\ny = y + 1\nprint(y)', solution: ':%s/x/y/g<CR>' },
    { id: 'substitute-3', prompt: 'Fix the spelling on this line only', start: 'teh one\n‸teh two teh\nteh three', goal: 'teh one\nthe two the\nteh three', solution: ':s/teh/the/g<CR>' },
    { id: 'substitute-4', prompt: 'Swap the bullets', start: '‸- a\n- b\n- c\n- d\n- e\n- f', goal: '* a\n* b\n* c\n* d\n* e\n* f', solution: ':%s/-/*/<CR>' },
    { id: 'substitute-5', prompt: 'Drop every semicolon', start: '‸a();\nb();\nc();\nd();', goal: 'a()\nb()\nc()\nd()', solution: ':%s/;//<CR>' },
  ],
};

export const macros: LessonDef = {
  id: 'macros',
  title: 'Macros',
  commands: [
    { keys: 'qa', name: 'start recording into a', vscode: null },
    { keys: 'q', name: 'stop recording', vscode: null },
    { keys: '@a', name: 'play back a', vscode: null },
    { keys: '@@', name: 'play the last macro again', vscode: null },
    { keys: '"ay', name: 'copy into register a', vscode: null },
    { keys: '"ap', name: 'paste from register a', vscode: null },
  ],
  drills: [
    { id: 'macros-1', prompt: 'Quote every line', start: '‸a\nb\nc', goal: '"a"\n"b"\n"c"', solution: 'qaI"<Esc>A"<Esc>jq2@a' },
    { id: 'macros-2', prompt: 'Log every line', start: '‸a\nb\nc\nd', goal: 'log(a)\nlog(b)\nlog(c)\nlog(d)', solution: 'qaIlog(<Esc>A)<Esc>jq3@a' },
    { id: 'macros-3', prompt: 'Count to five', start: '‸1', goal: '1\n2\n3\n4\n5', solution: 'qayyp<C-a>q3@a' },
    { id: 'macros-4', prompt: 'Keep the title safe while you delete', start: '‸title\njunk\nend', goal: 'title\nend\ntitle', solution: '"ayyjdd"ap' },
    { id: 'macros-5', prompt: 'Record once, replay with @@', start: '‸a\nb\nc', goal: '[a]\n[b]\n[c]', solution: 'qaI[<Esc>A]<Esc>jq@a@@' },
  ],
};
