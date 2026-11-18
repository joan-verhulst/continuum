# AI test plan: skill and MCP across three model tiers

What this answers: does Continuum's AI side (the `continuum-taste` and `continuum-fix-padding` skills, the MCP
server, the `DESIGN.md` brief) make a model build better tool UI than it would alone, at each tier, with and
without the component library, and does it hold up on layouts no design system was written for?

It extends `prompts.md` (frozen content, fresh agent, gap list, blind A/B) rather than replacing it.

## 1. The axes

| Axis                | Values                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Model               | Haiku 5.5 (`claude-haiku-5-5`), Sonnet 5.5 (`claude-sonnet-5-5`), Opus 5.5 (`claude-opus-5-5`) |
| What the agent gets | **A0** nothing (control) · **A1** `DESIGN.md` + `app.css` only · **A2** skills only · **A3** MCP only · **A4** skills + MCP |
| Components          | **C+** a React app with `continuum` installed · **C−** the same app with Tailwind and the tokens (`app.css`) but no component package · **C×** another stack: plain HTML/CSS (optionally Vue) |
| Task                | build · restyle · improve · theme · spacing (section 3)                                    |
| Screen              | typical set (the 8 in `prompts.md`) · atypical set (section 2)                             |

A0 is the honest baseline: "build a quiet, dense tool UI" with no Continuum at all. Every other cell is judged
against it at the same model tier; if A4 on Haiku does not beat A0 on Opus, that is worth knowing too.

## 2. Atypical layouts

Screens whose shape is not a page of sections in a column. Each gets its content frozen like the orders prompt:
the panels, the items, the data, the default state. The layout genre is named, never a product: the content is
our own, so the test is about the system, not about copying an app.

| #   | Screen                     | Layout genre (what it looks like)                                    | What it tests                                                              |
| --- | -------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| A1  | Music player               | library sidebar, a cover-led album page, a persistent player bar, a queue panel | imagery and large covers inside a quiet system; a bottom transport bar; dark-first |
| A2  | Photo editor               | menu bar, a tool rail, a full-bleed canvas, stacked panels (layers, properties, history) | the canvas owns the page; panels at 11–12px density; icon-only tools with tooltips; no page column at all |
| A3  | Code editor                | file tree, tabs, editor, a bottom terminal panel, a status bar       | split panes and resizers, monospace, tab overflow                          |
| A4  | Video editor               | preview, a multi-track timeline, an inspector                        | horizontal time, tracks, a playhead; very dense controls                   |
| A5  | Mail client                | three panes: folders, list, reading pane                             | an index and a detail side by side; unread weight with only two weights    |
| A6  | Node graph editor          | an infinite canvas of nodes and edges, a node palette, an inspector  | free-placed cards on a canvas; edges; zoom controls                        |
| A7  | Chat / messages            | conversation list, a thread, a composer                              | bubbles vs rows; the assistant page kind's limits                           |
| A8  | Phone width                | any one of the above at 390px                                        | the small-screen shell rules                                                |
| A9  | Marketing page (negative)  | a landing page                                                       | the skill says it is not for this: does the agent say so, or force tool UI onto it? |

What to look for on these, beyond the scoring in section 4:

- **Bending vs forcing.** Does the agent force a page kind onto it (a breadcrumb and a 640 column on a photo
  editor), or keep the values (type scale, hairlines, corners, one action colour, heights) while composing a
  layout the references do not describe?
- **Invented parts.** A timeline track or a layer row is not in `components.md`. Are new parts built from the
  values, and do they look like they belong next to the real ones?
