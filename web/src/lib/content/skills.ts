import 'server-only';
import { existsSync } from 'node:fs';
import { listRepoDir, once, readRepoFile, repoPath } from './files';
import { type MdDoc, parseMarkdown } from './markdown';

/*
 * The skills in .claude/skills, each from its SKILL.md: the frontmatter's name and description,
 * the body split by headings, and the reference files it carries (written by hand; the built
 * `assets/` and `references/screens/` are left out).
 */

export type SkillInfo = {
    /** The folder's and the frontmatter's name ('continuum-taste'). */
    name: string;
    /** The frontmatter's description: when an agent reaches for it. */
    description: string;
    /** SKILL.md's body, split by its headings. */
    doc: MdDoc;
    /** SKILL.md's body as markdown, the frontmatter removed. */
    markdown: string;
    /** Its reference files, from the skill's folder ('references/foundations.md' …), sorted. */
    references: string[];
};

/** Splits `---\nname: …\ndescription: …\n---` from the body. One-line values only, as the skills write them. */
const frontmatter = (text: string) => {
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
    const fields: Record<string, string> = {};
    for (const line of (match?.[1] ?? '').split(/\r?\n/)) {
        const field = /^([\w-]+):\s*(.*)$/.exec(line);
        if (field?.[1]) fields[field[1]] = (field[2] ?? '').replace(/^['"]|['"]$/g, '');
    }
    return { fields, body: match ? text.slice(match[0].length) : text };
};

/** The markdown files under a skill's references/, but the built screens. */
const referenceFiles = (skill: string, dir = 'references'): string[] => {
    const relative = `.claude/skills/${skill}/${dir}`;
    if (!existsSync(repoPath(relative))) return [];
    return listRepoDir(relative).flatMap(entry => {
        if (entry.isDirectory()) {
            return entry.name === 'screens' ? [] : referenceFiles(skill, `${dir}/${entry.name}`);
        }
        return entry.name.endsWith('.md') ? [`${dir}/${entry.name}`] : [];
    });
};

/** Every skill in the repository, by name. */
export const skills = once((): SkillInfo[] =>
    listRepoDir('.claude/skills')
        .filter(entry => entry.isDirectory())
        .filter(entry => existsSync(repoPath('.claude/skills', entry.name, 'SKILL.md')))
        .map(entry => {
            const { fields, body } = frontmatter(
                readRepoFile(`.claude/skills/${entry.name}/SKILL.md`),
            );
            return {
                name: fields.name ?? entry.name,
                description: fields.description ?? '',
                doc: parseMarkdown(body),
                markdown: body.trim(),
                references: referenceFiles(entry.name).sort(),
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
);

/** One skill by name. */
export const skill = (name: string) => skills().find(s => s.name === name);
