# Architecture

OpenKoi is a single-binary Rust application organized as a library crate with a thin CLI entry point. This page covers the module layout, data flow, dependency choices, error handling, logging, testing, distribution, and performance characteristics.

## Module Layout

```
openkoi/
  Cargo.toml
  Cargo.lock

  src/
    main.rs                           # Entry point (thin: parse CLI, call lib)
    lib.rs                            # Library root (re-exports all modules)

    cli/                              # CLI layer (user-facing commands)
      mod.rs                          # CLI definition (clap derive)
      run.rs                          # Default command: run task
      chat.rs                         # Interactive REPL
      learn.rs                        # Pattern review
      status.rs                       # System status + cost dashboard
      init.rs                         # First-time setup wizard
      connect.rs                      # Integration setup

    core/                             # Iteration engine (the brain)
      mod.rs
      orchestrator.rs                 # Iteration controller + router
      executor.rs                     # Task execution
      types.rs                        # Core types (IterationCycle, Phase, etc.)
      token_budget.rs                 # Token budgeting and allocation
      token_optimizer.rs              # Context compression, delta feedback
      cost.rs                         # Cost tracking per model and phase
      safety.rs                       # Circuit breakers, limits, guardrails

    evaluator/                        # Evaluation framework
      mod.rs                          # EvaluatorFramework + skill selection
      test_runner.rs                  # Built-in: run test suite
      static_analysis.rs              # Built-in: lint + typecheck
      parser.rs                       # Parse LLM eval response into scores
      bundled/                        # Embedded evaluator SKILL.md files
        general.md
        code_review.md
        prose_quality.md
        sql_safety.md
        api_design.md
        test_quality.md

    learner/                          # Learning from task outcomes
      mod.rs
      skill_selector.rs              # Multi-signal skill ranking
      extractor.rs                   # Learning extraction from cycles
      types.rs                       # Learning, RankedSkill, Signal types
      dedup.rs                       # Deduplication against existing learnings

    memory/                           # Persistent local memory
      mod.rs                         # MemoryManager
      store.rs                       # SQLite operations
      schema.rs                      # Schema + migrations
      recall.rs                      # Token-budgeted recall
      compaction.rs                  # Context compaction
      embeddings.rs                  # Vector operations (sqlite-vec)
      decay.rs                       # Confidence decay for learnings

    patterns/                         # Daily usage pattern learning
      mod.rs
      event_logger.rs                # Usage event recording
      miner.rs                       # Pattern detection (recurring, time, workflow)
      skill_proposer.rs              # Auto-generate skills from patterns

    skills/                           # Skill system
      mod.rs
      loader.rs                      # Skill loading (6 sources, precedence order)
      eligibility.rs                 # Eligibility checks (OS, bins, env, approval)
      registry.rs                    # Skill registry
      frontmatter.rs                 # YAML frontmatter parser

    provider/                         # Multi-model provider layer
      mod.rs                         # Provider trait definition
      resolver.rs                    # Auto-discovery from env vars
      fallback.rs                    # Fallback chain with cooldowns
      roles.rs                       # Role-based model assignment
      anthropic.rs                   # Anthropic Messages API
      openai.rs                      # OpenAI Chat API
      google.rs                      # Google Generative AI
      ollama.rs                      # Ollama local inference
      bedrock.rs                     # AWS Bedrock
      openai_compat.rs               # Generic OpenAI-compatible endpoint

    plugins/                          # Extension system
      mod.rs
      mcp.rs                         # MCP tool servers (subprocess, stdio)
      wasm.rs                        # WASM plugins (wasmtime sandbox)
      rhai_host.rs                   # Rhai scripting engine
      hooks.rs                       # Hook execution (before/after lifecycle events)

    integrations/                     # App integration layer
      mod.rs                         # Integration trait
      registry.rs                    # Integration registry
      tools.rs                       # Auto-register integration tools
      watcher.rs                     # Background watchers (daemon mode)
      imessage.rs                    # iMessage (macOS, AppleScript)
      telegram.rs                    # Telegram Bot API
      slack.rs                       # Slack Web API + Socket Mode
      discord.rs                     # Discord Bot
      notion.rs                      # Notion API
      google_docs.rs                 # Google Docs API
      ms_office.rs                   # Local docx/xlsx (crate-based parsing)
      email.rs                       # IMAP/SMTP

    infra/                            # Infrastructure utilities
      mod.rs
      config.rs                      # Config loading (TOML, env vars, defaults)
      paths.rs                       # XDG paths (config, data, cache)
      logger.rs                      # Tracing setup (structured logging)
      session.rs                     # Session management + transcript writer
      daemon.rs                      # Background daemon (scheduled tasks, watchers)

    soul/                             # Soul system (agent identity)
      mod.rs                         # Soul loading + injection into prompts
      loader.rs                      # Load from workspace > user > default
      evolution.rs                   # Soul evolution proposals

    templates/                        # Embedded templates
      SOUL.md                        # Default soul (serial entrepreneur)

  tests/                              # Integration + snapshot tests
    core/
      orchestrator_test.rs
      token_optimizer_test.rs
      safety_test.rs
    evaluator/
      llm_judge_test.rs
      eval_cache_test.rs
    memory/
      recall_test.rs
      compaction_test.rs
      decay_test.rs
    patterns/
      miner_test.rs
    integration/
      full_iteration_test.rs
```

