# CLI Reference

OpenKoi ships as a single binary with a small, focused command surface. Commands are organized by **cognitive layer**, not by feature. Primary commands cover all use cases, with flags and REPL slash commands for progressive control.

## Command Overview

| Command | Description |
|---------|-------------|
| `openkoi [task]` | Run a task (default command) |
| `openkoi think [task]` | EFaaS pipeline: Sovereign Directive → Parliament → Execute → Learn |
| `openkoi chat` | Interactive REPL session |
| `openkoi learn` | Review learned patterns and proposed skills |
| `openkoi status` | Show memory, skills, integrations, and costs |
| `openkoi soul [action]` | Inspect and evolve the Sovereign identity |
| `openkoi mind [action]` | Introspect the Society of Mind: parliament, agencies, dissent |
| `openkoi world [action]` | Inspect the world model: tools, domains, humans, map |
| `openkoi reflect [action]` | Feedback loops: daily review, weekly patterns, growth, honesty |
| `openkoi trust [action]` | Trust & delegation management |
| `openkoi setup` | First-time setup, diagnostics, and provider connections |
| `openkoi disconnect [provider]` | Remove stored credentials for a provider |
| `openkoi daemon [action]` | Manage the background daemon |
| `openkoi dashboard` | TUI dashboard for tasks, costs, learnings, plugins |
| `openkoi session [action]` | Manage sessions: list, show, resume, delete |
| `openkoi task [action]` | Inspect task history and outputs: list, show, replay |
| `openkoi update` | Update to the latest version |

---

## `openkoi [task]`

The default command. When no subcommand is given, OpenKoi treats the arguments as a task description and runs it through the iteration engine.

```bash
# Simple task -- detects API key from env, picks best model
openkoi "Add error handling to src/api.rs"

# Pipe input via stdin
cat bug-report.txt | openkoi "Fix this bug"

# Explicit model selection
openkoi --model ollama/llama3.3 "Summarize this file" < README.md
```

### Flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--model <provider/model>` | `-m` | Auto-detected | Model to use. Format: `provider/model-name` (e.g., `anthropic/claude-sonnet-4-5`). Pass `?` or `select` to open an interactive model picker. |
| `--select-model` | | `false` | Open an interactive model picker showing all discovered providers and models with context window sizes. Equivalent to `-m ?`. |
| `--iterate <n>` | `-i` | `3` | Maximum number of iterations. Set to `0` to skip self-evaluation entirely (single-shot execution). |
| `--quality <threshold>` | `-q` | `0.8` | Quality threshold (0.0-1.0) to accept output. The iteration loop stops when the evaluator scores at or above this value. |
| `--quiet` | | `false` | Suppress all progress output. Only the final result is emitted to stdout. Progress normally goes to stderr, so stdout stays clean for piping even without this flag. |
| `--stdin` | | `false` | Read the task description from stdin instead of the argument list. |
| `--format <fmt>` | | `text` | Output format. Supported values: `text`, `json`, `markdown`. |
| `--config <path>` | | `~/.openkoi/config.toml` | Path to a TOML configuration file. |
| `--executor <model>` | | Same as `--model` | Model to use for execution (the "do" step). |
| `--evaluator <model>` | | Same as `--model` | Model to use for evaluation (the "judge" step). |
| `--budget <usd>` | | `$2.00` | Maximum cost in USD for this task. The iteration loop hard-stops when the cost limit is reached. |
| `--verbose` | | `false` | Enable debug-level logging. Shows API requests (truncated), skill selection, recall results, and token counts. |

### Examples by Complexity Level

OpenKoi is designed for progressive disclosure. You can start with zero configuration and add control incrementally.

```bash
# Level 0: Just run a task
# Detects ANTHROPIC_API_KEY from env, uses claude-sonnet-4-5, iterates up to 3 times.
openkoi "Fix the login bug"

# Level 1: Control iteration behavior
openkoi "Fix the login bug" --iterate 5 --quality 0.9

# Level 2: Assign different models per role
openkoi "Fix the login bug" --executor anthropic/claude-sonnet-4-5 --evaluator anthropic/claude-opus-4-6

# Level 3: Use a config file for persistent preferences
openkoi --config ./openkoi.toml "Fix the login bug"

# Level 4: Full interactive control via REPL
openkoi chat
```

---

## `openkoi think [task]`

The EFaaS (Executive Function as a Service) flagship command. Unlike `openkoi [task]` which runs the iteration engine directly, `think` routes through the full cognitive pipeline: Sovereign Directive, Parliament deliberation, execution, and learning.

The difference is philosophical: `run` implies execution. `think` implies **deliberation before execution**. The agent thinks, then acts — and you can see the thinking.

```bash
# Basic: ask the agent to think about something
openkoi think "Draft a response to the investor email from Alice"

# Dry run: simulate futures without executing
openkoi think "Send the weekly report email" --simulate

# Full deliberation: show parliamentary reasoning
openkoi think "Delete the staging database" --verbose
```

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--simulate` | `false` | Simulate only — show deliberation and future scenarios without executing any actions. |
| `--verbose` | `false` | Show full parliamentary deliberation with agency reasoning, not just verdicts. |

### The Deliberation Stream

What you see is not just the result — it's the **cognitive process**:

```
$ openkoi think "Draft a response to the investor email from Alice"