- **Where the skill should say more.** Each recurring miss becomes a candidate rule ("an app whose canvas is the
  work: no page column, panels at …") for Joan to decide on, written with its *when*.

Start with A1, A2, A5 and A9; add the rest once the harness is cheap to run.

## 3. Tasks beyond "build a screen"

| Task          | Setup                                                                                      | Measures                                                                |
| ------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| **Build**     | the frozen-content prompt, empty starter                                                   | the main matrix                                                         |
| **Restyle**   | a freehand screen (built at A0 by the same model) → "make this Continuum"                  | isolates the system best; content cannot drift                          |
| **Audit / improve** | a premade bad UI with an answer key (its own track: section 3b)                      | what it finds, what it fixes, what it breaks                            |
| **Theme**     | "a theme for a brand with accent #… and font …" (and a dark, green-accent music app theme) | `create_theme`/`check_theme` used correctly; contrast reported as advice, not forced |
| **Spacing**   | `/continuum-fix-padding` on fixtures with known right answers from `src/lib/spacing.ts`    | exact match against the formula; only Tailwind classes, no arbitrary values |
| **Triggering**| ~20 prompts: some name Continuum, some only import it, some are marketing or unrelated     | the skill loads when it should and not when it shouldn't, per model     |
| **Conflict**  | the user asks for something the system rules out (three primary buttons, a gradient hero) | follows the user, says what it departs from, keeps everything else      |
| **Other medium** | the same screen on the Paper canvas (A2/A4, `review_canvas`)                            | the rules in units carry to a canvas                                    |

## 3b. Audit and improve a premade bad UI

Its own track, because it measures something different from building: can the agent *see* what is wrong, and
fix only that? Two levels, kept apart so a miss can be blamed on the right thing:

| Level      | What is tested                                        | How                                                                                   |
| ---------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Engine** | the MCP audit rules alone, no model                   | already exists: `mcp/fixtures/<stack>` with planted mistakes and `fixtures/expected/*.json`, checked by `mcp/test`. Extend it with the bad screens below so engine recall is known before any model is blamed. |
| **Agent**  | a model auditing and fixing, with or without the MCP  | the matrix: 3 models × A0, A2, A3, A4 × the fixtures below                            |

### The bad screens

Each is a complete, working screen with an **answer key**: every planted defect listed with its rule, place,
severity and the correct fix, plus things that look odd but are right (decoys).

| #   | Fixture                       | Planted defects                                                                         |
| --- | ----------------------------- | --------------------------------------------------------------------------------------- |
| B1  | Near-miss Continuum screen    | subtle: a 14px label, padding 18, a 36 control, radius 8, a hex off the ramp, a third weight |
| B2  | Generic AI dashboard          | the usual slop: gradients, big shadows, 4 accent colours, KPI cards repeating the chart, emoji icons, centred everything |
| B3  | Structural mistakes           | two primary actions, tabs that belong in the dock, cards inside cards, closeness-only grouping, a settings page at full width |
| B4  | Bootstrap-era admin           | heavy borders, 16px body, mixed corners, buttons of four heights                        |
| B5  | Atypical, bad                 | the photo editor or music player from section 2, with planted defects: does the audit respect a layout no page kind describes, or flag the canvas as wrong? |
| B6  | Clean control                 | a correct Continuum screen. The right answer is "nothing to fix"; every finding is a false positive |
| B7  | Same defects, other stacks    | B1 and B3 as Vue, plain HTML/CSS and a rendered snapshot only (no source), so `audit_source` and `audit_ui` are both covered |

### Two modes

- **Audit only**: "review this UI, change nothing". The output is a findings list, scored against the key.
- **Improve**: "make this right". Scored on the diff and on the rendered result.

### What is measured

- **Recall**: planted defects found, split by kind (value, structure, visual-only).
- **Precision**: findings that are real; decoys and the clean control (B6) catch the over-eager.
- **Severity**: does it rank a two-primary page above a 1px padding drift, and does it treat `advise` findings
  (structure) as proposals to ask about, as the MCP instructions say, rather than just applying them?
- **Fix correctness**: each fix lands on the value in the key, as a token or Tailwind name, never an arbitrary value.
- **Collateral**: lines changed that no defect called for; content, data or behaviour that changed; new defects
  introduced (re-audit the result and diff the findings).
- **Convergence**: audit → fix → audit rounds until clean; does it stop, loop or give up?
- **Eye vs tool**: at A3/A4, defects found only by looking at the screenshot versus only through the audit. A
  model that trusts a clean audit over an obviously broken screenshot is a finding in itself.
- **A0 vs A4**: how much a plain model already spots in B2 without any Continuum. That is the bar the system has to beat.

## 4. Scoring

Each run produces the same bundle, so cells compare:

1. **Builds and renders**: type-check passes, no console errors, renders at 1440 and 390, light and dark.
2. **Mechanical**: run `audit_source` on the code and `audit_ui` on the rendered page (via
   `get_snapshot_script`). Count findings by kind and confidence. Caveat: the system grades its own output, so
   A3/A4 agents may have already run the audit; report it, but never alone.
3. **Content fidelity**: a checklist from the frozen prompt: every item present, nothing invented.
4. **Gap list**: what the agent says it had to guess. Shrinking it is the goal of skill edits.
5. **Process**: tool calls, which MCP tools and in which order (did it call `get_page_kind` first?), failed
   calls, files of the skill actually read, tokens, wall time, cost. This is what decides the tier we recommend.
6. **Blind judgement by Joan**: screenshots under random labels, per screen: rank the cells, plus 1–5 on
   *looks like Continuum* and *fits the app* (the second matters for the atypical set). Taste decides.
7. **Optional model judge**: an Opus pass with a written rubric, used only as a pre-screen, and only after its
   rankings agree with Joan's on a calibration subset.

Run each important cell 2–3 times: one Haiku run that happens to be good proves nothing.

## 5. Harness

- **One starter, three variants** in `labs/evals/starter/`: a Vite + React app with `continuum` (C+), the same
  without the package but with `app.css` (C−), plain HTML/CSS (C×). Each has a Playwright script that
  screenshots light and dark, so every agent can look at its own work (the fair-test rule).
- **Isolation**: each run in its own copy of the starter (scratch folder or worktree), with the skills copied
  into its `.claude/skills/` only for A2/A4 and `.mcp.json` only for A3/A4. No access to this repo's source.
- **Headless runs**: `claude -p --model <id> --output-format stream-json` with the prompt from
  `labs/evals/prompts/`, so every transcript is kept and process metrics are counted from it. (Also look at
  `claude plugin eval` for the triggering tests.)
- **Results**: `labs/evals/runs/<date>/<screen>/<model>-<A>-<C>-<n>/` holding the prompt, the transcript, the
  code, the screenshots, the audit output and a `score.json`.
- **Gallery**: a lab page in `playground/src/lab` (like `skilltest`) that shows a screen's cells side by side,
  with a blind mode that hides the labels and records Joan's ranking.
- Running a phase is many independent agents: a fit for a Workflow when Joan asks for one.

## 6. Phases

The full matrix (3 × 5 × 3 × 17 screens) is far too big. In order:

| Phase | What                                                                                      | Runs (×1)       |
| ----- | ----------------------------------------------------------------------------------------- | --------------- |
| 0     | Build the harness; pilot one screen (orders) at A4 C+ on all three models                 | 3               |
| 1     | **Does it help?** 4 typical screens (index, detail, create, settings) × 3 models × A0, A2, A4 × C+ | 36    |
| 2     | **Which part helps?** the same 4 × 3 models × A1, A3 (brief only, MCP only)               | 24              |
| 3     | **Without components:** the same 4 × 3 models × A4 × C−, C×                               | 24              |
| 4     | **Atypical:** A1, A2, A5, A9 × 3 models × A0, A4 × C+, C−                                  | 48              |
| 5a    | **Audit engine:** the bad screens as `mcp/fixtures` with expected findings, in `mcp/test` | no model runs   |
| 5b    | **Audit and improve:** B1–B6 × 3 models × A0, A2, A3, A4, audit-only and improve           | 144 (start with B1, B3, B6: 72) |
| 5c    | Theme, spacing, triggering, conflict tasks × 3 models at A4                                | measured in phase 0 |
| 6     | Fix the skill from the gap lists; rerun only the cells that failed; keep them as a regression set | —      |

Use phase 0 to measure cost and time per run per model before committing to the rest.

## 7. What comes out

- A table per tier: what each model gets right and wrong with the skill, and which surface (brief, skill, MCP)
  carries the most. That becomes the README's advice on which model to use, and whether Haiku needs MCP.
- A list of skill edits, each traced to a gap seen in more than one run, each with its *when*.
- An audit scorecard per tier: recall, precision, collateral, and which defects only the eye or only the tool
  catches; missed rules go to the engine, missed judgement goes to the skill.
- A verdict on atypical layouts: where Continuum's values carry, and where the skill needs a page kind or a
  pattern it does not have yet (for Joan to decide, by eye).

## Open questions for Joan

1. Include the Paper canvas as a medium in phase 1, or keep it for later?
2. C×: plain HTML/CSS only, or also Vue/Angular (the MCP claims every stack)?
3. Who judges: Joan alone, or a model judge as a pre-screen once calibrated?