## Data Flow

The following diagram shows how data moves through the system during a typical task execution:

```
                              CLI (clap)
                    openkoi <task> | chat | learn
                                |
                    +-----------v-----------+
                    |      Orchestrator     |
                    | (Iteration Controller)|
                    +---+---+---+---+---+---+
                        |   |   |   |   |
        +------+  +-----+ +---+ +---+ +---+ +------+
        |Exec. |  |Eval. | |Lea.| |His.| |Pat.| |Integ.|
        | (Do) |  |(Judg)| |(Ad)| |(Re)| |Min.| |Layer |
        +--+---+  +--+---+ +-+-+ +-+-+ +-+-+ +--+---+
           |         |        |     |     |      |
        +--v---+ +---v--+ +--v--+ +-v--+ |  +---v---+
        |Tools | |Rubric| |Skill| |SQL | |  |Messag.|
        |(MCP) | |Engine| | Reg.| |ite | |  |Docum. |
        +------+ +------+ +-----+ +----+ |  +---+---+
                                          |      |
        +-----------------------------+  +v---+ +v--------+
        |   Model Provider Layer      |  |Pat.| |iMessage |
        | Anthropic | OpenAI | Google |  | DB | |Slack/TG |
        | Ollama | Bedrock | Compat.  |  +----+ |Notion   |
        +-----------------------------+         +---------+
```

### Execution Sequence

1. **CLI** parses the command and passes the task to the Orchestrator.
2. **Orchestrator** performs recall (token-budgeted) via the Historian.
3. **Learner** selects and ranks skills relevant to the task.
4. **Executor** builds context (compressed, with delta feedback on iteration 2+) and sends to the Model Provider.
5. **Evaluator** judges the output using evaluator skills (LLM-based rubrics) and built-in checks (tests, lint).
6. **Orchestrator** decides: continue iterating, accept, or abort.
7. **Learner** extracts learnings from the completed cycles (background, non-blocking).
8. **Historian** persists the session, cycles, and learnings to SQLite.

## Dependency Summary

All dependencies are listed in `Cargo.toml`. OpenKoi has zero runtime dependencies -- everything is statically linked into a single binary.

### Core Dependencies

| Category | Crate | Version | Purpose |
|----------|-------|---------|---------|
| **CLI** | `clap` | 4 (derive) | Command-line argument parsing with derive macros. |
| **Async** | `tokio` | 1 (full) | Async runtime. Handles concurrent API calls, I/O, timers. |
| **HTTP** | `reqwest` | 0.13 | HTTP client for API calls. Features: `json`, `stream`, `rustls-tls`. |
| **SSE** | `reqwest-eventsource` | 0.6 | Server-Sent Events for streaming API responses. |

### Serialization