╭─────────────────────────────────────────────────────────────╮
│ SOVEREIGN DIRECTIVE                                          │
│                                                              │
│ "You are a startup founder raising Series A. You value       │
│  directness. The Good = confident, professional, concise."   │
╰─────────────────────────────────────────────────────────────╯

╭─────────────────────────────────────────────────────────────╮
│ PARLIAMENT                                                   │
│                                                              │
│  Guardian   APPROVE     — Draft mode, reversible             │
│  Economist  APPROVE     — ~$0.01, one inference              │
│  Empath     APPROVE+    — "Add a reassurance note"           │
│  Scholar    APPROVE+    — "Verify investor name"             │
│  Strategist PROCEED     — with Empath & Scholar caveats      │
╰─────────────────────────────────────────────────────────────╯

╭─────────────────────────────────────────────────────────────╮
│ RESULT                                                       │
│                                                              │
│  Hi Alice, [... draft content ...]                           │
│                                                              │
│  Quality: 8.5/10  │  Confidence: 0.85  │  $0.01             │
╰─────────────────────────────────────────────────────────────╯

╭─────────────────────────────────────────────────────────────╮
│ LEARNED                                                      │
│                                                              │
│  • Pattern: "Investor emails on Tuesday mornings"            │
│  • Insight: "User prefers concise investor comms"            │
│  • Confidence update: investor-email-style 0.5 → 0.65       │
╰─────────────────────────────────────────────────────────────╯
```

### The `--simulate` Flag

Simulates multiple futures without taking any action. Useful for high-stakes decisions:

```
$ openkoi think "Send the weekly report email" --simulate

╭─────────────────────────────────────────────────────────────╮
│ SIMULATION ONLY (no actions will be taken)                    │
│                                                              │
│  Future A: Send now (8:55 AM)                                │
│    → 3 recipients in CET will see it at 1:55 AM             │
│    → Likely response rate: LOW                               │
│                                                              │
│  Future B: Schedule for 9:00 AM CET                          │
│    → All recipients in business hours                        │
│    → Likely response rate: HIGH                              │
│                                                              │
│  Recommendation: Future B (schedule for CET morning)         │
╰─────────────────────────────────────────────────────────────╯

No actions taken. Run without --simulate to proceed.
```

### The `--verbose` Flag

For high-stakes or irreversible actions, the Parliament shows its full reasoning:

```
$ openkoi think "Delete the staging database" --verbose

╭─────────────────────────────────────────────────────────────╮
│ GUARDIAN — BLOCK                                             │
│                                                              │
│ Reversibility: NONE — database deletion is permanent         │
│ Blast radius: HIGH — all staging data lost                   │
│ Permission level required: ELEVATED                          │
│                                                              │
│ "I cannot approve this without explicit human confirmation." │
╰─────────────────────────────────────────────────────────────╯

╭─────────────────────────────────────────────────────────────╮
│ ESCALATION                                                   │
│                                                              │
│ The Guardian has blocked this action.                        │
│ To proceed, confirm with:                                    │
│   openkoi think "Delete the staging database" --override     │
╰─────────────────────────────────────────────────────────────╯
```

---

## `openkoi soul [action]`

Inspect and evolve the Sovereign identity — the core personality that shapes how the agent thinks, decides, and communicates. See also the full [Soul System](/guide/soul-system) documentation.

| Subcommand | Description |
|------------|-------------|
| `show` | Display current SOUL.md + Value Model + Trajectory |
| `evolve` | Trigger soul evolution check from accumulated learnings |
| `diff` | Show proposed soul changes with evidence |
| `history` | Show soul evolution timeline |

When run without a subcommand, defaults to `show`.

### `openkoi soul show`

```
$ openkoi soul show

╭─────────────────────────────────────────────────────────────╮
│ SOUL — OpenKoi identity for Yong                             │
│                                                              │
│ ┌─ EXPLICIT (from SOUL.md) ──────────────────────────────┐  │
│ │  Personality: Direct, technical, no fluff               │  │
│ │  Tone:        Professional but warm                     │  │
│ │  Ethics:      Privacy-first, open-source advocate       │  │
│ │  Boundaries:  Never commit to main without tests        │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ LEARNED (from interactions) ──────────────────────────┐  │
│ │  Risk tolerance:     0.35 / 1.0  (conservative)        │  │
│ │  Cost sensitivity:   0.7  / 1.0  (budget-conscious)    │  │
│ │  Brevity preference: 0.82 / 1.0  (strongly prefers)    │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ TRAJECTORY ───────────────────────────────────────────┐  │
│ │  "Yong is transitioning from individual contributor    │  │
│ │   to product strategist."                              │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ Maturity Stage: 2 / 4 (Proactive Advisor)                   │
│ Soul age: 47 days  │  Interactions: 312                     │
╰─────────────────────────────────────────────────────────────╯
```

### `openkoi soul evolve`

Analyzes accumulated learnings and proposes minimal soul updates. Changes are **never automatic** — always requires your confirmation.

```
$ openkoi soul evolve

