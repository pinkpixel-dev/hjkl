/** A vim command taught by a lesson, with its closest VS Code habit. */
export interface Command {
  keys: string;
  name: string;
  /** Closest VS Code equivalent, or null when there isn't a real one. */
  vscode: string | null;
}

/**
 * A drill as authored. `start` and `goal` mark the cursor with CURSOR_MARK.
 * If `goal` contains the mark, the drill is a cursor drill (move there).
 * Otherwise it's an edit drill (make the buffer match `goal`).
 */
export interface DrillDef {
  id: string;
  prompt: string;
  start: string;
  goal: string;
  /** Reference keystrokes in vim notation, e.g. `ciwnew<Esc>`. Par = its length. */
  solution: string;
}

export interface Drill {
  id: string;
  lessonId: string;
  prompt: string;
  startText: string;
  startCursor: number;
  kind: 'edit' | 'cursor';
  goalText: string;
  /** Only set for cursor drills. */
  goalCursor: number | null;
  solution: string[];
  par: number;
  /** Written by the AI coach rather than by hand. */
  generated?: boolean;
}

export interface LessonDef {
  id: string;
  title: string;
  commands: Command[];
  drills: DrillDef[];
}

export interface Lesson {
  id: string;
  title: string;
  commands: Command[];
  drills: Drill[];
}