| Crate | Version | Purpose |
|-------|---------|---------|
| `serde` | 1 (derive) | Serialization/deserialization framework. |
| `serde_json` | 1 | JSON handling for API requests/responses. |
| `serde_yml` | 0.0.12 | YAML parsing for SKILL.md frontmatter. |
| `toml` | 0.8 | TOML parsing for `config.toml`. |

### Data Storage

| Crate | Version | Purpose |
|-------|---------|---------|
| `rusqlite` | 0.38 (bundled) | SQLite database. Bundled build (no system SQLite needed). |
| `sqlite-vec` | 0.1.6 | Vector search extension for semantic memory (cosine similarity). |

### Templates & Parsing

| Crate | Version | Purpose |
|-------|---------|---------|
| `minijinja` | 2 | Prompt templating (Jinja2-style syntax). |
| `pulldown-cmark` | 0.13 | Markdown parsing for SKILL.md body extraction. |

### TUI

| Crate | Version | Purpose |
|-------|---------|---------|
| `ratatui` | 0.30 | Terminal UI framework for dashboards and status displays. |
| `crossterm` | 0.29 | Cross-platform terminal manipulation (colors, cursor, input). |
| `inquire` | 0.9 | Interactive prompts (selection lists, password input, confirmations). |

### Plugin Runtimes

| Crate | Version | Purpose |
|-------|---------|---------|
| `wasmtime` | 41 | WASM plugin runtime. Component model support for sandboxed execution. |
| `rhai` | 1.24 | Embedded scripting language for hooks and custom commands. |

### Error Handling & Logging

| Crate | Version | Purpose |
|-------|---------|---------|
| `anyhow` | 1 | Flexible error handling for application code. |
| `thiserror` | 2 | Derive macros for structured error types. |
| `tracing` | 0.1 | Structured logging framework. |
| `tracing-subscriber` | 0.3 | Log output formatting and filtering. |

### Utilities

| Crate | Version | Purpose |
|-------|---------|---------|
| `uuid` | 1 (v4) | UUID generation for session and task IDs. |
| `chrono` | 0.4 (serde) | Date/time handling with serialization support. |
| `which` | 7 | Binary lookup in `$PATH` (for skill eligibility checks). |
| `directories` | 6 | XDG base directory resolution (config, data, cache paths). |
| `async-trait` | 0.1 | Async methods in trait definitions. |
| `futures` | 0.3 | Future combinators and stream utilities. |
| `pin-project` | 1 | Safe pin projections for streaming responses. |

### Dev Dependencies

| Crate | Version | Purpose |
|-------|---------|---------|
| `insta` | 1 | Snapshot testing (prompt templates, CLI output, eval reports). |
| `mockall` | 0.13 | Mock trait implementations for unit testing. |
| `pretty_assertions` | 1 | Readable assertion diffs in test failures. |
| `tokio-test` | 0.4 | Test utilities for async code. |

## Error Types

OpenKoi uses a single `OpenKoiError` enum that covers every failure mode in the system. This is defined with `thiserror` for structured error handling.

```rust
#[derive(thiserror::Error, Debug)]
pub enum OpenKoiError {
    #[error("Provider '{provider}' error: {message}")]
    Provider { provider: String, message: String, retriable: bool },

    #[error("Rate limited by '{provider}', retry after {retry_after_ms}ms")]
    RateLimited { provider: String, retry_after_ms: u64 },

    #[error("All providers exhausted")]
    AllProvidersExhausted,

    #[error("Token budget exceeded: {spent}/{budget}")]
    BudgetExceeded { spent: u32, budget: u32 },

    #[error("Cost limit exceeded: ${spent:.2}/${limit:.2}")]
    CostLimitExceeded { spent: f64, limit: f64 },

    #[error("Tool loop detected: {tool} called {count} times")]
    ToolLoop { tool: String, count: u32 },

    #[error("Score regression: {current:.2} < {previous:.2}")]
    ScoreRegression { current: f32, previous: f32, threshold: f32 },

    #[error("No provider configured. Run `openkoi init` or set ANTHROPIC_API_KEY.")]
    NoProvider,

    #[error("Skill '{name}' not found")]
    SkillNotFound { name: String },

    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("MCP server '{server}' failed: {message}")]
    McpServer { server: String, message: String },

    #[error(transparent)]
    Other(#[from] anyhow::Error),
}
```

