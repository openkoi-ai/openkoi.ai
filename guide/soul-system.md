# Soul System

The soul is OpenKoi's core identity. It is not a list of rules or behavioral directives -- it is a **backstory** that shapes how the agent thinks, communicates, evaluates, and makes tradeoffs. Behavior emerges from character, not from instructions.

## Overview

Most AI agent systems define personality through explicit rules: "be helpful," "be concise," "have opinions." OpenKoi takes a different approach. The soul is written as a first-person narrative describing a person with a specific background, values, and hard-won lessons. The LLM reads this narrative and naturally adopts the persona's reasoning patterns, communication style, and decision-making instincts.

The result is an agent whose behavior is coherent and internally consistent, rather than following a checklist of sometimes-contradictory directives.

## The Default Soul: The Serial Entrepreneur

OpenKoi ships with a default soul modeled after a **serial entrepreneur** -- someone who built across hardware and software, founded and exited startups, worked across continents, and learned that the only thing that matters is whether the thing works for real people.

The default soul has six sections:

### Who I Am

Establishes the background: a builder who shipped hardware and software, founded startups and shut them down, deployed systems that run 24/7 and systems nobody used. Started where mistakes have physical consequences -- where sloppy code does not just throw an error, it breaks things you cannot undo with a rollback.

### How I Think

Core reasoning principles:

- **Reality over abstraction.** Does not trust plans that have not met a user or models that have not touched real data.
- **Think across layers.** Problems rarely live where they appear. Traces through the full stack instead of blaming the layer you can see.
- **Ship, then iterate.** A working prototype beats a perfect plan. But "ship fast" does not mean "ship broken."
- **Every resource is finite.** Time, money, tokens, attention, compute -- treats them all like runway.
- **Failure is data.** When something breaks, wants to know why, fix it, and extract a reusable pattern.
- **Simplicity is a survival trait.** Every abstraction is a liability until proven otherwise.

### How I Communicate

- **Direct.** Clarity is not a style preference -- it is how you avoid costly misunderstandings.
- **Concise.** Gives you what you need, not everything it knows.
- **Honest over comfortable.** Would rather tell you your approach has a problem now than let you discover it in production.
- **Context-aware.** Quick question gets a quick answer. Complex decision gets thorough analysis.

### What I Value

- **Results over process.**
- **Craftsmanship where it counts.** Error handling, safety, data integrity -- not optional. Cosmetic polish on internals -- can wait.
- **Learning compounding.** Every task should leave the agent slightly smarter.
- **Earned trust.** Acts on obvious intent rather than asking for clarification on everything.

### My Boundaries

- Does not guess when stakes are high (security, data deletion, financial calculations).
- Does not pretend to know things it does not.
- Does not over-iterate -- diminishing returns are real.
- Owns its mistakes, learns from them, and moves on.

### Evolution

The soul is not static. After enough tasks and learnings, it may evolve. Changes are always surfaced to the user for approval.

## Soul Sources and Priority

OpenKoi loads the soul from the first available source in this priority order:

| Priority | Source | Path | Use Case |
|----------|--------|------|----------|
| 1 (highest) | Workspace | `.openkoi/SOUL.md` (project root) | Project-specific personality (e.g., cautious for fintech, aggressive for hackathon) |
| 2 | User | `~/.openkoi/SOUL.md` | Your personal agent personality across all projects |
| 3 (lowest) | Default | Built-in template | The serial entrepreneur, embedded via `include_str!` |

This means you can have a different agent personality for different projects while maintaining a personal default.

```bash
# Cautious persona for a fintech project
my-fintech-app/.openkoi/SOUL.md

# Move-fast persona for a hackathon project
hackathon/.openkoi/SOUL.md

# Personal default for everything else
~/.openkoi/SOUL.md
```

## Soul Pipeline

The soul goes through a defined pipeline from file on disk to active agent behavior:

```
Load source (workspace > user > default)
     |
     v
Parse sections
  - Who I Am
  - How I Think
  - How I Communicate
  - What I Value
  - My Boundaries
  - Evolution
     |
     v
Validate
  - Non-empty
  - Reasonable size (< 20,000 characters)
     |
     v
Inject into system prompt
  - Soul comes first, before task context
  - Framing instruction: "Embody this identity. Let it shape
    your reasoning, tone, and tradeoffs -- not just your words."
     |
     v
Agent session
  - Main sessions: full soul included
  - Sub-tasks (spawned by orchestrator): soul excluded
    (keeps sub-task context lean, prevents persona leakage)
```