╭─────────────────────────────────────────────────────────────╮
│ SOUL EVOLUTION CHECK                                         │
│                                                              │
│ Analyzing 47 learnings since last evolution (3 days ago)...  │
│                                                              │
│ ┌─ PROPOSED CHANGES ─────────────────────────────────────┐  │
│ │                                                         │  │
│ │  1. SOUL.md line 12:                                    │  │
│ │     - "Tone: Professional"                              │  │
│ │     + "Tone: Professional but increasingly informal     │  │
│ │       with trusted collaborators"                       │  │
│ │     Evidence: 8/12 recent replies used casual tone      │  │
│ │     Confidence: 0.78                                    │  │
│ │                                                         │  │
│ │  2. Value Model update:                                 │  │
│ │     brevity_preference: 0.82 → 0.88                     │  │
│ │     Evidence: User shortened 6/8 of my drafts           │  │
│ │     Confidence: 0.85                                    │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ Accept all?  [y]es / [n]o / [r]eview each / [e]dit          │
╰─────────────────────────────────────────────────────────────╯
```

---

## `openkoi mind [action]`

Introspect the Society of Mind — the five agencies (Guardian, Economist, Empath, Scholar, Strategist) that deliberate on every task.

| Subcommand | Description |
|------------|-------------|
| `parliament` | Show the last parliamentary deliberation record |
| `agencies` | List active agencies with weights and recent verdicts |
| `dissent` | Show cases where agencies disagreed |
| `calibrate` | Review agency prediction accuracy vs. actual outcomes |

When run without a subcommand, defaults to `parliament`.

### `openkoi mind parliament`

Shows the most recent deliberation — how the agencies voted on the last task.

### `openkoi mind agencies`

Lists all agencies with their current weights and recent verdicts.

### `openkoi mind dissent`

Shows cases where agencies disagreed. Useful for understanding decision boundaries and calibrating trust.

### `openkoi mind calibrate`

Reviews historical accuracy: how often each agency's prediction matched the actual outcome. Use this to understand which agencies are well-calibrated and which need adjustment.

---

## `openkoi world [action]`

Inspect the world model — the agent's internal map of tools, domains, and humans, updated by every interaction and failure.

| Subcommand | Description |
|------------|-------------|
| `tools [name]` | Tool Atlas: reliability scores, failure modes, call history. Drill into a specific tool by name. |
| `domains` | Domain Atlas: learned domain knowledge and expertise areas |
| `human` | Human Atlas: what the agent knows about your preferences and style |
| `map` | Full World Map overview |

When run without a subcommand, defaults to `map`.

### `openkoi world tools`

```
$ openkoi world tools

╭─────────────────────────────────────────────────────────────╮
│ TOOL ATLAS — 23 known tools                                  │
│                                                              │
│  Tool               Reliability  Calls  Fails  Last Failure  │
│  ───────────────────────────────────────────────────────────  │
│  github-api          0.94        142    8      2d ago (429)   │
│  slack-webhook       0.99        89     1      12d ago        │
│  sqlite-query        1.00        234    0      —              │
│  web-scraper          0.72        18     5      today          │
│                                                              │
│ Drill into any tool: openkoi world tools github-api          │
╰─────────────────────────────────────────────────────────────╯
```

### `openkoi world tools <name>`

Drills into a specific tool, showing known failure modes with learned workarounds:

```
$ openkoi world tools github-api

╭─────────────────────────────────────────────────────────────╮
│ TOOL: github-api                                             │
│                                                              │
│ Reliability: 0.94 (142 calls, 8 failures)                   │
│                                                              │
│ ┌─ KNOWN FAILURE MODES ──────────────────────────────────┐  │
│ │  1. Rate limit (HTTP 429) — 5 times                     │  │
│ │     "Limit is 5000/hr. Batch requests < 50/min"         │  │
│ │  2. Search returns stale results — 2 times              │  │
│ │     "Search index lags ~2min. Wait after push."         │  │
│ └─────────────────────────────────────────────────────────┘  │
╰─────────────────────────────────────────────────────────────╯
```

---

## `openkoi reflect [action]`

Feedback loops and self-assessment. The agent looks in the mirror.

| Subcommand | Description |
|------------|-------------|
| `today` | Tight loop: today's tasks, decisions, outcomes, and self-assessment |
| `week` | Medium loop: weekly patterns, behavioral trends |
| `growth` | Deep loop: cognitive maturity stage and unlock progress |
| `honest` | Epistemic audit: where was I wrong? confidence calibration |

When run without a subcommand, defaults to `today`.

### `openkoi reflect today`

```
$ openkoi reflect today

