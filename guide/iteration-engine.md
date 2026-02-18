# Iteration Engine

The iteration engine is the core of OpenKoi. Instead of generating output once and returning it, OpenKoi follows a **Plan-Execute-Evaluate-Refine** cycle that iteratively improves results until a quality threshold is met or a budget is exhausted.

## Orchestrator Flow

The Orchestrator is the top-level controller. It coordinates all other components through a fixed pipeline:

```
                    Task Input
                        |
                   +----v----+
                   | Recall  |  Query long-term memory for relevant context
                   +----+----+
                        |
                   +----v----+
                   |  Plan   |  Select skills, build initial execution plan
                   +----+----+
                        |
            +-----------v-----------+
            |    Iteration Loop     |
            |                       |
            |   +-----v------+      |
            |   |  Execute   | <----+---- Refine plan using delta feedback
            |   +-----+------+      |
            |         |             |
            |   +-----v------+      |
            |   |  Evaluate  |      |
            |   +-----+------+      |
            |         |             |
            |   +-----v------+      |
            |   |  Decide    |------+--> Continue / Accept / Abort
            |   +------------+      |
            |                       |
            +-----------+-----------+
                        |
                   +----v----+
                   |  Learn  |  Extract learnings, persist to memory
                   +----+----+
                        |
                   +----v----+
                   | Return  |  Best output from all iterations
                   +---------+
```

### Step-by-Step

