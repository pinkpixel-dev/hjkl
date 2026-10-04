import { buildFromText, choosePrompt, describeChange, parseContent, toDrill } from '../drills/generated';
import type { Drill, DrillDef, Lesson } from '../drills/types';
import type { CoachClient } from './coach-client';
import { drillPromptMessages, drillTextMessages } from './prompts';

export interface GeneratorEvents {
  onDrill(drill: Drill, def: DrillDef): void;
  onProgress(made: number, target: number): void;
  onDone(made: number): void;
}

/**
 * Writes drills for a lesson one at a time in the background. Gemma writes fresh text and a
 * short instruction; the keys come from the lesson's own hand-written drills and are played in
 * real vim, so every drill is solvable at par. Coach feedback and hints take priority: if one
 * interrupts a step, the generator waits until the coach is free and tries again.
 */
export class DrillGenerator {
  private stopped = false;
  lessonId: string | null = null;

  constructor(private coach: CoachClient) {}

  get running(): boolean {
    return this.lessonId !== null;
  }

  stop(): void {
    this.stopped = true;
  }

  private async ask(messages: Parameters<CoachClient['ask']>[0], maxTokens: number, sample: boolean): Promise<string | null> {
    while (!this.stopped) {
      await this.coach.whenIdle();
      if (this.stopped || !this.coach.ready) return null;
      const reply = await this.coach.ask(messages, () => {}, { maxTokens, sample });
      if (!reply.aborted) return reply.text;
    }
    return null;
  }

  async run(lesson: Lesson, target: number, events: GeneratorEvents): Promise<void> {
    if (this.running) return;
    this.lessonId = lesson.id;
    this.stopped = false;
    let made = 0;
    let failures = 0;
    events.onProgress(0, target);
    while (made < target && failures < target * 2 && !this.stopped) {
      const raw = await this.ask(drillTextMessages(lesson), 60, true);
      if (raw === null) break;
      const text = parseContent(raw);
      const candidate = text && buildFromText(text, lesson, lesson.drills);
      if (!candidate) {
        failures++;
        console.info('Generated text had no usable drill:', raw);
        continue;
      }
      // Movement prompts are more precise when written from the result ("the end of status"),
      // so only edits get a model-written instruction.
      let prompt = describeChange(candidate.change);
      if (candidate.change.kind === 'edit') {
        const before = candidate.start.replace('‸', '');
        const promptRaw = await this.ask(drillPromptMessages(before, candidate.goal), 16, false);
        if (promptRaw !== null) prompt = choosePrompt(promptRaw, candidate.change);
      }
      const id = `ai-${lesson.id}-${Date.now().toString(36)}`;
      const { drill, def } = toDrill(candidate, prompt, lesson, id);
      made++;
      events.onDrill(drill, def);
      events.onProgress(made, target);
    }
    this.lessonId = null;
    events.onDone(made);
  }
}
