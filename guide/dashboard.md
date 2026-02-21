# Dashboard & Daemon

OpenKoi provides a rich set of observability tools: a TUI built with ratatui, a diagnostic doctor command, a background daemon for automated tasks, and an interactive REPL for conversational usage. This page covers all of them.

## Status Command

The `openkoi status` command gives you a snapshot of your agent's current state -- memory, skills, integrations, and cost.

### Basic Status

```bash
$ openkoi status

  Memory:       1,249 entries (12MB)
  Skills:       34 active, 2 proposed
  Integrations: slack (ok), notion (ok)
  Cost today:   $0.42 (3 tasks)
```

This is the default view. It answers the most common question: "what state is my agent in right now?"

### Verbose Status

The `--verbose` flag shows a detailed breakdown of each category:

```bash
$ openkoi status --verbose
```

### Live Task Monitoring

The `--live` flag watches the currently running task in real-time, polling `~/.openkoi/state/current-task.json` every second:

```bash
$ openkoi status --live

  Task:       Fix the login bug
  ID:         a1b2c3d4
  Phase:      executing
  Progress:   [████████░░░░░░░░░░░░░░░░░░░░░░] (2/5)
  Score:      0.78 (best: 0.82)
  Cost:       $0.1234
  Tokens:     24,500
  Elapsed:    12s

  Recent history (last 5):
    0.92  Add error handling to api.rs
    0.88  Refactor auth module
    0.85  Fix pagination in user list
```

The display refreshes every second and exits with Ctrl-C. All output goes to stderr so it doesn't interfere with piped output.

### Task State Files

OpenKoi persists task state to the filesystem for external tools and the `--live` flag:

| File | Purpose | Format |
|------|---------|--------|
| `~/.openkoi/state/current-task.json` | Currently running task | JSON (atomic writes) |
| `~/.openkoi/state/task-history.jsonl` | Completed tasks log | JSON Lines (auto-rotates at 1000 lines or 1MB) |

The `current-task.json` file is updated at each lifecycle transition (plan, iteration start, iteration end, completion) using atomic write-to-temp-then-rename. External scripts can poll this file safely without risk of partial reads.

```bash
$ openkoi status --verbose

  Memory:
    Chunks:       1,249 entries (12MB SQLite)
    Learnings:    28 total (18 heuristics, 7 anti-patterns, 3 preferences)
    Sessions:     73 completed
    Transcripts:  47MB on disk

  Skills:
    Active:       34
      Bundled:      12
      Managed:       8
      User:         11
      Workspace:     3
    Proposed:      2 (run `openkoi learn` to review)
    Evaluators:    6 active (4 bundled, 2 user)

  Integrations:
    slack:        connected (3 channels)
    notion:       connected (2 workspaces)
    imessage:     connected (macOS)

  Providers:
    anthropic:    ok (claude-sonnet-4-5)
    ollama:       ok (llama3.3, codestral)
    openai:       key expired

  MCP Servers:
    github:       ok (12 tools)
    filesystem:   ok (5 tools)

  Database:       ~/.local/share/openkoi/openkoi.db (12MB)
  Config:         ~/.openkoi/config.toml (loaded)
  Soul:           serial-entrepreneur (user, modified)
  Disk total:     59MB
```

### Cost Dashboard

The `--costs` flag shows a dedicated cost breakdown with token savings analysis:

```bash
$ openkoi status --costs

  Today:        $0.42  (3 tasks, 58k tokens)
  This week:    $2.18  (12 tasks, 287k tokens)
  This month:   $8.93  (47 tasks, 1.2M tokens)

  By model:
    claude-sonnet   $6.21  (70%)
    gpt-4.1         $1.84  (21%)
    ollama/llama3.3 $0.00  (9% of tasks, free)

  Token savings from optimizations:
    Delta feedback:       ~142k tokens saved
    Eval skipping:        ~38k tokens saved
    Incremental eval:     ~27k tokens saved
    Prompt caching:       ~95k tokens saved
    Total saved:          ~302k tokens (~$2.40)
```

