# The Skill System

OpenKoi's skill system is the mechanism by which the agent knows *how* to do things. Skills are plain Markdown files with YAML frontmatter — portable, version-controllable, and compatible with the [OpenClaw](https://openclaw.org) `.SKILL.md` specification.

## Skill Format

A skill is a `.SKILL.md` file:

```markdown
---
name: jwt-auth-migration
description: Migrate authentication from session-based to JWT tokens
kind: task
metadata:
  os: [linux, macos]
  requires_binaries: [openssl]
  requires_env: []
  category: security
---

## Context
This skill handles migration from session-based auth to JWT...

## Steps
1. Identify current session management code
2. Generate JWT utility module
3. Replace session checks with token validation
4. Update tests

## Constraints
- Preserve existing API contracts
- Maintain backward compatibility for 2 versions
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier (kebab-case) |
| `description` | Yes | One-line summary for the system prompt |
| `kind` | No | `task` (default) or `evaluator` |
| `metadata.os` | No | Target OS list: `linux`, `macos` |
| `metadata.requires_binaries` | No | Binaries that must be on `$PATH` |
| `metadata.requires_env` | No | Environment variables that must be set |
| `metadata.category` | No | Grouping label for organization |
| `metadata.trigger` | No | Schedule or event trigger |

## Two Kinds of Skills

| Kind | Folder | Purpose | Loaded By |
|------|--------|---------|-----------|
| **task** | `skills/` | Instructions for executing tasks | Orchestrator |
| **evaluator** | `evaluators/` | Rubrics for evaluating output quality | EvaluatorFramework |

Task skills tell the agent *what to do*. Evaluator skills tell the agent *how to judge what it did*. Both use the same `.SKILL.md` format.

## Six Skill Sources

Skills are loaded from multiple locations with a clear precedence order (lowest to highest):

| Priority | Source | Location | Description |
|----------|--------|----------|-------------|
| 1 | `OpenKoiBundled` | Compiled into binary | Ships with OpenKoi via `include_str!` |
| 2 | `OpenKoiManaged` | `~/.openkoi/skills/managed/` | Installed via `openkoi learn --install` |
| 3 | `OpenClawBundled` | OpenClaw registry | From OpenClaw if present on system |
| 4 | `WorkspaceProject` | `.agents/skills/` | Project-local skills in your repo |
| 5 | `UserGlobal` | `~/.openkoi/skills/user/` | Your personal custom skills |
| 6 | `PatternProposed` | `~/.openkoi/skills/proposed/` | Auto-generated, requires explicit approval |

Higher-priority sources override lower ones when skill names collide. This means your custom skills always take precedence over bundled defaults.

## Progressive Loading (Three Levels)

Skills use a three-level progressive disclosure system to minimize token usage:

### Level 1 — Always Loaded
The skill's `name` and `description` are always included in the system prompt. Cost: ~100 tokens per skill. This lets the agent know what skills exist without loading their full content.

### Level 2 — On Activation
When a skill is selected for a task, its full Markdown body is loaded into context. Cost: ~2,000 tokens. This provides the detailed instructions, steps, and constraints.

### Level 3 — On Demand
Associated `scripts/` and `references/` directories are loaded only when the agent explicitly requests them. Cost: varies. Used for large reference materials or executable scripts.

This three-level approach means having hundreds of registered skills costs only a few thousand tokens at Level 1, with full detail loaded only when needed.

## Eligibility Checks

Before a skill is loaded, OpenKoi validates:

1. **OS match** — `metadata.os` matches current platform (skipped if unset)
2. **Binary availability** — All `requires_binaries` found via `which` (skipped if unset)
3. **Environment variables** — All `requires_env` are set (skipped if unset)
4. **Approval status** — `PatternProposed` skills require explicit user approval

If any check fails, the skill is silently excluded from the available set.

## Self-Learning (Pattern Mining)

OpenKoi observes your usage patterns and automatically proposes new skills:

1. **EventLogger** records every task execution — prompts, tool calls, evaluations, outcomes
2. **PatternMiner** periodically analyzes the event log for recurring workflows
3. **SkillProposer** generates a `.SKILL.md` file for detected patterns
4. Proposed skills land in `~/.openkoi/skills/proposed/` with `PatternProposed` source

### Reviewing Proposals

```bash
# List proposed skills
openkoi learn

# Approve a proposed skill (moves to managed)
openkoi learn --approve jwt-auth-migration

# Reject a proposed skill
openkoi learn --reject jwt-auth-migration

# Install a skill from the registry
openkoi learn --install skill-name
```

Proposed skills are never used automatically — they always require your explicit approval before being included in the active skill set.

## Writing Custom Skills

### Task Skill Example

Create `~/.openkoi/skills/user/my-deploy.SKILL.md`:

```markdown
---
name: deploy-staging
description: Deploy current branch to staging environment
kind: task
metadata:
  requires_binaries: [docker, kubectl]
  requires_env: [KUBECONFIG, DOCKER_REGISTRY]
  category: devops
---

## Steps
1. Build Docker image from current directory
2. Tag with current git SHA
3. Push to $DOCKER_REGISTRY
4. Apply k8s manifests from deploy/ directory
5. Wait for rollout to complete
6. Run smoke tests against staging URL

## Constraints
- Never deploy uncommitted changes
- Always run tests before building
- Rollback automatically if smoke tests fail
```

### Evaluator Skill Example

Create `~/.openkoi/evaluators/user/security-review.SKILL.md`:

```markdown
---
name: security-review
description: Check output for common security vulnerabilities
kind: evaluator
metadata:
  category: security
---

## Rubric

### Critical (fail if any present)
- Hardcoded secrets or API keys
- SQL injection vulnerabilities
- Unvalidated user input in shell commands

### Warning (deduct points)
- Missing input validation
- Overly permissive file permissions
- HTTP instead of HTTPS

### Good Practice (bonus points)
- Input sanitization
- Principle of least privilege
- Error messages that don't leak internals
```

## Project-Local Skills

For team-shared skills, place them in your repository:

```
your-project/
├── .agents/
│   ├── skills/
│   │   └── team-conventions.SKILL.md
│   └── evaluators/
│       └── code-style.SKILL.md
└── src/
```

These are automatically detected when OpenKoi runs from within the project directory.

## WASM Plugins

For tasks requiring high performance or absolute isolation, OpenKoi supports a WASM plugin system alongside Markdown skills. See [Plugins](/guide/plugins) for details on the three-tier plugin architecture (MCP, WASM, Rhai).

## Next Steps

- [Pattern Mining](/guide/pattern-mining) — How OpenKoi discovers and proposes skills
- [Evaluator System](/guide/evaluator-system) — How evaluator skills work
- [Plugins](/guide/plugins) — WASM, Rhai, and MCP plugin systems