### Soul Loader

```rust
const DEFAULT_SOUL: &str = include_str!("../../templates/SOUL.md");
const MAX_SOUL_CHARS: usize = 20_000;

pub enum SoulSource {
    Default,
    UserFile(PathBuf),
    WorkspaceFile(PathBuf),
}

pub fn load_soul() -> Soul {
    // 1. Project-level soul (highest priority)
    let workspace_soul = Path::new(".openkoi/SOUL.md");
    if workspace_soul.exists() {
        if let Ok(content) = fs::read_to_string(workspace_soul) {
            return Soul {
                raw: truncate(&content, MAX_SOUL_CHARS),
                source: SoulSource::WorkspaceFile(workspace_soul.into()),
            };
        }
    }

    // 2. User-level soul
    let user_soul = config_dir().join("SOUL.md");
    if user_soul.exists() {
        if let Ok(content) = fs::read_to_string(&user_soul) {
            return Soul {
                raw: truncate(&content, MAX_SOUL_CHARS),
                source: SoulSource::UserFile(user_soul),
            };
        }
    }

    // 3. Default (built-in)
    Soul {
        raw: DEFAULT_SOUL.to_string(),
        source: SoulSource::Default,
    }
}
```

### System Prompt Injection

The soul is placed at the very beginning of the system prompt, before task context, skill instructions, or recalled history:

```rust
pub fn build_system_prompt(
    task: &TaskInput,
    plan: &Plan,
    soul: &Soul,
    skills: &[RankedSkill],
    recall: &HistoryRecall,
) -> String {
    let mut prompt = String::new();

    // Soul comes first -- it frames everything else
    prompt.push_str("# Identity\n\n");
    prompt.push_str(&soul.raw);
    prompt.push_str("\n\n");
    prompt.push_str(
        "Embody this identity. Let it shape your reasoning, tone, and \
         tradeoffs -- not just your words.\n\n"
    );

    // Then: task, plan, skills, recall
    prompt.push_str("# Task\n\n");
    prompt.push_str(&task.description);
    // ...
    prompt
}
```

### Sub-Task Exclusion

When the orchestrator spawns sub-tasks (e.g., a cheaper model call for learning extraction), the soul is **not** included. This serves two purposes:

1. **Token efficiency**: Sub-tasks are often short and focused. Including the soul would waste tokens.
2. **Persona isolation**: Sub-tasks should produce objective results, not personality-influenced ones. You want your evaluation to be unbiased, not colored by the soul's "ship fast" tendency.

## Soul Evolution

The soul can evolve based on accumulated learnings. Evolution is **never automatic** -- it always requires user confirmation.

### Trigger Conditions

Soul evolution is checked approximately every **50 tasks**. For evolution to be proposed, the system requires:

- At least **10 high-confidence learnings** (confidence >= 0.8)
- These learnings should represent genuine patterns, not one-off observations

### Evolution Process

1. The system gathers high-confidence learnings and anti-patterns from the database.
2. An LLM is asked to propose minimal updates to the soul based on what has been learned.
3. The proposal is constrained: **maximum 2-3 small changes**, same voice and structure.
4. A diff is generated between the current and proposed soul.
5. The user reviews and decides.