The "token savings" section estimates how many tokens were saved by each optimization strategy compared to a naive approach (resending full context every iteration). This helps you understand the real cost-benefit of the iteration engine.

### Cost Tracking Internals

Cost tracking runs continuously during every task. The `CostTracker` records spending by model and by phase:

```rust
pub struct CostTracker {
    total_usd: f64,
    by_model: HashMap<String, f64>,
    by_phase: HashMap<Phase, f64>,
}

impl CostTracker {
    pub fn record(&mut self, model: &str, usage: &TokenUsage) {
        let cost = pricing::calculate(model, usage);
        self.total_usd += cost;
        *self.by_model.entry(model.into()).or_default() += cost;
    }

    pub fn over_budget(&self, budget: f64) -> bool {
        self.total_usd >= budget
    }
}
```

All cost data is persisted to SQLite in the `sessions` and `tasks` tables, enabling the historical views (weekly, monthly).

## Doctor Command

The `openkoi doctor` command runs a comprehensive health check across every subsystem. It reports issues and suggests fixes.

### What It Checks

| Check | What It Verifies |
|-------|-----------------|
| **Config** | `config.toml` exists, parses correctly, has no deprecated keys. |
| **Database** | SQLite database opens, schema is current, no corruption. |
| **Providers** | API keys are set and valid (test ping). Reports expired or missing keys. |
| **MCP servers** | Each configured server can be spawned and responds to `initialize`. |
| **Skills** | Skill directories exist, frontmatter parses, eligibility checks pass. |
| **Integrations** | Connected integrations respond (Slack, Notion, etc.). Reports token expiry. |
| **Disk** | Total disk usage across database, transcripts, and skills. |
| **Permissions** | Credential files have `chmod 600`, credential directory has `chmod 700`. |

### Example Output

```bash
$ openkoi doctor

  Config:       ~/.openkoi/config.toml (loaded)
  Database:     ~/.local/share/openkoi/openkoi.db (12MB, 1,247 entries, schema v6)
  Providers:    anthropic (ok), ollama (ok), openai (key expired)
  MCP:          github (ok, 12 tools), filesystem (ok, 5 tools)
  Skills:       34 active, 2 proposed
  Integrations: slack (ok), notion (token expired)
  Disk:         47MB total
  Permissions:  1 issue

  Issues:
    ! OpenAI API key expired. Run: openkoi init
    ! Notion token expired. Run: openkoi connect notion
    ! ~/.openkoi/credentials/providers.json has mode 644 (should be 600)
      Fix: chmod 600 ~/.openkoi/credentials/providers.json
```

Every issue includes a concrete fix command or action. The doctor never silently passes over a problem.

### Permission Repair

When permission issues are found, `openkoi doctor` can fix them automatically:

```bash
$ openkoi doctor --fix

  Fixed: ~/.openkoi/credentials/providers.json 644 -> 600
  Fixed: ~/.openkoi/credentials/ 755 -> 700
  All permissions corrected.
```

Internally, this calls `fix_all_permissions()`, which walks the credentials directory and sets the correct mode on every file and the directory itself.

## Daemon Mode

The daemon runs OpenKoi as a background process, enabling scheduled skill execution, integration watchers, and pattern mining.

### Commands

```bash
openkoi daemon start        # Start the background daemon
openkoi daemon stop         # Stop the daemon gracefully
openkoi daemon status       # Show daemon status (PID, uptime, scheduled tasks)
openkoi daemon restart      # Stop + start
```

### What the Daemon Does

