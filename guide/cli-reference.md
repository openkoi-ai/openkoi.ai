# CLI Reference

OpenKoi ships as a single binary with a small, focused command surface. Primary commands cover all use cases, with flags and REPL slash commands for progressive control.

## Command Overview

| Command | Description |
|---------|-------------|
| `openkoi [task]` | Run a task (default command) |
| `openkoi chat` | Interactive REPL session |
| `openkoi learn` | Review learned patterns and proposed skills |
| `openkoi status` | Show memory, skills, integrations, and costs |
| `openkoi init` | First-time setup wizard |
| `openkoi connect [provider]` | Authenticate with an OAuth provider or set up an integration |
| `openkoi disconnect [provider]` | Remove stored credentials for a provider |
| `openkoi daemon [action]` | Manage the background daemon |
| `openkoi doctor` | Run diagnostics on the system |
| `openkoi update` | Update to the latest version |
| `openkoi export` | Export all data to portable formats |
| `openkoi migrate down` | Roll back database migrations (manual) |

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

## `openkoi chat`

Starts an interactive REPL session. You type tasks, see iteration progress in real time, and use slash commands to adjust behavior mid-session.

```bash
# Start a new session
openkoi chat

# Resume a previous session by ID
openkoi chat --session abc123
```

### Flags

| Flag | Description |
|------|-------------|
| `--session <id>` | Resume a previously saved session. The session transcript is loaded from `~/.local/share/openkoi/sessions/<id>.jsonl`. |

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
```

### Flags

| Flag | Description |
|------|-------------|
| `--verbose` | Show detailed breakdown of all subsystems: memory layers, individual skill scores, provider health, and MCP server status. |
| `--costs` | Show cost analytics: today/week/month spend, per-model breakdown, and token savings from optimizations. |

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