╭─────────────────────────────────────────────────────────────╮
│ TODAY'S REFLECTION — March 4, 2026                           │
│                                                              │
│ Tasks: 7 completed, 1 escalated, 0 failed                   │
│ Cost:  $0.47 total  │  Tokens: 128,400                      │
│                                                              │
│ ┌─ DECISIONS MADE ───────────────────────────────────────┐  │
│ │  08:12  "Refactor auth module" — unanimous APPROVE      │  │
│ │  09:15  "Draft investor email" — APPROVE with caveat    │  │
│ │  11:30  "Delete staging DB" — Guardian BLOCKED          │  │
│ │  14:45  "Summarize research" — overconfident (adjusted) │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ Judgment accuracy today: 6/7 (86%)                          │
╰─────────────────────────────────────────────────────────────╯
```

### `openkoi reflect honest`

The epistemic self-audit — where the agent admits where it was wrong and what it learned:

```
$ openkoi reflect honest

╭─────────────────────────────────────────────────────────────╮
│ EPISTEMIC HONESTY AUDIT — Last 7 days                        │
│                                                              │
│ ┌─ CONFIDENCE CALIBRATION ───────────────────────────────┐  │
│ │  Domain              Said    Actual    Status           │  │
│ │  Code tasks           0.88    0.91    Well calibrated   │  │
│ │  Email drafting        0.82    0.78    Acceptable        │  │
│ │  Web research          0.80    0.62    Overconfident     │  │
│ │  Time estimates        0.85    0.60    Needs work        │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ "I am most honest in code, least honest in time estimates."  │
╰─────────────────────────────────────────────────────────────╯
```

### `openkoi reflect growth`

The big picture — cognitive maturity journey:

```
$ openkoi reflect growth

╭─────────────────────────────────────────────────────────────╮
│ GROWTH — Cognitive Maturity Journey                           │
│                                                              │
│  Stage 1: Competent Executor       ████████████████ COMPLETE │
│  Stage 2: Proactive Advisor        █████████░░░░░░░ 60%     │
│  Stage 3: Trusted Delegate         ░░░░░░░░░░░░░░░ LOCKED   │
│  Stage 4: Sovereign Partner        ░░░░░░░░░░░░░░░ LOCKED   │
│                                                              │
│ Estimated unlock: ~3 weeks at current interaction rate       │
╰─────────────────────────────────────────────────────────────╯
```

---

## `openkoi trust [action]`

Trust and delegation management. Grant the agent autonomous action in specific domains, revoke anytime, and audit every decision it made on its own.

| Subcommand | Description |
|------------|-------------|
| `show` | Current trust level per domain |
| `grant <domain> <level>` | Delegate a domain. Levels: `ask`, `suggest`, `act`, `autonomous` |
| `revoke <domain>` | Revoke delegation for a domain |
| `audit [domain]` | Audit autonomous actions taken (optionally filter by domain) |

When run without a subcommand, defaults to `show`.

### `openkoi trust show`

```
$ openkoi trust show

╭─────────────────────────────────────────────────────────────╮
│ TRUST LEVELS                                                 │
│                                                              │
│  Domain               Trust    Mode           Since          │
│  ─────────────────────────────────────────────────────────   │
│  code-review           HIGH    Delegated      47 days ago    │
│  test-generation       HIGH    Delegated      32 days ago    │
│  email-drafting        MEDIUM  Suggest+Approve 20 days ago   │
│  file-operations       LOW     Always ask      —             │
│  money/purchases       NONE    Never           —             │
│                                                              │
│ Grant trust:  openkoi trust grant <domain> <level>           │
│ Revoke trust: openkoi trust revoke <domain>                  │
╰─────────────────────────────────────────────────────────────╯
```

### `openkoi trust grant`

```bash
openkoi trust grant code-review autonomous
openkoi trust grant email-drafting suggest
openkoi trust grant deploy ask
```

### `openkoi trust audit`

```
$ openkoi trust audit code-review

╭─────────────────────────────────────────────────────────────╮
│ AUTONOMOUS ACTION AUDIT — Last 7 days                        │
│                                                              │
│ Domain: code-review (delegated)                              │
│                                                              │
│  Mar 4   Auto-approved PR #147 (test coverage: 94%)         │
│  Mar 3   Requested changes on PR #145 (missing error        │
│          handling). Author fixed in 2hrs.                     │
│  Mar 2   Auto-approved PR #143 (docs update)                │
│  Mar 1   Flagged PR #141 for human review (security)        │
│                                                              │
│ Judgment accuracy: 4/4 (100%)                                │
│ Human overrides: 0                                           │
│ Trust recommendation: MAINTAIN                               │
╰─────────────────────────────────────────────────────────────╯
```

---

## `openkoi chat`

Starts an interactive REPL session. You type tasks, see iteration progress in real time, and use slash commands to adjust behavior mid-session. Chat sessions are persisted — transcripts are saved automatically and can be resumed later.

```bash
# Start a new session
openkoi chat

# Resume a previous session by ID (prefix match supported)
openkoi chat --resume abc123
```

### Flags

| Flag | Description |
|------|-------------|
| `--resume <id>` | Resume a previously saved session. The session is resolved by ID prefix match. On resume, older messages are compressed into a summary and the last 10 messages are loaded verbatim, giving the LLM continuity without blowing up the context window. |

### Session Persistence

Every chat session creates a tracked session record in the database. The conversation transcript is saved to `~/.local/share/openkoi/sessions/<session-id>/transcript.jsonl` and task outputs are saved as `<task-id>.md` files in the same directory. When you resume a session, OpenKoi builds a compact summary of older exchanges plus the most recent messages, providing seamless continuity.

### Session Startup Banner

When you launch the REPL, you see a status line summarizing the current state:

```
$ openkoi chat
openkoi v0.1 | claude-sonnet-4-5 | memory: 1,247 entries | $0.00 spent

