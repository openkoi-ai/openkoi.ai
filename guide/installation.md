# Installation & Setup

OpenKoi ships as a single static binary with zero runtime dependencies. No Node.js, no Python, no Docker. Install it and start working in under 60 seconds.

## Installation Methods

### Cargo (Source Build)

```bash
cargo install openkoi
```

Requires a Rust toolchain (1.75+). Builds from source on crates.io.

### Shell Installer

Auto-detects your platform and downloads the correct pre-built binary:

```bash
curl -fsSL https://openkoi.ai/install.sh | sh
```

Supports Linux (x86_64, ARM64) and macOS (Intel, Apple Silicon).

## Quick Start (Zero Config)

OpenKoi is designed for zero-config startup. If you have any supported API key in your environment, it just works:

```bash
# Run a task immediately
openkoi "Refactor the auth logic to use JWT"

# Start an interactive session
openkoi chat

# Check what OpenKoi detected
openkoi status
```

No config file needed. No setup wizard. No account creation.

## Credential Discovery

On startup, OpenKoi automatically scans for credentials in this priority order:

### 1. Environment Variables

The fastest path. Set any of these:

```bash
# Anthropic (highest default priority)
export ANTHROPIC_API_KEY="sk-ant-..."

# OpenAI
export OPENAI_API_KEY="sk-..."

# Google
export GOOGLE_API_KEY="AIza..."

# AWS Bedrock
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"              # optional, defaults to us-east-1
export BEDROCK_DEFAULT_MODEL="..."         # optional

# OpenAI-compatible endpoints
export OPENAI_COMPAT_API_KEY="..."
export OPENAI_COMPAT_BASE_URL="https://your-endpoint.com/v1"
```

### 2. OAuth Store

If you've previously run `openkoi connect`, tokens are loaded from `~/.openkoi/auth.json`:

- **GitHub Copilot** — via `openkoi connect copilot`
- **ChatGPT Plus/Pro** — via `openkoi connect chatgpt`

Tokens are refreshed automatically before expiry. No API key needed — uses your existing subscription.

### 3. External CLI Credentials

OpenKoi auto-imports keys from existing tools you already use:

- **Claude CLI** — Reads credentials from `~/.claude/` config
- **OpenAI Codex** — Reads credentials from OpenAI CLI config
- Other tools that store API keys in standard locations

### 4. Local Probes

OpenKoi probes for locally running model servers:

- **Ollama** — Checks `localhost:11434` for a running instance
- Detected automatically, no configuration needed

### 5. Interactive Picker

If no credentials are found anywhere, OpenKoi shows a minimal interactive picker:

```
No API keys detected. Choose a provider to set up:

  1. GitHub Copilot (login with your subscription)
  2. ChatGPT Plus/Pro (login with your subscription)
  3. Anthropic (API key)
  4. OpenAI (API key)
  5. Google (API key)
  6. Ollama (local, free)

Enter choice:
```

Options 1 and 2 use device-code OAuth — no API key needed. See [Providers](/guide/providers) for details on each provider.

## Default Model Selection

When multiple providers are available, OpenKoi selects the default model in this priority order:

1. **Claude Sonnet 4.5** (Anthropic) — Best overall quality
2. **GPT-5.2** (OpenAI)
3. **Gemini 2.5 Pro** (Google)
4. **Claude Sonnet 4.5** (Bedrock) — Same model via AWS
5. **llama3.3** (Ollama) — Free, local

You can override this in `config.toml` or per-task with `--model`.

## Manual Configuration

While not required, you can customize OpenKoi via `~/.openkoi/config.toml`:

```toml
[provider]
default_model = "claude-sonnet-4-5-20250514"

[provider.roles]
executor = "claude-sonnet-4-5-20250514"
evaluator = "gpt-5.2"
planner = "claude-sonnet-4-5-20250514"
embedder = "text-embedding-3-small"

[iteration]
max_iterations = 5
confidence_threshold = 0.85

[soul]
enabled = true
formality = 0.7
verbosity = 0.4
```

See [Configuration Reference](/guide/configuration) for the full list of options.

## Verifying Installation

After installing, verify everything works:

```bash
# Check version
openkoi --version

# Run diagnostics
openkoi doctor
```

The `doctor` command checks:
- Binary integrity
- Detected providers and API keys
- SQLite database health
- File permissions on credential stores
- MCP server connectivity
- Plugin system status

## Self-Update

OpenKoi can update itself:

```bash
# Check for updates
openkoi update --check

# Update to latest version
openkoi update
```

OpenKoi checks for updates once per day on startup. If a new version is available, it shows a one-line hint — it never auto-updates.

## Versioning

OpenKoi uses **CalVer** format: `YYYY.M.D` (e.g., `2026.2.18`). Pre-releases use `YYYY.M.D-beta.N`. 

## Directory Structure

After first run, OpenKoi creates:

```
~/.openkoi/
├── config.toml          # User configuration
├── auth.json            # OAuth tokens (GitHub Copilot, ChatGPT)
├── openkoi.db           # SQLite database (memory, sessions, learnings)
├── credentials/
│   └── <provider>.key   # Saved API keys (chmod 600)
├── skills/
│   ├── user/            # Your custom skills
│   └── proposed/        # Auto-proposed skills (need approval)
├── evaluators/
│   └── user/            # Your custom evaluators
├── plugins/
│   ├── wasm/            # WASM plugin binaries
│   └── rhai/            # Rhai script plugins
└── soul.toml            # Soul personality state
```

## Next Steps

- [CLI Reference](/guide/cli-reference) — All commands, flags, and REPL commands
- [Providers](/guide/providers) — Configure and assign models per role
- [Configuration](/guide/configuration) — Full `config.toml` reference