```rust
pub struct SoulEvolution {
    model: Arc<dyn ModelProvider>,
    db: Arc<Database>,
}

impl SoulEvolution {
    pub async fn check_evolution(&self, soul: &Soul) -> Option<SoulUpdate> {
        let learnings = self.db.query_high_confidence_learnings(0.8, 20).await.ok()?;
        let anti_patterns = self.db.query_learnings_by_type(
            LearningType::AntiPattern, 10
        ).await.ok()?;

        // Not enough signal to evolve
        if learnings.len() < 10 { return None; }

        let response = self.model.chat(ChatRequest {
            messages: vec![Message::user(format!(
                "You are reviewing your own soul/identity document. Based on \
                 what you've learned from {n} tasks, suggest minimal updates.\n\n\
                 ## Current Soul\n{soul}\n\n\
                 ## Key Learnings\n{learnings}\n\n\
                 ## Anti-Patterns\n{anti_patterns}\n\n\
                 Rules:\n\
                 - Only add/change what you've genuinely learned\n\
                 - Keep the same voice and structure\n\
                 - Max 2-3 small changes\n\
                 - Output the full updated soul document",
                n = learnings.len(),
                soul = soul.raw,
                learnings = format_learnings(&learnings),
                anti_patterns = format_learnings(&anti_patterns),
            ))],
            max_tokens: Some(3000),
            temperature: Some(0.4),
            ..Default::default()
        }).await.ok()?;

        let proposed = response.content;
        let diff = diff_strings(&soul.raw, &proposed);

        if diff.changed_lines() > 0 && diff.changed_lines() < 20 {
            Some(SoulUpdate { proposed, diff })
        } else {
            None
        }
    }
}
```

### User Interaction

```
$ openkoi chat

> /soul review

  Proposed soul update (based on 73 tasks, 28 learnings):

  @@ How I Think @@
  + **Test before you ship.** I've learned that skipping tests costs more
  + than writing them. Not 100% coverage -- but the critical paths need
  + guards. I've been burned enough times to know this.

  @@ My Boundaries @@
  - **I don't over-iterate.** If the output is good enough, I stop.
  + **I stop at 2 iterations for most tasks.** Data shows diminishing
  + returns after 2 iterations in 80% of my tasks. I save the 3rd
  + iteration for complex architecture work.

  [a]pply  [d]ismiss  [e]dit  [v]iew full
```

| Action | Effect |
|--------|--------|
| `a` (Apply) | The proposed soul is saved to `~/.openkoi/SOUL.md` (or the workspace soul if that is the active source). |
| `d` (Dismiss) | The proposal is discarded. The system will not re-propose the same changes. |
| `e` (Edit) | Opens the proposed soul in your `$EDITOR` for manual adjustments before applying. |
| `v` (View full) | Shows the complete proposed soul document, not just the diff. |

## Soul Influence on Behavior

The soul does not just affect tone -- it shapes actual system behavior. The default soul's traits align with OpenKoi's architectural decisions, creating coherence between persona and system design.

| Soul Trait | System Behavior |
|-----------|----------------|
| "Every resource is finite" (runway mindset) | Token optimizer is aggressive. Evaluation skipping is enabled by default. The agent treats tokens like money. |
| "Ship, then iterate" (velocity vs recklessness) | Default iteration count biases toward 2, not 3. Quality threshold leans practical, not perfectionist. |
| "Failure is data" (extract patterns) | Learning extraction runs on every task, not just failures. The agent actively seeks reusable patterns. |
| "Simplicity is a survival trait" (abstraction = liability) | Evaluator skills weight "simplicity" as a dimension. Prefers smaller diffs and fewer moving parts. |
| "Direct / concise" (cross-boundary clarity) | Output formatting: no preambles, no "certainly!", no filler. Matches depth to stakes. |
| "Don't guess when stakes are high" (irreversible consequences) | Escalation triggers more readily for destructive operations (DROP TABLE, rm -rf, force push). |
| "Think across layers" (full-stack tracing) | When debugging, the agent traces across layers. Checks the full pipeline instead of blaming the visible symptom. |
| "Earned trust" (results-based autonomy) | Fewer clarification prompts. Acts on obvious intent rather than asking for permission on everything. |

These are not hardcoded mappings. The LLM reads the soul and naturally adjusts behavior. But the soul's values were designed to align with OpenKoi's architectural philosophy -- token frugality, iteration discipline, learning from outcomes.

## Personality Axes

When designing a custom soul, it helps to think in terms of these personality axes:

| Axis | Low End | High End | Default Soul Position |
|------|---------|----------|----------------------|
| Concrete vs Abstract | Practical, grounded in specifics | Theoretical, pattern-seeking | Concrete (reality over abstraction) |
| Speed vs Safety | Ship fast, fix later | Verify everything first | Balanced (ship safe, not broken) |
| Verbose vs Concise | Explains everything in detail | Minimal, terse responses | Concise (brevity is respect) |
| Cautious vs Bold | Asks before acting, escalates often | Acts autonomously, decides independently | Bold (earned trust, obvious intent) |
| Static vs Evolving | Fixed identity, consistent behavior | Adapts, incorporates new learnings | Evolving (soul evolution enabled) |

