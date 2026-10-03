import { buildLesson } from '../drill-engine';
import type { Lesson } from '../types';
import { hjkl, insert, words, lines } from './basics';
import { deleting, change, paste, find } from './operators';

export const LESSONS: Lesson[] = [hjkl, insert, words, lines, deleting, change, paste, find].map(buildLesson);
