# Think (EFaaS Pipeline)

`openkoi think` is the flagship command — the full Executive Function as a Service pipeline. Unlike the default `openkoi [task]` which runs the iteration engine directly, `think` routes through the complete cognitive stack: Sovereign Directive, Parliament deliberation, execution, and learning.

The difference is philosophical: `run` implies execution. `think` implies **deliberation before execution**. The agent thinks, then acts — and you can see the thinking.

## Usage

```bash
# Basic: think about a task
openkoi think "Refactor the auth module to use JWT tokens"

# Simulate: show deliberation without executing
openkoi think "Send the weekly report email" --simulate

# Verbose: show full parliamentary reasoning
openkoi think "Delete the staging database" --verbose
```

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--simulate` | `false` | Simulate only — show deliberation and future scenarios without executing any actions. |
| `--verbose` | `false` | Show full parliamentary deliberation with agency reasoning, not just verdicts. |

## The Cognitive Pipeline

Every `think` invocation passes through four stages:

```
  1. SOVEREIGN DIRECTIVE
     Soul identity + Value Model frame the task

  2. PARLIAMENT
     Five agencies deliberate: Guardian, Economist, Empath, Scholar, Strategist
     Each votes: APPROVE, APPROVE+, ABSTAIN, or BLOCK

  3. EXECUTION
     Plan → Execute → Evaluate → Refine loop (same iteration engine as openkoi [task])

  4. LEARNING
     Patterns, insights, and confidence updates are extracted and persisted
```

### Stage 1: Sovereign Directive

The soul (loaded from SOUL.md) generates a directive that frames the task. This includes your identity, values, and any constraints the agent has learned about you:

```
╭─────────────────────────────────────────────────────────────╮
│ SOVEREIGN DIRECTIVE                                          │
│                                                              │
│ "You are a startup founder raising Series A. You value       │
│  directness. You are anxious about this investor. The Good   │
│  = confident, professional, concise. Max 150 words."         │
╰─────────────────────────────────────────────────────────────╯
```

The directive is generated from the soul, the Value Model (learned preferences), and the Trajectory Model (understanding of your current goals). See [Soul System](/guide/soul-system) for details.

### Stage 2: Parliament

Five agencies evaluate the task independently, then the Strategist synthesizes a final verdict:

| Agency | Role | What It Checks |
|--------|------|----------------|
| **Guardian** | Safety & reversibility | Can this be undone? What's the blast radius? |
| **Economist** | Cost & efficiency | How many tokens? What's the dollar cost? |
| **Empath** | Human impact | How will the recipient feel? Is the tone right? |
| **Scholar** | Factual accuracy | Are the facts correct? Is there enough evidence? |
| **Strategist** | Final synthesis | Weighs all agencies, decides proceed/block/escalate |

Each agency votes independently:

- **APPROVE** — Proceed as planned
- **APPROVE+** — Proceed with a caveat (e.g., "add a reassurance note")
- **ABSTAIN** — No strong opinion
- **BLOCK** — Do not proceed (Guardian can unilaterally block)

```
╭─────────────────────────────────────────────────────────────╮
│ PARLIAMENT                                                   │
│                                                              │
│  Guardian   APPROVE     — Draft mode, reversible             │
│  Economist  APPROVE     — ~$0.01, one inference              │
│  Empath     APPROVE+    — "Add a reassurance note"           │
│  Scholar    APPROVE+    — "Verify investor name"             │
│  Strategist PROCEED     — with Empath & Scholar caveats      │
╰─────────────────────────────────────────────────────────────╯
```

Inspect past deliberations with `openkoi mind parliament` and dissent records with `openkoi mind dissent`. See [Mind](/guide/mind) for details.

### Stage 3: Execution

If the Parliament approves, the standard iteration engine runs: Plan → Execute → Evaluate → Refine. This is the same engine as `openkoi [task]`, documented in [Iteration Engine](/guide/iteration-engine).

### Stage 4: Learning

After execution, the system extracts learnings:

```
╭─────────────────────────────────────────────────────────────╮
│ LEARNED                                                      │
│                                                              │
│  • Pattern: "Investor emails on Tuesday mornings"            │
│  • Insight: "User prefers concise investor comms"            │
│  • Confidence update: investor-email-style 0.5 → 0.65       │
╰─────────────────────────────────────────────────────────────╯
```

Review learnings with `openkoi reflect today`. See [Memory & Learning](/guide/memory-learning) and [Reflect](/guide/reflect) for details.

## Simulation Mode

The `--simulate` flag enables "chess mode" — the agent simulates multiple futures without taking any action:

```
$ openkoi think "Send the weekly report email" --simulate

