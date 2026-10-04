import { buildLesson } from '../drill-engine';
import type { Lesson } from '../types';
import { hjkl, insert, words, lines } from './basics';
import { deleting, change, paste, find } from './operators';
import { search, visual } from './advanced';
import { jump, backward } from './motion';
import { fixes, objects, combos } from './editing';
import { substitute, macros } from './power';

export const LESSONS: Lesson[] = [
  hjkl, insert, words, lines, jump, fixes,
  deleting, change, objects, paste, find, combos,
  search, backward, visual, substitute, macros,
].map(buildLesson);