| Function | Interval | Description |
|----------|----------|-------------|
| **Scheduled skills** | Per skill config | Execute skills with time-based triggers (e.g., "morning Slack summary" at 09:00 weekdays). |
| **Integration watchers** | Continuous | Monitor connected messaging channels for mentions or keywords. |
| **Pattern mining** | Configurable (default: 24h) | Analyze usage events and detect new patterns. Propose skills when confidence is high enough. |
| **Update check** | Once per day | Compare local version against latest GitHub release. Show hint on next interactive use if outdated. |

### Scheduled Skill Execution

Skills with time-based triggers are executed automatically by the daemon:

```yaml
# SKILL.md frontmatter
metadata:
  openkoi:
    trigger:
      type: time
      schedule: { hour: 9, days: [1, 2, 3, 4, 5] }   # Weekdays at 09:00
```

The daemon checks the schedule every minute and fires matching skills. Each execution creates a full session with transcript, cost tracking, and learning extraction.

### Background Watchers

When integrations are connected, the daemon can watch channels for activity:

```toml
# config.toml
[integrations.slack]
enabled = true
channels = ["#engineering", "#general"]
watch = true   # Enable daemon watching
```

When a watched channel receives a mention of OpenKoi (or a configured keyword), the daemon creates a task and responds through the same integration.

### Pattern Mining on Interval

The pattern miner runs on a configurable interval (default: every 24 hours). It analyzes usage events from the past 30 days, clusters them by embedding similarity, and detects:

- **Recurring tasks**: The same kind of task executed multiple times.
- **Time-based patterns**: Tasks that happen at consistent times.
- **Workflow sequences**: Chains of tasks that always occur in order.

Detected patterns with confidence >= 0.7 and sample count >= 3 are written to the `proposed/` skills directory. You review them with `openkoi learn`.

## Interactive REPL

The `openkoi chat` command starts an interactive session with full agent capabilities.

### Startup Banner

```
$ openkoi chat
openkoi v0.1 | claude-sonnet-4-5 | memory: 1,247 entries | $0.00 spent

>
```

The banner shows:
- The current version
- The active model
- Total memory entries
- Session cost (starts at $0.00)

### Conversation Flow

```
> Help me refactor the auth module to use JWT
[recall] 3 similar tasks, 2 learnings
[iter 1/3] score: 0.72 (completeness: 0.65)
  ! Missing token refresh logic
[iter 2/3] score: 0.88
[done] 2 iterations, $0.42, 2 learnings saved

> /status
Memory: 1,249 entries (12MB) | Skills: 34 active | Cost today: $0.42

> /learn
1 new pattern detected: "JWT auth setup" (seen 4x, confidence: 0.78)
  [a]pprove  [d]ismiss  [v]iew

> quit
```

### Slash Commands

All slash commands are available within the REPL:

| Command | Description |
|---------|-------------|
| `/status` | Show memory count, active skills, session cost. |
| `/learn` | Review detected patterns and proposed skills. |
| `/model <provider/model>` | Switch the active model mid-session. Example: `/model ollama/codestral` |
| `/iterate <n>` | Set max iterations for subsequent tasks. Example: `/iterate 5` |
| `/quality <threshold>` | Set the quality threshold (0.0-1.0). Example: `/quality 0.9` |
| `/history` | Show recent task history with scores and costs. |
| `/cost` | Show current session cost breakdown. |
| `/soul review` | Review proposed soul evolution (if available). |
| `/help` | List all available slash commands. |

### Model Switching

You can change models mid-session for different tasks:

```
> /model executor ollama/codestral
  Executor model changed to ollama/codestral

> /model evaluator anthropic/claude-opus
  Evaluator model changed to anthropic/claude-opus

> /model anthropic/claude-sonnet-4-5
  All roles set to anthropic/claude-sonnet-4-5
```

Specifying a role (`executor`, `evaluator`, `planner`) changes only that role. Without a role prefix, all roles are changed.

## TUI Framework

The interactive elements of OpenKoi are built with:

