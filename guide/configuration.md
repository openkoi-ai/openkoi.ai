# Configuration

OpenKoi uses TOML for configuration -- Rust-idiomatic, unambiguous typing, and better suited for config files than YAML. No configuration is required to get started; all settings have sensible defaults. The config file provides persistent preferences for power users.

## Config File Location

The default configuration file is located at:

```
~/.openkoi/config.toml
```

You can override this with the `--config` flag or the `OPENKOI_CONFIG` environment variable:

```bash
openkoi --config ./project-openkoi.toml "Fix the bug"
OPENKOI_CONFIG=~/custom-config.toml openkoi "Fix the bug"
```

---

## Full Reference

Below is a complete `config.toml` with all available options and their default values.

```toml
# ~/.openkoi/config.toml

# ─── Model Assignment ────────────────────────────────────────────
[models]
executor  = "anthropic/claude-sonnet-4-5"   # Does the work
evaluator = "anthropic/claude-opus-4-6"     # Judges the output
planner   = "anthropic/claude-sonnet-4-5"   # Plans strategy
embedder  = "openai/text-embedding-3-small" # Generates embeddings

# Fallback chains per role. If the primary model fails (rate limit,
# outage), the next candidate is tried after a cooldown.
[models.fallback]
executor = [
  "anthropic/claude-sonnet-4-5",
  "openai/gpt-5.2",
  "ollama/llama3.3",
]

# ─── Iteration Engine ────────────────────────────────────────────
[iteration]
max_iterations       = 3       # Maximum execute-evaluate-refine cycles
quality_threshold    = 0.8     # Score (0.0-1.0) to accept output
improvement_threshold = 0.05   # Minimum score improvement to continue iterating
timeout_seconds      = 300     # Hard timeout per task (5 minutes)
token_budget         = 200000  # Max tokens per task across all iterations
skip_eval_confidence = 0.95    # Skip LLM evaluation when previous score >= this
                               # AND static analysis/tests pass

# ─── Safety & Circuit Breakers ───────────────────────────────────
[safety]
max_cost_usd        = 2.0     # Hard cost limit per task in USD
abort_on_regression = true     # Stop iterating if score drops significantly

[safety.tool_loop]
warning         = 10   # Warn after N repeated tool calls
critical        = 20   # Escalate after N repeated tool calls
circuit_breaker = 30   # Hard stop after N repeated tool calls

# ─── Pattern Mining ──────────────────────────────────────────────
[patterns]
enabled             = true   # Enable usage pattern detection
mine_interval_hours = 24     # How often to run pattern mining
min_confidence      = 0.7    # Minimum confidence to surface a pattern
min_samples         = 3      # Minimum occurrences before a pattern is detected
auto_propose        = true   # Automatically generate skill proposals from patterns

# ─── App Integrations ───────────────────────────────────────────
[integrations.slack]
enabled  = true
channels = ["#engineering", "#general"]

[integrations.notion]
enabled = true

[integrations.imessage]
enabled = true   # macOS only

[integrations.telegram]
enabled = false

[integrations.discord]
enabled = false

# ─── Plugins ─────────────────────────────────────────────────────
[plugins]
wasm    = ["~/.openkoi/plugins/wasm/custom-eval.wasm"]
scripts = ["~/.openkoi/plugins/scripts/my-hooks.rhai"]

# MCP tool servers (subprocess-based, language-agnostic)
[[plugins.mcp]]
name    = "github"
command = "mcp-server-github"

[[plugins.mcp]]
name    = "filesystem"
command = "mcp-server-filesystem"
args    = ["--root", "."]

[[plugins.mcp]]
name    = "postgres"
command = "mcp-server-postgres"
env     = { DATABASE_URL = "postgres://localhost/mydb" }

# ─── Memory ──────────────────────────────────────────────────────
[memory]
compaction          = true   # Enable context compaction for long sessions
learning_decay_rate = 0.05   # Confidence decay per week for unreinforced learnings
max_storage_mb      = 500    # Maximum disk usage for the data directory
```

---

## Section Details

### `[models]`

Assigns models to the four agent roles. Each value uses the `provider/model-name` format.

| Key | Role | Description |
|-----|------|-------------|
| `executor` | Executor | Performs the actual task work (code generation, writing, analysis). |
| `evaluator` | Evaluator | Judges the executor's output against rubrics. |
| `planner` | Planner | Creates the initial plan and refines it between iterations. Can be the same as executor. |
| `embedder` | Embedder | Generates vector embeddings for semantic search in memory. |

If you only set `executor`, the same model is used for all roles (except embedder, which defaults to `openai/text-embedding-3-small`).