### Error Categories

| Variant | Retriable | User Action |
|---------|-----------|-------------|
| `Provider` | Depends on `retriable` field | Fallback chain handles automatically. If all fail, check API key / network. |
| `RateLimited` | Yes (after delay) | Automatic retry with backoff. Falls back to next provider if delay is too long. |
| `AllProvidersExhausted` | No | Configure additional providers or check existing keys. |
| `BudgetExceeded` | No | Increase `token_budget` in config or via `--budget` flag. |
| `CostLimitExceeded` | No | Increase `max_cost_usd` in config or via `--budget` flag. **Hard stop.** |
| `ToolLoop` | No | Indicates the agent is stuck. Review the task or increase thresholds. |
| `ScoreRegression` | No | Output quality dropped. Best previous result is returned. |
| `NoProvider` | No | Run `openkoi init` or set an API key environment variable. |
| `SkillNotFound` | No | Check skill name. Run `openkoi status --verbose` to list available skills. |
| `Database` | No | Check disk space and file permissions. Run `openkoi doctor`. |
| `McpServer` | Depends | Check if the MCP server binary is installed and accessible. |
| `Other` | Depends | Catch-all for unexpected errors. Check logs with `OPENKOI_LOG_LEVEL=debug`. |

## Logging

OpenKoi uses the `tracing` crate for structured, leveled logging throughout the codebase.

### Setup

```rust
pub fn init_logging(level: &str) {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(level));

    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .compact()
        .init();
}
```

### Log Levels

| Level | What It Shows | When to Use |
|-------|--------------|-------------|
| `error` | Unrecoverable failures, panics, data corruption. | Always visible. |
| `warn` | Rate limits, provider fallbacks, degraded operation, permission issues. | Always visible. |
| `info` | Iteration progress, scores, costs, task completion summaries. | Default level. Shown in normal operation. |
| `debug` | API requests/responses (truncated), skill selection logic, recall results, config resolution. | Use `--verbose` flag or `OPENKOI_LOG_LEVEL=debug`. |
| `trace` | Full API payloads, token counts per message, cache hit/miss, embedding vectors. | Development only. Very verbose. |

### Setting the Log Level

```bash
# Via environment variable
OPENKOI_LOG_LEVEL=debug openkoi "Fix the bug"

# Via config file
# ~/.openkoi/config.toml
# [logging]
# level = "debug"
```

### Structured Fields

Logs include structured fields for filtering and analysis:

```rust
tracing::info!(
    iteration = i,
    score = eval.score,
    tokens = usage.total(),
    "iteration complete"
);

tracing::warn!(
    provider = %provider.id(),
    retry_after_ms = retry_after,
    "rate limited, falling back"
);
```

## Session Transcript Format

Every session produces a JSONL transcript at `~/.local/share/openkoi/sessions/<session-id>.jsonl`. Each line is a self-contained JSON event.

### Event Schema

```jsonl
{"ts":"2026-02-18T10:30:00Z","type":"task_start","description":"Add rate limiting","model":"claude-sonnet-4-5"}
{"ts":"2026-02-18T10:30:01Z","type":"recall","anti_patterns":1,"learnings":2,"tokens":450}
{"ts":"2026-02-18T10:30:04Z","type":"iteration","n":1,"score":0.73,"tokens":12400,"duration_ms":3200}
{"ts":"2026-02-18T10:30:07Z","type":"iteration","n":2,"score":0.89,"tokens":8100,"duration_ms":2800,"eval":"incremental"}
{"ts":"2026-02-18T10:30:07Z","type":"task_complete","iterations":2,"total_tokens":20900,"cost_usd":0.32}
```

### Event Types