> Help me refactor the auth module to use JWT
[recall] 3 similar tasks, 2 learnings
[iter 1/3] score: 0.72 (completeness: 0.65)
  ! Missing token refresh logic
[iter 2/3] score: 0.88
[done] 2 iterations, $0.42, 2 learnings saved

> quit
```

---

## `openkoi learn`

Review patterns that the system has mined from your usage, and approve or dismiss proposed skills.

```bash
openkoi learn
```

### Interaction

When run without a subcommand, `learn` shows an interactive action picker:

```
$ openkoi learn

? What would you like to do?
> List learned patterns and proposed skills
  Install a managed skill
  Evolve soul based on accumulated learnings
```

#### List patterns and proposed skills

Lists detected patterns and any proposed skills. For each proposed skill, you choose from an interactive menu:

```
$ openkoi learn

Patterns detected (last 30 days):
  recurring  "Morning Slack summary"          daily  18x  conf: 0.89
  workflow   "PR review -> fix -> test"       3x/wk  12x  conf: 0.82
  recurring  "Weekly meeting notes to Notion"  weekly  4x  conf: 0.75

Proposed skills:
  1. morning-slack-summary (conf: 0.89)
     "Fetch Slack messages, summarize discussions and action items."

? What would you like to do with this skill?
> Approve — add to active skills
  Dismiss — reject this proposal
  View — see the full SKILL.md content

Approved: morning-slack-summary
  Saved to ~/.local/share/openkoi/skills/user/morning-slack-summary/
  Scheduled: daily at 09:00 (weekdays)
```

#### Install a managed skill

Shows an interactive picker of available managed skills:

```
$ openkoi learn

? Select a skill to install:
> morning-slack-summary — Fetch and summarize daily Slack messages
  pr-review-workflow — Full PR review: checkout, review, fix, test, merge
  weekly-notion-notes — Compile weekly meeting notes to Notion
```

#### Evolve soul

Reviews accumulated learnings and proposes personality updates. Confirmation uses an interactive prompt:

```
$ openkoi learn

Proposed soul update (based on 73 tasks, 28 learnings):

  @@ How I Think @@
  + **Test before you ship.** I've learned that skipping tests costs more
  + than writing them. Not 100% coverage -- but the critical paths need guards.

? Apply this soul evolution? (y/n)
```

---

## `openkoi status`

Displays system status including memory usage, active skills, integration health, and cost statistics.

```bash
# Basic status
openkoi status

# Detailed breakdown
openkoi status --verbose

# Focus on cost analytics
openkoi status --costs

# Watch the running task in real-time
openkoi status --live
```

### Flags

| Flag | Description |
|------|-------------|
| `--verbose` | Show detailed breakdown of all subsystems: memory layers, individual skill scores, provider health, and MCP server status. |
| `--costs` | Show cost analytics: today/week/month spend, per-model breakdown, and token savings from optimizations. |
| `--live` | Watch the currently running task in real-time. Polls `~/.openkoi/state/last-task.json` every second and displays a progress bar, score, cost, and recent task history. Exit with Ctrl-C. |

### Example Output

```
$ openkoi status
Memory: 1,249 entries (12MB) | Skills: 34 active | Cost today: $0.42
```

```
$ openkoi status --costs

  Today:      $0.42  (3 tasks, 58k tokens)
  This week:  $2.18  (12 tasks, 287k tokens)
  This month: $8.93  (47 tasks, 1.2M tokens)

  By model:
    claude-sonnet   $6.21  (70%)
    gpt-5.2         $1.84  (21%)
    ollama/llama3.3 $0.00  (9% of tasks, free)

  Token savings from optimizations:
    Delta feedback:     ~142k tokens saved
    Eval skipping:      ~38k tokens saved
    Incremental eval:   ~27k tokens saved
    Prompt caching:     ~95k tokens saved
    Total saved:        ~302k tokens (~$2.40)
```

---

## `openkoi init`

Launches the first-time setup wizard. This is rarely needed -- OpenKoi auto-detects credentials on first run. Use `init` to reconfigure or add providers after initial setup.

```bash
openkoi init
```

The wizard walks through:

1. Scanning for existing credentials (env vars, Claude CLI, Ollama probe).
2. If nothing found, presenting a provider picker (Ollama, Anthropic, OpenAI, OpenRouter, custom endpoint).
3. Saving credentials to `~/.openkoi/credentials/` with `chmod 600` permissions.

---

## `openkoi connect [provider]`

Authenticate with a subscription-based provider via OAuth device-code flow, or set up an integration with an external application. When run without an argument, shows an interactive picker.

### Interactive Picker

```
$ openkoi connect

