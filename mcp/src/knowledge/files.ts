import { references, skill as skillText } from 'virtual:knowledge';

/** SKILL.md as written. */
export const skill = skillText;

/** One references file by its path ('media/canvas.md'), or '' when there is none. */
export const reference = (path: string) => references[path] ?? '';