╭─────────────────────────────────────────────────────────────╮
│ SIMULATION ONLY (no actions will be taken)                    │
│                                                              │
│ Simulated futures:                                           │
│                                                              │
│  Future A: Send now (8:55 AM)                                │
│    → 3 recipients in CET will see it at 1:55 AM             │
│    → Likely response rate: LOW (out of hours)                │
│    → Risk: "Looks like you forgot timezone"                  │
│                                                              │
│  Future B: Schedule for 9:00 AM CET (3:00 PM your time)     │
│    → All recipients in business hours                        │
│    → Likely response rate: HIGH                              │
│    → Risk: NONE                                              │
│                                                              │
│  Future C: Draft + morning reminder at 9 AM tomorrow         │
│    → Allows you to review tomorrow with fresh eyes           │
│    → Likely response rate: HIGH                              │
│    → Risk: Delay                                             │
│                                                              │
│ Recommendation: Future B (schedule for CET morning)          │
│    Champion: Empath ("don't look careless about timezone")   │
│    Dissent:  Economist ("just send it now, saves time")      │
╰─────────────────────────────────────────────────────────────╯

No actions taken. Run without --simulate to proceed.
```

Use `--simulate` before any high-stakes or irreversible action. It costs a fraction of actual execution and gives you a preview of the agent's reasoning.

## Guardian Blocks

When the Guardian agency detects an irreversible or high-risk action, it unilaterally blocks execution:

```
$ openkoi think "Delete the staging database" --verbose

╭─────────────────────────────────────────────────────────────╮
│ GUARDIAN — BLOCK                                             │
│                                                              │
│ Reversibility: NONE — database deletion is permanent         │
│ Blast radius: HIGH — all staging data lost                   │
│ Permission level required: ELEVATED                          │
│                                                              │
│ "I cannot approve this without explicit human confirmation.  │
│  History shows this database was last referenced 2 hours     │
│  ago by the test suite."                                     │
╰─────────────────────────────────────────────────────────────╯

╭─────────────────────────────────────────────────────────────╮
│ ESCALATION                                                   │
│                                                              │
│ The Guardian has blocked this action.                        │
│ The Sovereign Directive does not override safety blocks.     │
│                                                              │
│ To proceed, confirm with:                                    │
│   openkoi think "Delete the staging database" --override     │
│                                                              │
│ Or investigate first:                                        │
│   openkoi world tools staging-db                             │
╰─────────────────────────────────────────────────────────────╯
```

The Sovereign Directive can never override a Guardian block. This is by design — safety trumps all other priorities.

## think vs. Default Task

| | `openkoi [task]` | `openkoi think [task]` |
|---|---|---|
| Sovereign Directive | Not generated | Generated from soul + value model |
| Parliament | Skipped | Full deliberation |
| Iteration engine | Yes | Yes (after Parliament approves) |
| Learning extraction | Basic | Full (patterns, insights, confidence updates) |
| Output | Result only | Deliberation stream + result |
| Use when | Quick tasks, scripting | Important decisions, high-stakes work |

Both commands use the same iteration engine under the hood. `think` adds the cognitive layers on top.

## Related Commands

- [`openkoi soul`](/guide/soul-system) — The Sovereign identity that generates directives
- [`openkoi mind`](/guide/mind) — Inspect Parliament deliberations and agency calibration
- [`openkoi world`](/guide/world) — The World Model that informs deliberation
- [`openkoi reflect`](/guide/reflect) — Review decisions and self-assessment
- [`openkoi trust`](/guide/trust) — Trust levels influence Guardian behavior