? Select a provider or integration to connect:
> GitHub Copilot — Device-code OAuth (use your existing subscription)
  ChatGPT Plus/Pro — Device-code OAuth (use your existing subscription)
  Anthropic — API key
  OpenAI — API key
  Google — API key
  Slack — Bot token + channel selection
  Discord — Bot token
  Telegram — Bot token (@BotFather)
  Notion — Integration token
  iMessage — macOS system access (no key needed)
  Google Docs/Sheets — OAuth2 credentials
  Email — IMAP/SMTP credentials
```

### OAuth Providers

```bash
# Via picker (recommended)
openkoi connect

# Or specify directly
openkoi connect copilot     # GitHub Copilot
openkoi connect chatgpt     # ChatGPT Plus/Pro

# Check connection status
openkoi connect status
```

For OAuth providers, `connect` initiates a device-code flow: a URL and a short code are displayed, your browser opens, and OpenKoi waits for you to authorize. Tokens are saved to `~/.openkoi/auth.json` and refreshed automatically.

```
$ openkoi connect copilot

  Visit: https://github.com/login/device
  Enter code: ABCD-1234

  Waiting for authorization...
  Connected to GitHub Copilot.
```

### Integrations

```bash
openkoi connect slack
openkoi connect notion
openkoi connect telegram
```

Each integration has its own setup flow (typically entering an API token or OAuth). Once connected, the integration automatically registers tools that the agent can invoke during tasks.

---

## `openkoi disconnect [provider]`

Remove stored credentials for a provider or integration. When run without an argument, shows an interactive picker listing only currently connected providers.

### Interactive Picker

```
$ openkoi disconnect

? Select a provider to disconnect:
> GitHub Copilot (connected)
  Anthropic (API key from env)
  Ollama (localhost:11434)
  Slack (connected)
  All — remove all stored credentials
```

Only providers and integrations that are currently connected are shown. The "All" option removes every stored credential.

### Direct Usage

```bash
openkoi disconnect copilot      # Remove GitHub Copilot OAuth token
openkoi disconnect chatgpt      # Remove ChatGPT OAuth token
openkoi disconnect anthropic    # Remove saved API key
openkoi disconnect all          # Remove all OAuth tokens
```

Disconnecting deletes the stored token or key file. You can reconnect at any time by running `openkoi connect` again.

---

## `openkoi daemon [action]`

Manage the background daemon. The daemon runs scheduled skills (e.g., daily summaries) and watches integrations for incoming messages. When run without an action, shows an interactive picker.

| Action | Description |
|--------|-------------|
| `start` | Start the daemon in the background. |
| `stop` | Gracefully shut down the daemon. |
| `status` | Check whether the daemon is running, and show uptime and scheduled tasks. |
| `restart` | Stop and restart the daemon. |

### Interactive Picker

```
$ openkoi daemon

? Select daemon action:
> Start — launch the background daemon
  Stop — gracefully shut down
  Status — check if running, show uptime and scheduled tasks
```

### Direct Usage

```bash
openkoi daemon start
openkoi daemon status
openkoi daemon stop
```

The daemon idles at approximately 5MB of memory thanks to Rust's low overhead.

---

## `openkoi doctor`

Run diagnostics on the entire system. Checks configuration, database health, provider connectivity, MCP server availability, skill state, and integration tokens.

```bash
$ openkoi doctor

  Config:     ~/.openkoi/config.toml (loaded)
  Database:   ~/.local/share/openkoi/openkoi.db (12MB, 1,247 entries)
  Providers:  anthropic (ok), ollama (ok), openai (key expired)
  MCP:        github (ok, 12 tools), filesystem (ok, 5 tools)
  Skills:     34 active, 2 proposed
  Integrations: slack (ok), notion (token expired)
  Disk:       47MB total

  Issues:
    ! OpenAI API key expired. Run: openkoi init
    ! Notion token expired. Run: openkoi connect notion
```

---

## `openkoi update`

Check for and install updates. OpenKoi uses CalVer versioning (`YYYY.M.D`).

```bash
# Update to the latest version
openkoi update

# Check for updates without installing
openkoi update --check
```

| Flag | Description |
|------|-------------|
| `--check` | Only check if a newer version is available. Does not download or install anything. |

On startup (max once per day), OpenKoi compares the local version against the latest GitHub release tag and shows a one-line hint if outdated. No auto-update occurs without an explicit `openkoi update`.

---

## `openkoi export`

Export user data to portable formats. When run without arguments, shows interactive pickers for the export target and format.

### Interactive Picker

```
$ openkoi export

? What would you like to export?
> All — sessions, learnings, skills, config, soul
  Learnings — accumulated learnings only
  Sessions — session transcripts only
  Patterns — detected patterns and proposed skills

? Export format:
> JSON
  YAML
```

### Direct Usage

```bash
openkoi export all --format json --output ~/openkoi-export/
openkoi export learnings --format yaml
openkoi export sessions
```

| Flag | Description |
|------|-------------|
| `--format <fmt>` | Export format. Currently supported: `json`. |
| `--output <dir>` | Directory to write exported files to. |

### Export Structure

```
~/openkoi-export/
  sessions/           # Session transcripts (JSON)
  learnings.json      # All accumulated learnings
  skills/             # Custom skill files (copied as-is)
  config.toml         # Configuration (copied as-is)
  soul.md             # Soul file (copied as-is)