| Type | Purpose | Key Fields |
|------|---------|------------|
| `task_start` | Marks the beginning of a task. | `description`, `model`, `iteration_config` |
| `recall` | Memory recall results. | `anti_patterns`, `learnings`, `similar_tasks`, `tokens` |
| `iteration` | One iteration cycle completed. | `n`, `score`, `tokens`, `duration_ms`, `eval` |
| `tool_call` | Agent invoked a tool (MCP or integration). | `server`, `tool`, `args`, `duration_ms` |
| `task_complete` | Task finished. | `iterations`, `total_tokens`, `cost_usd`, `final_score`, `decision` |
| `learning` | A learning was extracted. | `type` (heuristic/anti_pattern/preference), `content`, `confidence` |
| `error` | An error occurred. | `error_type`, `message`, `retriable` |

Transcripts are append-only and survive crashes. They are indexed into the memory system by the Historian for semantic search.

## Testing Strategy

OpenKoi follows a test pyramid with five categories, targeting 70% line/branch coverage.

### Test Pyramid

```
               +------------------+
               |   E2E (live)     |   Real API calls, real tools
               |    ~10 tests     |   OPENKOI_LIVE_TEST=1
               +--------+---------+
                        |
               +--------v---------+
               |   Integration    |   Multi-component, SQLite, MCP
               |    ~50 tests     |   In-process, mock providers
               +--------+---------+
                        |
               +--------v---------+
               |   Unit tests     |   Pure logic, no I/O
               |    ~300+ tests   |   Fast (<1s total)
               +------------------+
```

### Test Categories

| Category | Location | Runner | What It Tests |
|----------|----------|--------|---------------|
| **Unit** | `src/**/*.rs` (`#[cfg(test)]`) | `cargo test` | Pure functions: token budget math, decay calculations, eligibility checks, config parsing, frontmatter parsing. |
| **Integration** | `tests/` | `cargo test` | Orchestrator with mock providers, SQLite memory round-trips, skill loading from filesystem, MCP subprocess lifecycle. |
| **Snapshot** | `tests/` | `insta` | Prompt templates, CLI output format, evaluation reports, config serialization. Ensures output stability. |
| **Live** | `tests/live/` | `LIVE=1 cargo test` | Real API calls to Anthropic/OpenAI/Ollama. Real MCP servers. Gated by environment variable. |
| **Benchmark** | `benches/` | `cargo bench` (criterion) | Startup time, recall latency, context compression throughput. Performance regression detection. |

### Mocking Strategy

All provider and storage traits are mockable via `mockall`:

```rust
#[automock]
#[async_trait]
pub trait ModelProvider: Send + Sync {
    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse, ProviderError>;
    async fn chat_stream(&self, request: ChatRequest)
        -> Result<Pin<Box<dyn Stream<Item = Result<ChatChunk>>>>, ProviderError>;
    async fn embed(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>, ProviderError>;
}

// Integration test: mock provider + real SQLite
fn test_orchestrator() {
    let mut mock = MockModelProvider::new();
    mock.expect_chat()
        .returning(|_| Ok(ChatResponse { score: 0.85, .. }));
    let db = Database::in_memory().unwrap();
    let orch = Orchestrator::new(mock, db, default_config());
    // ...
}
```

### CI Pipeline

| Step | Command | Gate |
|------|---------|------|
| Format check | `cargo fmt --check` | Fail on unformatted code. |
| Lint | `cargo clippy` | Fail on warnings. |
| Test | `cargo test` | Unit + integration + snapshot. |
| Build | `cargo build --release` | Verify release build compiles. |
| Live tests | `LIVE=1 cargo test` | Nightly only (not on every PR). |
| Snapshot review | `cargo insta review` | Manual approval for snapshot changes. |

CI matrix: `ubuntu-latest`, `macos-latest`.

## Distribution

OpenKoi ships as a single static binary. No runtime dependencies, no package managers required (though several are supported for convenience).

### Build Targets

| Target | Triple | Notes |
|--------|--------|-------|
| Linux x86_64 | `x86_64-unknown-linux-musl` | Static binary, works on any Linux distro. |
| Linux ARM64 | `aarch64-unknown-linux-musl` | Raspberry Pi, AWS Graviton, Oracle Ampere. |
| macOS x86_64 | `x86_64-apple-darwin` | Intel Macs. |
| macOS ARM64 | `aarch64-apple-darwin` | Apple Silicon (M1/M2/M3/M4). |

