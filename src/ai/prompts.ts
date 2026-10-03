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