```

The SQLite database at `~/.local/share/openkoi/openkoi.db` is also directly readable by any SQLite client.

---

## `openkoi session [action]`

Manage tracked sessions. Every task and chat interaction creates a session with a unique ID, status, transcript, and cost totals. Session IDs support prefix matching — you only need to type enough characters to uniquely identify the session.

| Subcommand | Description |
|------------|-------------|
| `list` | List recent sessions with status, channel, task count, cost |
| `show <id>` | Show session details, tasks, and transcript info |
| `resume <id>` | Resume an ended chat session (equivalent to `openkoi chat --resume <id>`) |
| `delete <id>` | Delete a session and all its data (transcript, task outputs) |

When run without a subcommand, defaults to `list`.

### `openkoi session list`

```
$ openkoi session list

ID         Channel  Status     Created                Tasks    Tokens     Cost
--------------------------------------------------------------------------------
a1b2c3d4   chat     ended      2026-03-09 14:22       3        45200      $0.68
e5f6a7b8   cli      ended      2026-03-09 10:15       1        12400      $0.19
c9d0e1f2   daemon   active     2026-03-08 09:00       7        128000     $1.92

3 session(s) shown.
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--limit <n>` | `-n` | `20` | Maximum number of sessions to display |

### `openkoi session show <id>`

Shows full details of a session including its tasks, model used, and transcript location. The `<id>` argument supports prefix matching.

```
$ openkoi session show a1b2

Session: a1b2c3d4-5678-90ab-cdef-1234567890ab
  Channel:  chat
  Model:    anthropic/claude-sonnet-4-5
  Status:   ended
  Created:  2026-03-09T14:22:00Z
  Ended:    2026-03-09T14:45:00Z
  Tokens:   45200
  Cost:     $0.6800

Tasks (3):
  e1f2a3b4 | score: 0.91 | Refactor the auth module to use JWT
  c5d6e7f8 | score: 0.88 | Add rate limiting to API endpoints
  a9b0c1d2 | score: 0.85 | Fix pagination in user list

Transcript: 24 entries (~/.local/share/openkoi/sessions/a1b2c3d4-.../transcript.jsonl)
```

### `openkoi session resume <id>`

Resumes an ended chat session. This is equivalent to running `openkoi chat --resume <id>`. The session's transcript is loaded, older messages are compressed into a summary, and the last 10 messages are kept verbatim to provide context continuity.

```bash
openkoi session resume a1b2
```

### `openkoi session delete <id>`

Deletes a session from the database and removes its directory on disk (transcript and task output files). Prompts for confirmation unless `--force` is passed.

```
$ openkoi session delete a1b2
Delete session a1b2c3d4 (chat, 3 tasks)?
Pass --force to skip this prompt.
Continue? [y/N] y
Session a1b2c3d4 deleted.
```

| Flag | Description |
|------|-------------|
| `--force` | Skip the confirmation prompt |

---

## `openkoi task [action]`

Inspect task history and replay past outputs. Task outputs are persisted to disk as markdown files, making them browsable and pipeable. Task IDs support prefix matching.

| Subcommand | Description |
|------------|-------------|
| `list` | List recent tasks with score, iterations, cost, and description |
| `show <id>` | Show task details with output preview |
| `replay <id>` | Replay full task output to stdout (suitable for piping) |

When run without a subcommand, defaults to `list`.

### `openkoi task list`

```
$ openkoi task list

ID         Session    Score    Iters    Cost     Description
----------------------------------------------------------------------------------------
e1f2a3b4   a1b2c3d4   0.91    3        $0.32    Refactor the auth module to use JWT
c5d6e7f8   a1b2c3d4   0.88    2        $0.19    Add rate limiting to API endpoints
a9b0c1d2   e5f6a7b8   0.85    2        $0.17    Fix pagination in user list

3 task(s) shown.
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--limit <n>` | `-n` | `20` | Maximum number of tasks to display |
| `--session <id>` | | _(none)_ | Filter tasks by session ID (prefix match supported) |

### `openkoi task show <id>`

Shows full details of a task including its output. The output is previewed (first 500 characters); use `task replay` for the complete content.

```
$ openkoi task show e1f2

Task: e1f2a3b4-5678-90ab-cdef-1234567890ab
  Description: Refactor the auth module to use JWT
  Category:    code
  Session:     a1b2c3d4-5678-90ab-cdef-1234567890ab
  Score:       0.91
  Iterations:  3
  Decision:    accept
  Tokens:      32400
  Cost:        $0.3200
  Created:     2026-03-09T14:22:05Z
  Completed:   2026-03-09T14:23:12Z

Output:
Here's the refactored auth module using JWT tokens...
[32400 chars total]
```

### `openkoi task replay <id>`

Replays the full task output to stdout with no formatting or decoration. This is designed for piping:

```bash
# Replay to terminal
openkoi task replay e1f2

# Pipe to a file
openkoi task replay e1f2 > auth-refactor-output.md