### Distribution Channels

| Channel | Command | Notes |
|---------|---------|-------|
| **cargo install** | `cargo install openkoi` | Source build. Works on Linux and macOS with a Rust toolchain. |
| **Shell installer** | `curl -fsSL https://openkoi.ai/install.sh \| sh` | Detects OS/arch, downloads the correct binary. |
| **GitHub Releases** | Download from releases page | Pre-built binaries. SHA256 checksums included. |

### Release Pipeline

Releases are triggered by pushing a tag matching `vYYYY.M.D`. The pipeline handles:

1. Cross-compilation for all five build targets.
2. SHA256 checksum generation for every artifact.
3. GitHub Release creation with all binaries attached.
4. crates.io publication.
5. Shell installer manifest update.

### Self-Update

```bash
openkoi update              # Download and install the latest version
openkoi update --check      # Check for updates without installing
```

The update checker runs automatically on startup (max once per day) and shows a one-liner hint if the local version is outdated. No auto-update without explicit `openkoi update`.

## Performance

OpenKoi is designed to feel instant and stay lightweight.

| Metric | Target | Notes |
|--------|--------|-------|
| **Binary size** | ~15-25 MB | Statically linked (musl on Linux). Includes WASM runtime and all bundled skills. |
| **Startup time** | < 10 ms | CLI parses args and is ready to execute. No JIT warmup, no module resolution. |
| **Idle memory** | ~5 MB | When running as a daemon. Node.js idles at 50-100 MB for comparison. |
| **SQLite overhead** | Negligible | Bundled SQLite. No connection pooling needed for single-user local access. |
| **First-task latency** | Dominated by API call | Local overhead (recall, context building) is typically < 50ms. Network round-trip to the LLM provider is the bottleneck. |

These numbers come from Rust's zero-cost abstractions, ahead-of-time compilation, and the absence of a garbage collector or runtime interpreter.

## Versioning

OpenKoi uses **CalVer** (Calendar Versioning) in the format `YYYY.M.D`:

| Component | Meaning | Example |
|-----------|---------|---------|
| `YYYY` | Year | 2026 |
| `M` | Month (no leading zero) | 3 |
| `D` | Day (no leading zero) | 15 |

Full version example: `2026.3.15`

Pre-release versions append a suffix: `2026.3.15-beta.1`

This matches the convention used by OpenClaw and makes it immediately obvious when a release was published. There is no semver -- breaking changes are communicated through release notes and migration guides.

### Upgrade Behavior

When a new version is installed (via `openkoi update` or any package manager), the first startup:

1. Detects that the SQLite schema version is older than the binary expects.
2. Backs up the database if the pending migration is destructive.
3. Applies all pending migrations automatically.
4. Logs what changed.

```
$ openkoi self-update
Updating openkoi 2026.3.1 -> 2026.4.1...
Downloaded and verified binary.

Applying database migrations:
  Migration 5: add_skill_effectiveness_index
  Migration 6: add_session_tags

Ready.
```

No manual intervention is required for database upgrades. Config files are forward-compatible (new keys get defaults, unknown keys are ignored).

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Single binary** | Zero runtime dependencies. Download and run. No version conflicts. |
| **SQLite for everything** | One database file for structured data, vectors, and FTS. No external database server. |
| **TOML over YAML** | Rust-idiomatic. No ambiguous typing. Better for configuration files. |
| **Three plugin tiers** | MCP (subprocess, any language), WASM (sandboxed, high-performance), Rhai (scripting, quick hooks). Each tier serves a different need. |
| **Evaluator skills as SKILL.md** | Users can add domain-specific evaluators without touching Rust code. Same format as task skills. |
| **Token budgeting everywhere** | Every phase (recall, execution, evaluation) operates within a budget. Prevents runaway cost. |
| **Background learning** | Learning extraction runs in a `tokio::spawn` after the task completes. Never blocks the user. |
| **CalVer** | Makes release dates immediately obvious. No semver debates. |
