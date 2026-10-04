import type { Drill, Lesson } from '../drills/types';
import { describeKeys } from './key-summary';
import type { ChatMessage } from './protocol';

const SYSTEM = [
  'You are a friendly vim coach. The learner uses VS Code every day and is new to vim.',
  'Talk to the learner directly as "you".',
  'Reply in one or two short sentences of plain text. No lists, no headings, no greetings.',
  'Wrap every vim key or command in backticks, like `ciw` or `<Esc>`.',
  'Only mention standard vim commands. Never invent commands.',
].join(' ');

function describe(drill: Drill, lesson: Lesson, withCommands = true): string {
  const goal =
    drill.kind === 'cursor'
      ? `Move the cursor to offset ${drill.goalCursor} (the character "${drill.goalText.charAt(drill.goalCursor ?? 0)}") without changing the text.`
      : `Make the buffer read:\n${drill.goalText}`;
  const commands = lesson.commands.map((c) => `${c.keys} (${c.name})`).join(', ');
  return [
    withCommands ? `Lesson: ${lesson.title}. Commands taught: ${commands}.` : `Lesson: ${lesson.title}.`,
    `Task: ${drill.prompt}`,
    `Starting buffer (cursor at offset ${drill.startCursor}):\n${drill.startText}`,
    goal,
  ].join('\n\n');
}

/** After a solve that went over par: explain what the shorter path does differently. */
export function feedbackMessages(drill: Drill, lesson: Lesson, keys: readonly string[]): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content: [
        describe(drill, lesson, false),
        `The learner solved it with ${keys.length} keys: ${describeKeys(keys)}`,
        `The shortest known answer is ${drill.par} keys: ${describeKeys(drill.solution)}`,
        'Explain what the shorter answer does differently and why it saves keys. Only talk about keys that appear in the two lists above.',
      ].join('\n\n'),
    },
  ];
}

/** While stuck: nudge toward the right command without giving the full answer. */
export function hintMessages(drill: Drill, lesson: Lesson, keysSoFar: readonly string[]): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content: [
        describe(drill, lesson),
        `Keys pressed so far: ${describeKeys(keysSoFar)}`,
        `For your reference only, one answer is: ${describeKeys(drill.solution)}`,
        'Give a hint that points to the right command without spelling out the whole key sequence.',
      ].join('\n\n'),
    },
  ];
}

const TOPICS = [
  'a JavaScript config object', 'a Python function call', 'a shopping list', 'a todo note',
  'a CSS rule', 'a git commit message', 'a recipe step', 'a server log line', 'a JSON setting',
  'a short note to a friend', 'an HTML tag with an attribute', 'a SQL query', 'a game score line',
];

/** Asks for fresh buffer text in the same style as the lesson's own drills. Keys are the app's job. */
export function drillTextMessages(lesson: Lesson, random: () => number = Math.random): ChatMessage[] {
  const topic = TOPICS[Math.floor(random() * TOPICS.length)];
  const examples = lesson.drills
    .filter((d) => !d.generated)
    .slice(0, 3)
    .map((d) => d.startText)
    .join('\n---\n');
  return [
    { role: 'system', content: 'You write tiny snippets of text for vim practice. Reply with only the snippet.' },
    {
      role: 'user',
      content: [
        `Write 1 or 2 short lines (under 40 characters each) of ${topic}.`,
        'Use plain words and, where it fits, quotes, parentheses or brackets.',
        `Similar in size to these:\n${examples}`,
        'Reply with only the lines. No explanation, no code fences.',
      ].join('\n\n'),
    },
  ];
}

/** Asks for a short instruction for an edit the app already knows happened. */
export function drillPromptMessages(before: string, after: string): ChatMessage[] {
  return [
    { role: 'system', content: 'You write very short instructions for vim practice drills. Reply with only the instruction.' },
    {
      role: 'user',
      content: [
        `Before:\n${before}\n\nAfter:\n${after}`,
        'Write a 2 to 5 word instruction for this edit, naming the word that changes. Examples: "Paint it blue", "Delete the extra word", "Drop the comment".',
      ].join('\n\n'),
    },
  ];
}