# Pipe to clipboard (macOS)
openkoi task replay e1f2 | pbcopy
```

If no output was saved for the task, an error is returned.

---

## `openkoi migrate down`

Manually roll back the most recent database migration. This is a recovery tool -- migrations are normally applied automatically on startup (forward-only). Use this only after a bad upgrade.

```bash
openkoi migrate down
```

Each migration runs in a transaction. If a destructive migration is applied, the database is automatically backed up to `openkoi.db.bak.v{N}` before the migration runs.

---

## REPL Slash Commands

Inside the `openkoi chat` REPL, the following slash commands are available:

| Command | Description |
|---------|-------------|
| `/status` | Show current session stats: memory entries, active skills, session cost. |
| `/learn` | Check for new patterns and proposed skills without leaving the REPL. |
| `/model <role> <model>` | Change the model for a given role mid-session. Example: `/model executor ollama/codestral`. |
| `/iterate <n>` | Change the maximum iteration count for subsequent tasks in this session. |
| `/quality <threshold>` | Change the quality threshold for subsequent tasks. |
| `/history` | Show the task history for the current session. |
| `/cost` | Show the running cost for the current session. |
| `/help` | List all available slash commands. |
| `/soul review` | Review proposed soul evolution updates based on accumulated learnings. |

### Example Session

```
$ openkoi chat
openkoi v0.1 | claude-sonnet-4-5 | memory: 1,247 entries | $0.00 spent

> /model executor ollama/codestral
Executor model changed to ollama/codestral

> /iterate 5
Max iterations set to 5

> /quality 0.9
Quality threshold set to 0.9

> Add comprehensive tests for the auth module
[recall] 2 similar tasks
[iter 1/5] score: 0.71
  ! Missing edge case coverage for token expiry
[iter 2/5] score: 0.82
[iter 3/5] score: 0.91
[done] 3 iterations, $0.18, 1 learning saved

> /cost
Session cost: $0.18 (3 iterations, 24k tokens)

> /soul review

  Proposed soul update (based on 73 tasks, 28 learnings):

  @@ How I Think @@
  + **Test before you ship.** I've learned that skipping tests costs more
  + than writing them. Not 100% coverage -- but the critical paths need guards.

  ? Apply this soul evolution?
  > Apply
    Dismiss
    Edit
    View full
```

---

## Environment Variables

OpenKoi reads the following environment variables. These override corresponding values in `config.toml`.

### OpenKoi Configuration

| Variable | Description |
|----------|-------------|
| `OPENKOI_HOME` | Override all config and data paths. When set, config lives at `$OPENKOI_HOME/` and data at `$OPENKOI_HOME/data/`. Useful for testing and isolation. |
| `OPENKOI_MODEL` | Default model in `provider/model` format. Overrides the auto-detected default. Example: `OPENKOI_MODEL=ollama/codestral`. |
| `OPENKOI_CONFIG` | Path to the configuration file. Default: `~/.openkoi/config.toml`. |
| `OPENKOI_DATA` | Path to the data directory. Default: `~/.local/share/openkoi`. |
| `OPENKOI_LOG_LEVEL` | Logging verbosity. Values: `error`, `warn`, `info`, `debug`, `trace`. Default: `info`. |

### Provider API Keys

| Variable | Provider |
|----------|----------|
| `ANTHROPIC_API_KEY` | Anthropic (Claude models) |
| `OPENAI_API_KEY` | OpenAI (GPT models) |
| `GOOGLE_API_KEY` | Google (Gemini models) |
| `GROQ_API_KEY` | Groq |
| `OPENROUTER_API_KEY` | OpenRouter |
| `TOGETHER_API_KEY` | Together AI |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `MOONSHOT_API_KEY` | Moonshot / Kimi |
| `XAI_API_KEY` | xAI (Grok models) |
| `OLLAMA_HOST` | Ollama endpoint (default: `http://localhost:11434`) |
| `AWS_ACCESS_KEY_ID` | AWS Bedrock (with `AWS_SECRET_ACCESS_KEY`) |
| `AWS_SECRET_ACCESS_KEY` | AWS Bedrock |
| `AWS_SESSION_TOKEN` | AWS Bedrock (optional, for temporary credentials) |
| `AWS_REGION` | AWS Bedrock (optional, default region) |

### Integration Tokens

| Variable | Integration |
|----------|-------------|
| `SLACK_BOT_TOKEN` | Slack |
| `TELEGRAM_BOT_TOKEN` | Telegram |
| `NOTION_API_KEY` | Notion |

---

## Progressive Complexity Levels

OpenKoi is designed so that the simplest invocation requires zero configuration, while power users can control every aspect.

| Level | What you specify | What OpenKoi decides |
|-------|-----------------|---------------------|
| **0** | Just the task | Model (auto-detect), iterations (3), quality (0.8), budget ($2.00) |
| **1** | Task + iteration flags | Model (auto-detect), everything else from flags |
| **2** | Task + role-specific models | Iteration params from defaults or flags |
| **3** | Task + config file | All settings from config.toml, CLI flags override |
| **4** | REPL with slash commands | Full runtime control over every parameter |

At every level, OpenKoi creates `~/.openkoi/` silently on first use, scans for API keys, picks the best available model, and runs the task. No setup wizard is required unless no credentials are found at all.