| Library | Version | Purpose |
|---------|---------|---------|
| **ratatui** | 0.30 | Terminal UI framework for status displays and dashboards. |
| **crossterm** | 0.29 | Cross-platform terminal manipulation (colors, cursor, events). |
| **inquire** | 0.9 | Interactive prompts (selection lists, confirmations, text input). |

The TUI is used for:
- The provider picker during onboarding
- The `openkoi learn` approval flow
- The REPL input handling
- The `openkoi status` dashboard formatting

## Post-Onboarding Hints

After the first successful run, OpenKoi shows one contextual hint. Hints rotate across runs to gradually introduce features:

```
Tip: run `openkoi chat` for interactive mode.
Tip: run `openkoi status` to see memory and cost stats.
Tip: run `openkoi learn` to review learned patterns.
Tip: add `--iterate 0` to skip self-evaluation (faster, cheaper).
Tip: set OPENKOI_MODEL=ollama/codestral to change default model.
```

**After 5 runs, hints stop appearing** unless the user explicitly runs `openkoi --help`. This prevents experienced users from seeing unnecessary noise while still helping new users discover features organically.

## Session Transcripts

Every session is recorded as a JSONL (JSON Lines) transcript file for debugging, auditing, and analysis.

### Storage Location

```
~/.local/share/openkoi/sessions/
  <session-id>.jsonl
  <session-id>.jsonl
  ...
```

Each session gets a unique UUID-based filename. Transcripts are append-only -- events are written as they occur, so even if the agent crashes, the transcript up to that point is preserved.

### Event Types

Each line in a transcript is a JSON object with a `type` field:

| Event Type | When Emitted | Key Fields |
|-----------|-------------|------------|
| `task_start` | Task begins execution | `description`, `model`, `iteration_config` |
| `recall` | Memory recall completes | `anti_patterns`, `learnings`, `similar_tasks`, `tokens` |
| `iteration` | An iteration cycle completes | `n`, `score`, `tokens`, `duration_ms`, `eval` (full/incremental/skipped) |
| `tool_call` | Agent invokes a tool | `server`, `tool`, `duration_ms` |
| `task_complete` | Task finishes | `iterations`, `total_tokens`, `cost_usd`, `final_score` |
| `learning` | A learning is extracted | `type`, `content`, `confidence` |
| `error` | An error occurs | `error_type`, `message`, `retriable` |

### Example Transcript

```jsonl
{"ts":"2026-02-18T10:30:00Z","type":"task_start","description":"Add rate limiting","model":"claude-sonnet-4-5"}
{"ts":"2026-02-18T10:30:01Z","type":"recall","anti_patterns":1,"learnings":2,"tokens":450}
{"ts":"2026-02-18T10:30:04Z","type":"iteration","n":1,"score":0.73,"tokens":12400,"duration_ms":3200}
{"ts":"2026-02-18T10:30:07Z","type":"iteration","n":2,"score":0.89,"tokens":8100,"duration_ms":2800,"eval":"incremental"}
{"ts":"2026-02-18T10:30:07Z","type":"task_complete","iterations":2,"total_tokens":20900,"cost_usd":0.32}
```

### Using Transcripts

Transcripts are standard JSONL, readable by any tool that handles line-delimited JSON:

```bash
# Count tasks completed today
cat ~/.local/share/openkoi/sessions/*.jsonl | \
  grep '"type":"task_complete"' | wc -l

# Find expensive tasks
cat ~/.local/share/openkoi/sessions/*.jsonl | \
  grep '"type":"task_complete"' | \
  jq 'select(.cost_usd > 1.0)'

# Replay a session's iteration scores
cat ~/.local/share/openkoi/sessions/<id>.jsonl | \
  grep '"type":"iteration"' | \
  jq '{n: .n, score: .score, tokens: .tokens}'
```

Transcripts are also indexed into the memory system. The Historian chunks transcript content and creates embeddings, making past sessions searchable via semantic recall.

## Environment Variables

