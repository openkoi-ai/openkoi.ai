# Introduction

AI coding tools today generate a first draft and stop. You review it, fix it, re-prompt corrections, and iterate — becoming the AI's QA department on top of being the developer. OpenKoi is different.

OpenKoi follows a rigorous **Plan-Execute-Evaluate-Refine** cycle. It reviews its own output using domain-specific rubrics, identifies what needs improvement, and iterates — until results meet your quality standards. You describe the task. OpenKoi does the iteration.

```bash
cargo install openkoi
openkoi "Refactor the auth module to use JWT tokens"
```

That's it. OpenKoi detects your API keys from the environment, picks the best available model, infers the task type, and starts iterating. No config file needed. No setup wizard. Max two interactions before your first result.

## Three Steps

| Step | What happens |
|------|--------------|
| **1. Install** | One command. Single static binary, ~20MB. No Python, no Node, no Docker. |
| **2. Run** | Describe what you want. OpenKoi finds your API keys from env vars, existing CLI tools, and local model servers automatically. |
| **3. Ship** | OpenKoi iterates — plan, execute, evaluate, refine — until the code passes its own quality review. |

## What Changes

| Before | After |
|--------|-------|
| You manually review every AI output | OpenKoi evaluates its own work against rubrics |
| You re-prompt corrections 3–5 times | Automatic iteration, stops when quality threshold is met |
| Learnings vanish between sessions | Patterns persist in local SQLite; skills improve over time |
| Locked to one model provider | Switch with a flag; assign different models per role |
| Your data lives in someone else's cloud | Everything stays on your machine; export anytime |

## Core Design Principles

| Principle | What It Means |
|-----------|---------------|
| **Single binary** | `cargo install openkoi` or download one file. ~20MB static binary, zero runtime dependencies. |
| **Token-frugal** | Context compression, evaluation caching, diff-patch instead of full regeneration. Saves cost without sacrificing quality. |
| **Zero-config** | `openkoi "task"` works immediately. Detects API keys from env vars and existing CLI tools. |
| **Local-first** | All data stays on your machine — SQLite database, filesystem skills, local config. No cloud requirement. |
| **Model-agnostic** | Anthropic, OpenAI, Google, Ollama, AWS Bedrock, or any OpenAI-compatible endpoint. Assign different models per role. |
| **Learn from use** | Observes your daily patterns, extracts recurring workflows, and proposes new skills to automate them. |
| **Iterate to quality** | The agent is its own reviewer. It only stops when the task passes evaluation — but knows when to stop early. |
| **Extensible** | WASM plugins for isolation, Rhai scripts for quick customization, MCP for external tools. |

## Why Rust?

OpenKoi is written in Rust to deliver a CLI experience that respects your time and resources:

| Metric | OpenKoi (Rust) | Typical TS/Python CLI |
|--------|---------------|----------------------|
| **Startup time** | < 10ms | 200–500ms |
| **Idle memory** | ~5MB | 50–100MB |
| **Binary size** | ~15–25MB | 100MB+ with runtime |
| **Concurrency** | Tokio async, zero-cost | Event loop or GIL-bound |
| **Safety** | Memory-safe, strict typing | Runtime exceptions |

These numbers matter when the agent runs as a background daemon, processes long-running tasks, or operates on resource-constrained machines.

## Architecture Overview

OpenKoi's architecture centers on an **Orchestrator** that coordinates all subsystems:

```
                    ┌─────────────────┐
                    │   Orchestrator  │
                    └────────┬────────┘
         ┌──────────┬───────┼───────┬──────────┐
         ▼          ▼       ▼       ▼          ▼
    ┌─────────┐ ┌───────┐ ┌─────┐ ┌────────┐ ┌──────────┐
    │Executor │ │Evalua-│ │Learn│ │Pattern │ │App       │
    │         │ │tor    │ │er   │ │Miner   │ │Integra-  │
    └────┬────┘ └───────┘ └─────┘ └────────┘ │tions     │
         │                                     └──────────┘
    ┌────▼────┐
    │  Tools  │ ← MCP subprocesses, WASM, Rhai
    └─────────┘
```

**Executor** carries out tasks by calling model providers and invoking tools. **Evaluator** judges the output against rubrics and decides whether another iteration is needed. **Learner** persists successful patterns into memory. **Pattern Miner** analyzes usage over time and proposes new skills. **App Integrations** connect to Slack, GitHub, Jira, and 7 other services.

Underneath, OpenKoi uses:
- **SQLite** for persistent memory, sessions, and learnings
- **sqlite-vec** for vector similarity search on embeddings
- **MCP** (Model Context Protocol) for safe tool execution
- **Skill Registry** for loading `.SKILL.md` files at multiple precedence levels

## The Iteration Engine

The core loop that makes OpenKoi different from one-shot agents:

1. **Plan** — Analyze the task, select relevant skills and tools, estimate iteration count
2. **Execute** — Run the plan using the assigned Executor model and available tools
3. **Evaluate** — Score the output against bundled and custom rubrics
4. **Refine** — If the score is below threshold, feed evaluation feedback back and iterate

The engine is token-aware: it compresses context between iterations, caches evaluation results, and uses diff-patch logic to avoid regenerating entire outputs. It also knows when to stop early — if the evaluator is confident the output is good, it won't waste tokens on unnecessary iterations.

Default iteration limit is 3, configurable per task or globally.

## The Soul System

OpenKoi includes an optional **Soul System** that tracks personality traits, preferences, and interaction styles. Over time, the agent adapts to your communication patterns:

- **Personality axes** — Formality, verbosity, emoji usage, technical depth
- **Evolution** — The soul evolves based on your feedback and interaction patterns
- **Customization** — Override any axis in `config.toml` or per-session
- **Persistence** — Soul state is stored locally and never leaves your machine

The soul is entirely optional — OpenKoi works fine without it. But for users who want a more personalized experience, it provides a consistent agent personality that improves over time.

## What OpenKoi Is Not

- **Not a chatbot** — It's a task-execution engine that happens to have a chat mode
- **Not cloud-dependent** — All data is local. Cloud providers are used only for model inference
- **Not locked to one model** — Switch providers freely; assign different models to different roles
- **Not a framework** — It's a complete, ready-to-use tool. No code required to get started

## Next Steps

- [Installation & Setup](/guide/installation) — Get running in 60 seconds
- [CLI Reference](/guide/cli-reference) — All commands and flags
- [Configuration](/guide/configuration) — Customize behavior via `config.toml`
- [Architecture Deep Dive](/guide/architecture) — Full module layout and data flow
