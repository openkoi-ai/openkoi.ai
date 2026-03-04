# Introduction

AI coding tools today generate a first draft and stop. You review it, fix it, re-prompt corrections, and iterate — becoming the AI's QA department on top of being the developer. OpenKoi is different.

OpenKoi is **Executive Function as a Service** (EFaaS). It doesn't just execute — it **deliberates** before acting. A Sovereign Directive frames the task, a Parliament of five agencies evaluates risk, cost, and strategy, and the agent iterates until results meet your quality standards. You see the thinking, not just the output.

```bash
cargo install openkoi
openkoi think "Refactor the auth module to use JWT tokens"
```

That's it. OpenKoi detects your API keys from the environment, picks the best available model, runs the task through its cognitive pipeline, and iterates. No config file needed. No setup wizard.

## Three Steps

| Step | What happens |
|------|--------------|
| **1. Install** | One command. Single static binary, ~20MB. No Python, no Node, no Docker. |
| **2. Think** | Describe what you want. OpenKoi deliberates: Sovereign Directive frames the task, Parliament evaluates risk, then execution begins. |
| **3. Ship** | OpenKoi iterates — plan, execute, evaluate, refine — until the code passes its own quality review. |

## What Changes

| Before | After |
|--------|-------|
| `agent run "do X"` → output | `openkoi think "do X"` → deliberation → parliament → output |
| You see the result | You see **how it decided**, not just what it decided |
| You manually review every AI output | OpenKoi evaluates its own work against rubrics |
| You re-prompt corrections 3-5 times | Automatic iteration, stops when quality threshold is met |
| Learnings vanish between sessions | Patterns persist in local SQLite; skills improve over time |
| Memory is hidden | World model is inspectable: `openkoi world`, `openkoi mind` |
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

OpenKoi's architecture centers on a **cognitive pipeline** — from Sovereign identity through Parliamentary deliberation to execution:

```
                    ┌─────────────────┐
                    │   Sovereign     │  ← Soul (SOUL.md + Value Model + Trajectory)
                    │   Directive     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Parliament    │  ← Mind (Guardian, Economist, Empath, Scholar, Strategist)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Orchestrator   │
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
    └────┬────┘
         │
    ┌────▼────┐
    │  World  │ ← World Model (Tool Atlas + Domain Atlas + Human Atlas)
    │  Model  │
    └─────────┘
```

**Sovereign Directive** frames every task with the soul's identity, values, and constraints. **Parliament** — five agencies (Guardian, Economist, Empath, Scholar, Strategist) — deliberates on risk, cost, and strategy before execution begins. **Orchestrator** runs the Plan-Execute-Evaluate-Refine loop. **World Model** tracks tool reliability, domain knowledge, and human preferences, updated by every interaction.

Inspect any layer from the CLI:
- `openkoi soul show` — see the Sovereign identity
- `openkoi mind parliament` — see the last deliberation
- `openkoi world tools` — see tool reliability and failure modes
- `openkoi reflect today` — see today's decisions and self-assessment
- `openkoi trust show` — see delegation levels per domain

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

OpenKoi includes a **Soul System** that tracks personality traits, preferences, and interaction styles. The soul is the Sovereign layer — it frames every task with identity, values, and constraints.

- **Personality axes** — Formality, verbosity, emoji usage, technical depth
- **Evolution** — The soul evolves based on your feedback and interaction patterns
- **Customization** — Override any axis in `config.toml` or per-session
- **Persistence** — Soul state is stored locally and never leaves your machine
- **CLI access** — Inspect with `openkoi soul show`, evolve with `openkoi soul evolve`

The soul is entirely optional — OpenKoi works fine without it. But for users who want a more personalized experience, it provides a consistent agent personality that improves over time. See the full [Soul System](/guide/soul-system) documentation.

## What OpenKoi Is Not

- **Not a chatbot** — It's a task-execution engine that happens to have a chat mode
- **Not cloud-dependent** — All data is local. Cloud providers are used only for model inference
- **Not locked to one model** — Switch providers freely; assign different models to different roles
- **Not a framework** — It's a complete, ready-to-use tool. No code required to get started

## Next Steps

- [Installation & Setup](/guide/installation) — Get running in 60 seconds
- [CLI Reference](/guide/cli-reference) — All commands and flags
- [Think (EFaaS Pipeline)](/guide/think) — The flagship cognitive command
- [Soul System](/guide/soul-system) — The Sovereign identity layer
- [Configuration](/guide/configuration) — Customize behavior via `config.toml`
- [Architecture Deep Dive](/guide/architecture) — Full module layout and data flow
