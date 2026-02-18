# Installation & Setup

OpenKoi is zero-config by design. It ships as a single static binary. 

## Install via Cargo

```bash
cargo install openkoi
```

## Quick Start (Zero Config)

OpenKoi automatically discovers your API keys from existing tools and environment variables. You don't need a config file to start:

```bash
openkoi "Refactor the auth logic to use JWT"
```

## Credential Discovery

On first run, OpenKoi scans for existing credentials in this priority order:
1. **Environment Variables**: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.
2. **External CLI Credentials**: Auto-imports keys from the Claude CLI, OpenAI Codex, etc.
3. **Local Probes**: Detects if an **Ollama** instance is running at `localhost:11434`.

If no keys are found, a minimal interactive picker will help you set one up in seconds.

## Manual Configuration

While not required, you can manage your preferences in `~/.openkoi/config.toml`.