1. **Recall** -- The Historian queries long-term memory for relevant context: anti-patterns, learnings, skill recommendations, and similar past tasks. Recall is token-budgeted (uses at most 10% of the task's total token budget).

2. **Plan** -- The Learner selects and ranks skills for the task. The Planner model creates an execution plan incorporating recalled context and selected skills.

3. **Execute** -- The Executor model performs the actual work using the current plan and context. On iteration 2+, context is compressed to include only delta feedback (unresolved findings), not the full history.

4. **Evaluate** -- The Evaluator scores the output against rubrics. May be skipped if the system is confident enough (see `skip_eval_confidence`). On iteration 2+, uses incremental evaluation to score only changed dimensions.

5. **Decide** -- The Orchestrator decides whether to continue iterating, accept the result, or abort.

6. **Refine** -- If continuing, the plan is refined using only the delta from the evaluation (not a full re-plan).

7. **Learn** -- After the loop ends, the Learner extracts reusable knowledge from the iteration history. This runs in the background and does not block the result.

8. **Return** -- The best output across all iterations is returned to the user.

---

## Component Roles

| Component | Role | Description |
|-----------|------|-------------|
| **Orchestrator** | Controller | Coordinates the iteration loop. Tracks budgets, makes decisions, manages state. |
| **Executor** | Do | Performs the actual task work. Uses the executor model. |
| **Evaluator** | Judge | Scores the output against evaluation rubrics. Uses the evaluator model. |
| **Learner** | Adapt | Selects skills before execution; extracts learnings after completion. |
| **Historian** | Recall | Manages long-term memory. Provides token-budgeted recall of relevant context. |
| **TokenOptimizer** | Compress | Builds minimal context for each iteration. Handles delta feedback, output compression, and evaluation caching. |
| **PatternMiner** | Detect | Mines usage patterns from accumulated events. Runs asynchronously, not during the iteration loop. |

---

## Core Types

### IterationCycle

Each iteration through the loop produces an `IterationCycle` record:

```rust
pub struct IterationCycle {
    pub id: String,                    // Unique cycle identifier
    pub task_id: String,               // Parent task identifier
    pub iteration: u8,                 // Iteration number (0-indexed)
    pub phase: Phase,                  // Current phase
    pub output: Option<ExecutionOutput>, // Executor's output
    pub evaluation: Option<Evaluation>,  // Evaluator's assessment
    pub decision: IterationDecision,   // What to do next
    pub usage: TokenUsage,             // Tokens consumed this cycle
    pub duration: Duration,            // Wall-clock time for this cycle
}
```

All cycles for a task are persisted to SQLite in the `iteration_cycles` table and referenced for learning extraction.

### Phase

```rust
pub enum Phase {
    Plan,       // Building or refining the execution plan
    Execute,    // Executor is generating output
    Evaluate,   // Evaluator is scoring the output
    Learn,      // Extracting learnings (post-loop)
    Complete,   // Task finished successfully
    Abort,      // Task terminated early (budget, timeout, regression)
}
```

### IterationDecision

After each evaluation, the Orchestrator makes a decision:

```rust
pub enum IterationDecision {
    Continue,         // Score below threshold, budget remains -- refine and try again
    Accept,           // Score meets or exceeds quality_threshold
    AcceptBest,       // Max iterations reached -- return the best result so far
    SkipEval,         // Confident enough to skip evaluation (see skip_eval_confidence)
    Escalate,         // Ask the human for input
    AbortBudget,      // Token or cost budget exceeded
    AbortTimeout,     // Time budget exceeded
    AbortRegression,  // Score regressed significantly from previous iteration
}
```

#### Decision Logic

The decision follows this priority:

| Check | Condition | Decision |
|-------|-----------|----------|
| 1. Budget | Token or cost budget exceeded | `AbortBudget` |
| 2. Timeout | Wall-clock time exceeded `timeout_seconds` | `AbortTimeout` |
| 3. Regression | Score dropped by more than `regression_threshold` | `AbortRegression` (if `abort_on_regression` is enabled) |
| 4. Quality met | Score >= `quality_threshold` | `Accept` |
| 5. Max iterations | Iteration count >= `max_iterations` | `AcceptBest` |
| 6. Diminishing returns | Improvement < `improvement_threshold` | `AcceptBest` |
| 7. Default | None of the above | `Continue` |

---

## IterationConfig

All iteration behavior is controlled by a single configuration struct:

```rust
pub struct IterationConfig {
    pub max_iterations: u8,            // Default: 3
    pub quality_threshold: f32,        // Default: 0.8
    pub improvement_threshold: f32,    // Default: 0.05
    pub timeout: Duration,             // Default: 300 seconds (5 min)
    pub token_budget: u32,             // Default: 200_000
    pub skip_eval_confidence: f32,     // Default: 0.95
}
```

| Field | Default | CLI Override | Config Key |
|-------|---------|-------------|------------|
| `max_iterations` | `3` | `--iterate 5` | `iteration.max_iterations` |
| `quality_threshold` | `0.8` | `--quality 0.9` | `iteration.quality_threshold` |
| `improvement_threshold` | `0.05` | -- | `iteration.improvement_threshold` |
| `timeout` | `300s` | -- | `iteration.timeout_seconds` |
| `token_budget` | `200,000` | -- | `iteration.token_budget` |
| `skip_eval_confidence` | `0.95` | -- | `iteration.skip_eval_confidence` |

---

## Token Optimization

Tokens are treated as a scarce resource. Every optimization targets reducing token consumption without sacrificing output quality.

### Token Budget System

Each task is allocated a total token budget. The Orchestrator tracks spending across all phases and makes allocation decisions for each iteration.

```
Total Budget: 200,000 tokens
  |
  +-- Recall:     ~10% (20,000)
  +-- Iteration 1: ~30% (60,000)  -- full context, full eval
  +-- Iteration 2: ~35% (70,000)  -- delta context, incremental eval
  +-- Iteration 3: ~25% (50,000)  -- delta context, may skip eval
```

Later iterations receive a slightly higher allocation because evaluation context grows, even though execution context shrinks (delta feedback is smaller than full context).

### Context Compression

The TokenOptimizer builds the smallest possible context for each iteration:

| Iteration | Context Strategy |
|-----------|-----------------|
| **First** | Full task description + plan + recall summary (compressed). No prior output. |
| **Second+** | Task description + compressed previous output + **delta feedback only**. Delta feedback includes only unresolved findings and specific fix instructions -- not the full evaluation, not the full output, not the history of all iterations. |

Delta feedback saves **60-80% of tokens** on iterations 2 and beyond compared to sending the full conversation history.

### Output Compression

When including previous output in the context for refinement:

- **Code output**: Keep changed lines + 3 lines of surrounding context. Strip unchanged function bodies.
- **Text output**: Keep first paragraph + section headers. Strip body paragraphs that don't need changes.

### Evaluation Caching and Skipping

Not every iteration needs an LLM evaluation:

| Condition | Action | Token Savings |
|-----------|--------|---------------|
| Output is identical to previous iteration (hash match) | Skip evaluation, reuse previous score | 100% eval tokens |
| Previous score >= `skip_eval_confidence` AND tests pass AND static analysis clean | Skip LLM evaluation | 100% eval tokens |
| Changes are localized to specific dimensions | Incremental evaluation (see below) | 40-70% eval tokens |

### Incremental Evaluation

On iterations 2+, the evaluator can re-score only the dimensions affected by changes:

1. Compute the diff between the current and previous output.
2. Identify which evaluation dimensions are affected by the changes.
3. Re-evaluate only those dimensions via the LLM evaluator.
4. Carry forward unchanged dimension scores from the previous evaluation.

This saves **40-70% of evaluation tokens** when changes are localized (e.g., fixing a specific function without touching the rest of the output).

### Token Savings Summary

| Optimization | Savings | When Applied |
|-------------|---------|-------------|
| Delta feedback (not full context) | 60-80% on iter 2+ | Every multi-iteration task |
| Output compression | 40-60% on iter 2+ | When previous output was large |
| Evaluation skipping | 100% eval cost | Tests pass + previous score high |
| Incremental evaluation | 40-70% eval cost | Changes are localized |
| Token-budgeted recall | Varies | Every task (caps memory retrieval) |
| Prompt caching (Anthropic) | ~90% system prompt | Every call in a session (Anthropic only) |

A 3-iteration task that would cost approximately $1.50 with naive context management costs $0.30-$0.50 with these optimizations.

---

## Safety and Circuit Breakers

The iteration engine has multiple safety mechanisms to prevent runaway costs and degrading output.

### Cost Circuit Breaker

Every API call feeds into the `CostTracker`. When the accumulated cost for a task exceeds `max_cost_usd` (default $2.00), the iteration loop hard-stops with `AbortBudget`.

```rust
pub struct CostTracker {
    total_usd: f64,
    by_model: HashMap<String, f64>,
    by_phase: HashMap<Phase, f64>,
}
```

Cost is calculated per-model using the provider's published token pricing. View accumulated costs with `openkoi status --costs`.

### Time Circuit Breaker

If the total wall-clock time for a task exceeds `timeout_seconds` (default 300s), the loop stops with `AbortTimeout` and returns the best result so far.

### Regression Detection

If `abort_on_regression` is enabled (default: true), the Orchestrator compares the current iteration's score against the previous iteration. If the score drops significantly, the loop stops with `AbortRegression` and returns the previous (better) result.

This prevents the common failure mode where a "fix" iteration actually makes the output worse.

### Tool Loop Detection

The tool loop detector watches for repeated calls to the same tool, which indicates the agent is stuck:

| Threshold | Action |
|-----------|--------|
| `warning` (10) | Log a warning |
| `critical` (20) | Escalate -- pause and ask the human |
| `circuit_breaker` (30) | Hard stop -- abort the task |

---

## Example Flows

### Simple Task (No Iteration)

```
$ openkoi "What does the login function in src/auth.rs do?"

[recall] 0 similar tasks
[execute] Reading src/auth.rs...
The login function authenticates users via...
[done] 1 iteration, 2.1k tokens, $0.01
```

Read-only questions are detected and the evaluate-refine loop is skipped entirely.

### Multi-Iteration Task

```
$ openkoi "Add rate limiting to /api/login" --iterate 3

[recall] 2 similar tasks, 1 anti-pattern: "don't use fixed window"
[iter 1/3] score: 0.73
  ! Missing IP-based limiting
[iter 2/3] score: 0.89 (eval: incremental, 40% tokens saved)
  All tests pass
[done] 2 iterations, 38k tokens, $0.32
  2 learnings saved
```

The loop ran 2 iterations (not the maximum 3) because the quality threshold was met at 0.89. Delta feedback and incremental evaluation saved approximately 45% of tokens compared to the naive approach.

### Budget Abort

```
$ openkoi "Rewrite the entire auth module" --budget 0.50

[recall] 5 similar tasks, 3 learnings
[iter 1/3] score: 0.62
  ! Missing OAuth2 flow
[iter 2/3] score: 0.71
  ! Token budget approaching limit
[abort] Budget exceeded ($0.52/$0.50). Returning best result (score: 0.71).
```

### Cross-App Workflow

```
$ openkoi "Summarize today's Slack and post to Notion"

[skill] morning-slack-summary (learned, conf: 0.89)
[tools] slack_read(#engineering) -> 87 msgs
[tools] slack_read(#product) -> 23 msgs
[tools] notion_write_doc("Daily Summary - Feb 17")
[tools] slack_send(#engineering, "Summary posted: https://notion.so/...")
[done] 1 iteration (deterministic skill), 8k tokens, $0.06
```

Skill-driven tasks with deterministic workflows often complete in a single iteration without evaluation.

---

## Orchestrator Pseudocode

For reference, here is the simplified orchestration logic:

```
function run(task):
    recall = historian.recall(task, token_budget / 10)
    skills = learner.select_skills(task, recall)
    plan = planner.plan(task, skills, recall)
    cycles = []
    best = null
    budget = TokenBudget(token_budget)

    for i in 0..max_iterations:
        cycle = new IterationCycle(task, i)

        # Execute (with compressed context on iteration 2+)
        context = token_optimizer.build_context(task, plan, cycles, budget)
        cycle.output = executor.execute(context, skills)
        budget.deduct(cycle.output.usage)

        # Evaluate (may skip)
        if should_evaluate(cycle, cycles):
            cycle.evaluation = evaluator.evaluate_incremental(task, cycle, cycles)
            budget.deduct(cycle.evaluation.usage)
        else:
            cycle.decision = SkipEval

        # Decide
        cycle.decision = decide(cycles, cycle, budget)

        if cycle.score > best.score:
            best = cycle
        cycles.push(cycle)

        if cycle.decision != Continue:
            break

        # Refine plan using delta feedback
        plan = token_optimizer.refine_plan(plan, cycle.evaluation)

    # Learn (background, non-blocking)
    spawn learner.extract(cycles)
    spawn historian.persist(task, cycles, learnings)

    return best.output
```