#### `[models.fallback]`

Defines fallback chains per role. When a model returns a transient error (rate limit, 5xx, timeout), the next model in the chain is tried. Failed models enter a cooldown period before being retried.

```toml
[models.fallback]
executor = [
  "anthropic/claude-sonnet-4-5",
  "openai/gpt-5.2",
  "ollama/llama3.3",
]
evaluator = [
  "anthropic/claude-opus-4-6",
  "anthropic/claude-sonnet-4-5",
]
```

### `[iteration]`

Controls the self-iteration engine behavior.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `max_iterations` | integer | `3` | Upper bound on execute-evaluate-refine cycles. Set to `0` for single-shot (no evaluation). |
| `quality_threshold` | float | `0.8` | Target score. The loop stops when the evaluator scores at or above this. |
| `improvement_threshold` | float | `0.05` | If the score improvement between iterations is below this, the loop stops (diminishing returns). |
| `timeout_seconds` | integer | `300` | Hard timeout for the entire task. The best result so far is returned on timeout. |
| `token_budget` | integer | `200000` | Maximum tokens across all iterations. Includes execution, evaluation, planning, and recall. |
| `skip_eval_confidence` | float | `0.95` | If the previous iteration scored at or above this value AND static analysis/tests pass, skip the LLM evaluation entirely. Saves 100% of evaluation tokens. |

### `[safety]`

Circuit breakers that prevent runaway costs and regressions.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `max_cost_usd` | float | `2.0` | Hard cost limit per task. The iteration loop stops immediately when this is reached. Override per-task with `--budget`. |
| `abort_on_regression` | bool | `true` | If a subsequent iteration scores significantly lower than the previous one, stop and return the best result. Prevents "fixing" that makes things worse. |

#### `[safety.tool_loop]`

Detects when the agent is stuck in a loop calling the same tool repeatedly.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `warning` | integer | `10` | Number of repeated tool calls before a warning is logged. |
| `critical` | integer | `20` | Number of repeated tool calls before escalating (pausing for human input). |
| `circuit_breaker` | integer | `30` | Hard stop. The task is aborted after this many repeated tool calls. |

### `[patterns]`

Controls the daily usage pattern learning system.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | bool | `true` | Whether to mine usage patterns at all. |
| `mine_interval_hours` | integer | `24` | How frequently to run the pattern mining pipeline. |
| `min_confidence` | float | `0.7` | Minimum confidence score to surface a detected pattern to the user. |
| `min_samples` | integer | `3` | Minimum number of occurrences before a behavior qualifies as a pattern. |
| `auto_propose` | bool | `true` | Automatically generate SKILL.md proposals from detected patterns. If false, patterns are detected but no skills are proposed. |

### `[integrations.<app>]`

Each integration has its own sub-table. The `enabled` key is required; additional keys are app-specific.

| Integration | Keys | Notes |
|-------------|------|-------|
| `slack` | `enabled`, `channels` | `channels` is an array of channel names to watch. |
| `notion` | `enabled` | Notion API key comes from `NOTION_API_KEY` env var. |
| `imessage` | `enabled` | macOS only. Uses AppleScript. |
| `telegram` | `enabled` | Bot token from `TELEGRAM_BOT_TOKEN` env var. |
| `discord` | `enabled` | Bot token from config or env. |
| `google_docs` | `enabled` | OAuth2 flow on first use. |
| `google_sheets` | `enabled` | OAuth2 flow on first use. |
| `ms_office` | `enabled` | Reads local `.docx`/`.xlsx` files directly. |
| `ms_teams` | `enabled` | Microsoft Graph API. |
| `email` | `enabled`, `imap_host`, `smtp_host` | IMAP/SMTP configuration. |

### `[plugins]`

Three tiers of extensibility.

| Key | Type | Description |
|-----|------|-------------|
| `wasm` | array of strings | Paths to WASM plugin files. Plugins run in a wasmtime sandbox with explicit capability grants. |
| `scripts` | array of strings | Paths to Rhai script files. Scripts run in a sandboxed interpreter and can hook into the agent lifecycle. |
| `mcp` | array of tables | MCP (Model Context Protocol) tool servers. Each entry is a subprocess that provides tools via JSON-RPC over stdio. |

#### MCP Server Configuration

Each MCP server entry supports the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Unique name for the server. Used as a namespace prefix for its tools (e.g., `github__create_issue`). |
| `command` | string | yes | The executable to spawn. |
| `args` | array of strings | no | Command-line arguments passed to the server. |
| `env` | table | no | Environment variables to pass to the server process. Only these variables are inherited (not the full user env). |