Dashboard and daemon behavior can be configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENKOI_HOME` | _(unset)_ | Override all config and data paths. Config at `$OPENKOI_HOME/`, data at `$OPENKOI_HOME/data/`. |
| `OPENKOI_LOG_LEVEL` | `info` | Log verbosity: `error`, `warn`, `info`, `debug`, `trace`. |
| `OPENKOI_DATA` | `~/.local/share/openkoi` | Data directory (database, transcripts, skills). |
| `OPENKOI_CONFIG` | `~/.openkoi/config.toml` | Path to configuration file. |

## HTTP API

When the daemon is running, it exposes a localhost REST API (default port 9742) for external tools, scripts, and web UIs. The API is configured in the `[api]` section of `config.toml` (see [Configuration](/guide/configuration)).

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/tasks` | Submit a new task |
| `GET` | `/api/v1/tasks` | List recent tasks from history |
| `GET` | `/api/v1/tasks/{id}` | Get a specific task (active or historical) |
| `POST` | `/api/v1/tasks/{id}/cancel` | Request cancellation of a running task |
| `GET` | `/api/v1/status` | System status (version, daemon state, active task, daily summary) |
| `GET` | `/api/v1/cost` | Cost summary (events in last 24 hours, recent tasks) |
| `GET` | `/api/v1/health` | Health check |

### Examples

```bash
# Submit a task
curl -X POST http://localhost:9742/api/v1/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"description": "Fix the login bug", "max_iterations": 5, "quality_threshold": 0.9}'

# List recent tasks
curl http://localhost:9742/api/v1/tasks

# Get task by ID
curl http://localhost:9742/api/v1/tasks/a1b2c3d4-5678-90ab-cdef-1234567890ab

# Cancel a running task (best-effort, at next iteration boundary)
curl -X POST http://localhost:9742/api/v1/tasks/a1b2c3d4-.../cancel

# System status
curl http://localhost:9742/api/v1/status

# Cost summary
curl http://localhost:9742/api/v1/cost

# Health check
curl http://localhost:9742/api/v1/health
```

### Authentication

When `api.token` is set in `config.toml`, all requests must include the `Authorization: Bearer <token>` header. When the token is empty (default), no authentication is required -- the API only listens on localhost.

### Webhooks

Outbound HTTP callbacks fire on lifecycle events. Configure in `config.toml`:

```toml
[api.webhooks]
on_task_complete = "https://example.com/hooks/complete"
on_task_failed = "https://example.com/hooks/failed"
on_budget_warning = "https://example.com/hooks/budget"
```

Webhook payloads are JSON with an `event` field and event-specific data:

```json
{
  "event": "task.complete",
  "timestamp": "2026-02-22T10:30:07Z",
  "task_id": "a1b2c3d4-...",
  "description": "Fix the login bug",
  "iterations": 2,
  "final_score": 0.92,
  "cost_usd": 0.18,
  "total_tokens": 24500
}
```

Delivery is fire-and-forget with a 10-second timeout. Failed deliveries are logged but not retried.

## Summary

| Tool | Command | Purpose |
|------|---------|---------|
| **Status** | `openkoi status` | Quick overview of memory, skills, cost. |
| **Verbose status** | `openkoi status --verbose` | Detailed breakdown of every subsystem. |
| **Cost dashboard** | `openkoi status --costs` | Cost breakdown by time period and model. |
| **Live monitoring** | `openkoi status --live` | Real-time view of the running task with progress bar. |
| **Doctor** | `openkoi doctor` | Health check with fix suggestions. |
| **Daemon** | `openkoi daemon start` | Background execution of scheduled skills and watchers. |
| **HTTP API** | `localhost:9742` | REST API for external tools and scripts. |
| **REPL** | `openkoi chat` | Interactive session with slash commands. |
| **Transcripts** | `~/.local/share/openkoi/sessions/` | JSONL audit trail of every session. |
