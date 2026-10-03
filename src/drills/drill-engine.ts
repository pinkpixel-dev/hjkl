import { parseKeys } from './keys';
import type { Drill, DrillDef, Lesson, LessonDef } from './types';

/** Marks the cursor position inside authored drill text. */
export const CURSOR_MARK = '‸';

function splitMark(text: string): { text: string; cursor: number | null } {
  const index = text.indexOf(CURSOR_MARK);
  if (index === -1) return { text, cursor: null };
  if (text.indexOf(CURSOR_MARK, index + 1) !== -1) {
    throw new Error(`More than one cursor mark in: ${text}`);
  }
  return { text: text.slice(0, index) + text.slice(index + 1), cursor: index };
}

export function buildDrill(def: DrillDef, lessonId: string): Drill {
  const start = splitMark(def.start);
  const goal = splitMark(def.goal);
  const solution = parseKeys(def.solution);
  if (start.cursor === null) throw new Error(`Drill ${def.id} has no start cursor`);
  if (goal.cursor !== null && goal.text !== start.text) {
    throw new Error(`Cursor drill ${def.id} must not change the text`);
  }
  return {
    id: def.id,
    lessonId,
    prompt: def.prompt,
    startText: start.text,
    startCursor: start.cursor,
    kind: goal.cursor === null ? 'edit' : 'cursor',
    goalText: goal.text,
    goalCursor: goal.cursor,
    solution,
    par: solution.length,
  };
}

export function buildLesson(def: LessonDef): Lesson {
  return {
    id: def.id,
    title: def.title,
    commands: def.commands,
    drills: def.drills.map((d) => buildDrill(d, def.id)),
  };
}

export interface EditorSnapshot {
  text: string;
  cursor: number;
  /** True while vim is in insert or visual mode. Drills only finish in normal mode. */
  busy: boolean;
}

export function isSolved(drill: Drill, snap: EditorSnapshot): boolean {
  if (snap.busy || snap.text !== drill.goalText) return false;
  return drill.kind === 'edit' || snap.cursor === drill.goalCursor;
}

export type Grade = 'under' | 'par' | 'over';

export function grade(keyCount: number, par: number): Grade {
  if (keyCount < par) return 'under';
  return keyCount === par ? 'par' : 'over';
}