```toml
[[plugins.mcp]]
name    = "github"
command = "mcp-server-github"

[[plugins.mcp]]
name    = "filesystem"
command = "mcp-server-filesystem"
args    = ["--root", "."]

[[plugins.mcp]]
name    = "postgres"
command = "mcp-server-postgres"
env     = { DATABASE_URL = "postgres://localhost/mydb" }
```

OpenKoi also auto-discovers MCP servers from `.mcp.json` in the project root (compatible with Claude Code and VS Code format).

### `[memory]`

Controls the persistent local memory system.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `compaction` | bool | `true` | Enable context compaction for long chat sessions. When enabled, old messages are summarized to keep the context window lean. |
| `learning_decay_rate` | float | `0.05` | Confidence decay rate per week for learnings that are not reinforced. Learnings below 0.1 confidence are pruned. Set to `0.0` to disable decay. |
| `max_storage_mb` | integer | `500` | Maximum disk usage for the data directory (`~/.local/share/openkoi`). When exceeded, old session transcripts are pruned first. |

---

## Config File Evolution Rules

OpenKoi's config loading is designed for forward and backward compatibility across versions.

| Rule | Behavior |
|------|----------|
| **New keys get defaults** | Old config files work without changes. Missing keys use built-in defaults. |
| **Unknown keys are ignored** | A config file from a newer version can be read by an older binary without errors. |
| **Deprecated keys emit warnings** | Deprecated keys still work for at least 2 major versions but produce a warning on startup. |
| **Removed keys are silently ignored** | OpenKoi never errors on unrecognized keys. |
| **Breaking semantic changes use new key names** | If the meaning of a key changes, a new key is introduced and the old one is deprecated. |

This means you can safely share a config file across machines running different OpenKoi versions.

---

## Environment Variable Overrides

Every config option can be overridden by an environment variable. The mapping follows the pattern `OPENKOI_<SECTION>_<KEY>` in uppercase.

| Environment Variable | Config Equivalent | Example |
|---------------------|-------------------|---------|
| `OPENKOI_MODEL` | Sets all model roles | `OPENKOI_MODEL=ollama/codestral` |
| `OPENKOI_CONFIG` | Config file path | `OPENKOI_CONFIG=~/alt-config.toml` |
| `OPENKOI_DATA` | Data directory path | `OPENKOI_DATA=~/openkoi-data` |
| `OPENKOI_LOG_LEVEL` | Logging verbosity | `OPENKOI_LOG_LEVEL=debug` |

Provider API keys are read directly from their standard environment variables (e.g., `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`). See the [CLI Reference](/guide/cli-reference) for the full list.

---

## Data Directory Layout

OpenKoi stores all persistent data locally. The layout follows XDG conventions:

```
~/.openkoi/                          # XDG_CONFIG_HOME/openkoi
  config.toml                        # Configuration
  credentials/                       # API keys (chmod 600)
  SOUL.md                            # Agent identity (user-editable)

~/.local/share/openkoi/              # XDG_DATA_HOME/openkoi
  openkoi.db                         # SQLite database (structured data + vectors)
  sessions/
    <session-id>.jsonl               # Session transcripts
  skills/
    managed/                         # Installed skills
    proposed/                        # Auto-proposed from patterns
    user/                            # User-created task skills
  evaluators/
    managed/                         # Installed evaluator skills
    proposed/                        # Auto-proposed evaluator skills
    user/                            # User-created evaluator skills
  plugins/
    wasm/                            # WASM plugins
    scripts/                         # Rhai scripts
```

---

## Minimal Config Examples

### Use Ollama locally (zero cost)

```toml
[models]
executor  = "ollama/codestral"
evaluator = "ollama/codestral"
embedder  = "ollama/nomic-embed-text"

[iteration]
max_iterations = 2

[safety]
max_cost_usd = 0.0
```

### High-quality code review setup

```toml
[models]
executor  = "anthropic/claude-sonnet-4-5"
evaluator = "anthropic/claude-opus-4-6"

[iteration]
max_iterations    = 5
quality_threshold = 0.9

[safety]
max_cost_usd = 5.0
```

### Budget-conscious with fallbacks

```toml
[models]
executor  = "openai/gpt-5.2"
evaluator = "openai/gpt-5.2"

[models.fallback]
executor = ["openai/gpt-5.2", "ollama/llama3.3"]

[iteration]
max_iterations    = 2
quality_threshold = 0.75
token_budget      = 100000

[safety]
max_cost_usd = 1.0
```
