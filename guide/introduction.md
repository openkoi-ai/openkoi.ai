# Introduction

OpenKoi is a high-performance, self-iterating AI agent system. Unlike traditional agents that "fire and forget," OpenKoi follows a rigorous **Plan-Execute-Evaluate-Refine** cycle.

## Design Principles

| Principle | Rationale |
|-----------|-----------|
| **Single binary** | `cargo install openkoi`. No Node, no Python, no runtime deps (~20MB binary). |
| **Token-frugal** | Context compression, evaluation caching, and diff-patch logic to save cost. |
| **Zero-config** | `openkoi "task"` works immediately by detecting API keys from your environment. |
| **Local-first** | All data stays on-device in SQLite and standard files. No cloud requirement. |
| **Iterate to quality** | The agent is its own reviewer. It only stops when the task meets your standards. |

## Why Rust?

OpenKoi is built with Rust to provide a premium CLI experience:
- **Startup**: < 10ms (TypeScript CLI tools often take 200ms+).
- **Memory**: ~5MB idle (Node.js idles at 50-100MB).
- **Correctness**: Memory safety and strict typing for reliable background operations.

## The Soul System
OpenKoi includes an optional "Soul System" that tracks personality traits, preferences, and interaction styles to provide a more personalized agent experience over time.
