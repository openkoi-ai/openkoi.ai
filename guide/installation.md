# Installation & Setup

OpenKoi is zero-config by design. It ships as a single static binary. You can install it via Cargo or download it directly from GitHub.

## Install via Cargo

```bash
cargo install openkoi
```

## Quick Start

OpenKoi automatically discovers your API keys. Just run your first task:

```bash
openkoi "Refactor the auth logic to use JWT"
```

It will scan for `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or even local **Ollama** instances to find the best available model.

## Setup Requirements

- **Rust**: Recommended for installation via Cargo.
- **API Keys**: While not strictly required for Ollama, you'll need them for cloud models.