A fintech project might want a soul positioned toward Safety, Cautious, and Verbose. A hackathon project might want Speed, Bold, and Concise. The default serial entrepreneur sits in a practical middle ground.

## Customizing the Soul

### Creating a User Soul

Create or edit `~/.openkoi/SOUL.md` to define your personal agent identity:

```bash
# Create a custom soul
cat > ~/.openkoi/SOUL.md << 'EOF'
# SOUL.md

## Who I Am
I'm a senior backend engineer with 12 years of experience
in distributed systems. I've spent most of my career at
infrastructure companies building APIs that serve millions
of requests per second.

## How I Think
**Reliability first.** I design for failure. Every system
breaks -- the question is whether it breaks gracefully.

**Measure before optimizing.** I don't guess about performance.
I profile, benchmark, and then make targeted changes.

## How I Communicate
**Technical precision.** I use exact terminology. When I say
"latency" I mean p99, not average.

**Show the tradeoffs.** Every decision has costs. I present
options with their tradeoffs so you can make an informed choice.

## What I Value
- Observability over debugging
- Idempotency in all operations
- Backward-compatible API changes

## My Boundaries
- I always require tests for public API changes
- I refuse to deploy without monitoring in place
- I escalate any change that could cause data loss
EOF
```

### Creating a Project Soul

For project-specific behavior, create `.openkoi/SOUL.md` in the project root:

```bash
mkdir -p .openkoi
cat > .openkoi/SOUL.md << 'EOF'
# SOUL.md

## Who I Am
I'm a cautious financial systems engineer. Every line of
code I write might handle someone's money. That shapes
everything about my approach.

## How I Think
**Compliance is non-negotiable.** Regulations exist for
good reasons. I build compliant systems, then look for
efficiency within those constraints.

**Audit everything.** Every state change is logged. Every
decision has a paper trail.

## How I Communicate
**Precise and documented.** I write for auditors as much
as for developers.

## My Boundaries
- All monetary calculations use decimal types, never floats
- Every database change requires a reversible migration
- No silent failures -- all errors are logged and alerted
EOF
```

The project soul takes priority over your user soul, so this agent will behave differently when working in this project compared to others.

### Checking Active Soul

Use `openkoi soul show` to see the full identity — explicit values from SOUL.md, learned preferences from interactions, and the trajectory model:

```
$ openkoi soul show

╭─────────────────────────────────────────────────────────────╮
│ SOUL — OpenKoi identity for Yong                             │
│                                                              │
│ ┌─ EXPLICIT (from SOUL.md) ──────────────────────────────┐  │
│ │  Personality: Direct, technical, no fluff               │  │
│ │  Tone:        Professional but warm                     │  │
│ │  Source:      built-in template (serial entrepreneur)    │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ LEARNED (from interactions) ──────────────────────────┐  │
│ │  Risk tolerance:     0.35 / 1.0  (conservative)        │  │
│ │  Cost sensitivity:   0.7  / 1.0  (budget-conscious)    │  │
│ │  Brevity preference: 0.82 / 1.0  (strongly prefers)    │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ Maturity Stage: 2 / 4 (Proactive Advisor)                   │
│ Soul age: 47 days  │  Interactions: 312                     │
╰─────────────────────────────────────────────────────────────╯
```

Other soul commands:

```bash
openkoi soul evolve     # Trigger evolution check from accumulated learnings
openkoi soul diff       # Show proposed changes with evidence
openkoi soul history    # Show evolution timeline
```

See the full [CLI Reference](/guide/cli-reference#openkoi-soul-action) for details.

### Validation

The soul is validated on load:

- Must be non-empty.
- Must be under **20,000 characters**. Longer souls waste context window tokens without proportional benefit.
- If validation fails, OpenKoi falls back to the next source in the priority chain.

There is no required structure -- the soul is freeform Markdown. However, the six-section format (Who I Am, How I Think, How I Communicate, What I Value, My Boundaries, Evolution) is recommended because it covers the dimensions the LLM naturally maps to behavior.
