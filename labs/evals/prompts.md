# Skill evals

How the skill is tested: the same screen, its content fixed in the prompt, built by a fresh agent that reads
only the skill's markdown, in Paper and in code. What varies between runs is the skill; what is measured is
how well the system was applied, never what was put on the page (the content is the client's).

## The rule

Every prompt gives the content in full: the product, the sidebar places, the page's title and line, the
actions, the columns and the rows, the filters, the views. The agent builds exactly that and invents nothing.
A prompt that leaves content open measures guessing, not the skill.

## Runs so far (2026-11-07, Paper file "continuum test")

| Page | Prompt                    | Skill state                                    | Result                                                   |
| ---- | ------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| 1–8  | eight vague prompts       | the old skill (rules.md), source allowed       | content guessed; sizes, fonts, filters, settings, totals, tabs wrong |
| 5b   | notification settings     | old skill + two settings rules, markdown only  | structure right; every value missing (no hex, no sizes)  |
| 5c   | notification settings     | foundations.md + pages.md only                 | right; a few sidebar details and four small contradictions |
| 9a   | orders index, content fixed | the full new skill, React source allowed     | right; read source for five details; found four contradictions between files (chip, pagination, sidebar groups, account avatar), fixed |
| 9b   | orders index, content fixed | no components.md, no assets                  | right in structure; guessed the part-level values (secondary button, badges, picker, pager), all of which components.md holds; found the dock geometry error, fixed |

## The prompt set

Eight screens, each with its content written out as the orders prompt is (see 9a in the Paper file for the
wording). The kinds they cover:

| #   | Screen                              | Kind              | Tests                                                      |
| --- | ----------------------------------- | ----------------- | ---------------------------------------------------------- |
| 1   | Orders                              | index             | toolbar, applied filters, ruled table, views in the dock   |
| 2   | A customer                          | detail            | title row, pill tabs, stat cards, the fact grid, a sheet   |
| 3   | Warehouse overview                  | overview          | the leading chart card, stat cards that never repeat it    |
| 4   | New invoice                         | create            | 640, sections, fields, the lines table with totals         |
| 5   | Notification settings               | settings          | 640, a card per group, one control per setting, the dock   |
| 6   | An agent run                        | detail (log)      | the step row pattern, code blocks, badges only on exceptions |
| 7   | Members                             | index + a section | two objects on one page, a row menu, invite as the primary |
| 8   | Maintenance planning                | planner           | the schedule grid pattern, a table of what is due          |

## Scoring

1. **Mechanical** (`/continuum-review`, once it exists): type sizes on the scale, two weights, hex only from
   the ramps, hairlines, controls on 34 or 38, the column at its kind's width, corners from the scale, one
   primary action, views in the dock, a breadcrumb.
2. **The gap list**: everything the agent had to guess, as it reports it. Each item becomes a line in the skill
   or shows the skill is enough.
3. **Blind A/B** by Joan: two runs side by side, which is better. Taste stays the final judge.

A change to the skill is kept when the gap list shrinks and the A/B does not get worse.
