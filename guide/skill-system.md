# The Skill System

OpenKoi is fully **OpenClaw-Compatible**. It uses the `.SKILL.md` format to define capabilities, allowing you to share and reuse skills across different agent ecosystems.

## Core Features

### Model-Agnostic Skills
Write skills once and use them with any provider—be it Claude, GPT, or a local Llama model via Ollama. 

### Local-First Registry
Your custom logic stays on your machine in `~/.openkoi/skills/`. You have full control over what your agent can and cannot do.

### Self-Learning (Pattern Mining)
OpenKoi observes your usage patterns over time. If it detects a recurring workflow, it will automatically propose a new skill to automate that task. You can review and approve these suggestions using the `openkoi learn` command.

## WASM Plugins
For tasks requiring high performance or absolute isolation, OpenKoi supports a WASM plugin system, allowing you to extend the agent with pre-compiled modules.
