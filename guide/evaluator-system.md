# Evaluator System

The evaluator is what makes OpenKoi's self-iteration loop work. It judges the executor's output, produces a score, identifies specific findings, and provides actionable suggestions for improvement. Without a good evaluator, iteration is just repetition.

## Two-Layer Architecture

The evaluator is split into two layers:

| Layer | What it is | Where it lives | What it does |
|-------|-----------|----------------|-------------|
| **Evaluation Framework** | Compiled Rust code | Binary (`src/evaluator/`) | Orchestrates evaluation, aggregates scores, handles incremental eval, caching, and skipping. This is the plumbing. |
| **Evaluator Skills** | SKILL.md files | `evaluators/` directories | Define what to evaluate: rubrics, dimensions, scoring criteria, severity guidelines. These are the brains. |

This separation means users can add domain-specific evaluators by writing a Markdown file -- no Rust code required.

---

## Evaluation Types

| Type | Source | Token Cost | When Used |
|------|--------|-----------|-----------|
| **Skill-based LLM judge** | `evaluators/*.SKILL.md` | ~2k-5k | Default. The LLM scores the output against the rubric from the skill file. |
| **Test runner** | Built-in (binary) | 0 | When tests exist in the project. Runs the test suite and derives a pass/fail score. |
| **Static analysis** | Built-in (binary) | 0 | When applicable. Runs lint and type-check tools. |
| **Composite** | Built-in (binary) | Varies | Weighted combination of the above. The default evaluation mode. |

The built-in evaluators (test runner, static analysis) stay compiled in the binary because they run external tools, not LLM prompts. LLM-based evaluation is driven entirely by skill files.

### Evaluation Flow

```
   Executor Output
        |
   +----v---------+
   | Test Runner   |  Run test suite (if available) -- 0 tokens
   +----+----------+
        |
   +----v--------------+
   | Static Analysis    |  Lint + type-check (if applicable) -- 0 tokens
   +----+---------------+
        |
   +----v--------------+
   | Skill Selection    |  Pick the best evaluator skill for this task
   +----+---------------+
        |
   +----v--------------+
   | LLM Judge          |  Send rubric + output to evaluator model -- ~2k-5k tokens
   +----+---------------+
        |
   +----v--------------+
   | Score Aggregation  |  Weighted composite of all evaluation sources
   +----+---------------+
        |
   Evaluation Result
```

---

## Evaluation Struct

Every evaluation produces an `Evaluation`:

```rust
pub struct Evaluation {
    pub score: f32,                    // 0.0-1.0 composite score
    pub dimensions: Vec<DimensionScore>, // Per-dimension breakdown
    pub findings: Vec<Finding>,        // Specific issues found
    pub suggestion: String,            // Concise improvement guidance for next iteration
    pub usage: TokenUsage,             // Tokens consumed by this evaluation
    pub evaluator_skill: String,       // Name of the evaluator skill used
}
```

### DimensionScore

Each evaluator skill defines weighted dimensions. The composite score is the weighted average of all dimension scores.

```rust
pub struct DimensionScore {
    pub dimension: String,   // e.g., "correctness", "safety"
    pub score: f32,          // 0.0-1.0
    pub weight: f32,         // e.g., 0.4
}
```

---

## Finding Struct

Findings are specific, actionable issues identified during evaluation:

```rust
pub struct Finding {
    pub id: String,                    // Identifier: F1, F2, F3...
    pub severity: Severity,            // Blocker | Important | Suggestion
    pub dimension: String,             // Which dimension this falls under
    pub title: String,                 // Short description
    pub description: String,           // Detailed explanation
    pub location: Option<String>,      // file:line (if applicable)
    pub fix: Option<String>,           // Suggested fix
}
```

### Severity Levels

| Severity | Meaning | Impact on Score | Examples |
|----------|---------|----------------|---------|
| **Blocker** | The output is fundamentally broken | Caps the dimension score at 0.3 | Crashes, data loss, security vulnerabilities, wrong behavior |
| **Important** | Significant issue that should be fixed | Reduces the dimension score by 0.1-0.3 | Missing error handling, poor performance, missing tests |
| **Suggestion** | Minor improvement opportunity | Minimal score impact | Style nits, naming improvements, minor refactoring |

Findings drive the iteration loop. The `suggestion` field in the Evaluation and the `fix` field on individual findings are what the executor receives as delta feedback on the next iteration.

---

## Bundled Evaluator Skills

OpenKoi ships with six evaluator skills embedded in the binary via `include_str!`:

### general

The fallback evaluator used when no category-specific evaluator matches.

| Dimension | Weight | Description |
|-----------|--------|-------------|
| relevance | 0.4 | Does the output address the task? |
| quality | 0.35 | Is the output well-structured and correct? |
| completeness | 0.25 | Are all aspects of the task covered? |

**Categories**: (fallback for all unmatched tasks)

### code-review

The primary evaluator for code-related tasks.

| Dimension | Weight | Description |
|-----------|--------|-------------|
| correctness | 0.4 | Does the code do what the task asked? Are there logic errors? |
| safety | 0.25 | Error handling, input validation, no panics, no credential leaks |
| style | 0.15 | Idiomatic, readable, consistent naming, DRY |
| completeness | 0.2 | Edge cases, tests, documentation |

**Categories**: `code`, `refactor`, `bugfix`

### prose-quality

For writing, summarization, and documentation tasks.

| Dimension | Weight | Description |
|-----------|--------|-------------|
| clarity | 0.3 | Is the writing clear and unambiguous? |
| accuracy | 0.3 | Are facts correct? |
| tone | 0.2 | Appropriate for the audience? |
| structure | 0.2 | Well-organized with logical flow? |

**Categories**: `writing`, `summary`, `docs`

### sql-safety

For database and migration tasks.

| Dimension | Weight | Description |
|-----------|--------|-------------|
| correctness | 0.3 | Does the query produce correct results? |
| safety | 0.3 | SQL injection prevention, privilege escalation, data integrity |
| performance | 0.2 | Index usage, query plan efficiency |
| reversibility | 0.2 | Can the migration be rolled back? |

**Categories**: `database`, `migration`

### api-design

For API endpoint and schema design tasks.

| Dimension | Weight | Description |
|-----------|--------|-------------|
| RESTfulness | 0.25 | Proper use of HTTP methods, status codes, resource naming |
| consistency | 0.25 | Consistent patterns across endpoints |
| error responses | 0.25 | Clear error messages, proper status codes, error schemas |
| documentation | 0.25 | OpenAPI/Swagger completeness |

**Categories**: `api`, `endpoint`, `schema`

### test-quality

For test-writing tasks.

| Dimension | Weight | Description |
|-----------|--------|-------------|
| coverage | 0.3 | Are critical paths covered? Edge cases? |
| assertions | 0.25 | Are assertions meaningful and specific? |
| isolation | 0.25 | Do tests run independently without shared state? |
| readability | 0.2 | Are test names descriptive? Is intent clear? |

**Categories**: `test`, `testing`

---

## Evaluator Skill File Format

Evaluator skills use the same SKILL.md format as task skills, with `kind: evaluator` in the YAML frontmatter.

```yaml
---
name: code-review
kind: evaluator
description: Evaluates code changes for correctness, style, and safety.
metadata:
  categories: ["code", "refactor", "bugfix"]
  dimensions:
    - name: correctness
      weight: 0.4
      description: Does the code do what the task asked?
    - name: safety
      weight: 0.25
      description: Error handling, input validation, no panics
    - name: style
      weight: 0.15
      description: Idiomatic, readable, consistent naming
    - name: completeness
      weight: 0.2
      description: Edge cases, tests, documentation
---

# Code Review Evaluator

Evaluate the output against these criteria:

## Correctness (40%)
- Does the implementation match the task requirements?
- Are all specified behaviors implemented?
- Would this code produce correct results for normal inputs?
- Are there logic errors?

## Safety (25%)
- Are errors handled (no unwrap on user input, no silent failures)?
- Is user input validated?
- Are there potential panics, overflows, or resource leaks?
- Are credentials/secrets handled properly?

## Style (15%)
- Is the code idiomatic for the language?
- Are names descriptive and consistent?
- Is the code DRY without being over-abstracted?

## Completeness (20%)
- Are edge cases handled?
- Are tests included (if applicable)?
- Is the change documented where needed?

## Severity Guide
- **Blocker**: Crashes, data loss, security hole, wrong behavior
- **Important**: Missing error handling, poor performance, missing tests
- **Suggestion**: Style nits, naming, minor improvements
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier for the evaluator skill. |
| `kind` | Yes | Must be `evaluator` to distinguish from task skills. |
| `description` | Yes | Human-readable description of what this evaluator assesses. |
| `metadata.categories` | Yes | Array of task categories this evaluator applies to. |
| `metadata.dimensions` | Yes | Array of scoring dimensions with `name`, `weight`, and `description`. Weights must sum to 1.0. |

### Body Format

The Markdown body below the frontmatter is the rubric. It is sent to the LLM evaluator as part of the evaluation prompt. Write it as clear instructions for a reviewer.

---

## Skill Selection

When a task needs evaluation, the framework selects the best evaluator skill:

```
1. Get all evaluator skills (kind: evaluator) from the skill registry
2. Filter by eligibility (OS, required env vars, approval status)
3. Match by category:
   - If the task has a category (e.g., "code"), find an evaluator
     whose categories include "code"
   - If multiple match, prefer the one with higher historical effectiveness
4. If no category match, fall back to the "general" evaluator
```

The `general` evaluator is always bundled and always available as a fallback. It is impossible to reach a state where no evaluator is available.

---

## LLM Judge Parameters

When the framework sends the rubric and output to the evaluator model, it uses these parameters:

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `max_tokens` | `2000` | Enough for a detailed evaluation with findings, but caps cost. |
| `temperature` | `0.1` | Low temperature for consistent, reproducible scoring. High temperature would make scores unreliable across iterations. |

The evaluation prompt follows this structure:

```
You are an evaluator. Use the following rubric to evaluate the output.

## Rubric
{evaluator skill body -- the Markdown content below the frontmatter}

## Task
{original task description}

## Output to evaluate
{executor's output from the current iteration}

Score each dimension 0.0-1.0. List findings with severity.
```

---

## Evaluation Caching

Evaluation is expensive (2k-5k tokens per call). The framework caches and skips evaluations when safe:

### Skip Conditions

| Condition | Logic |
|-----------|-------|
| **Identical output** | Hash the current output and compare to the previous iteration. If identical, reuse the previous evaluation. |
| **High confidence + static pass** | If the previous score >= `skip_eval_confidence` (default 0.95) AND tests pass AND static analysis is clean, skip the LLM judge entirely. The output is good enough that re-evaluating would waste tokens. |

When evaluation is skipped, the decision is `SkipEval` and the previous evaluation score carries forward.

---

## Incremental Evaluation

On iterations 2+, the evaluator can re-score only the dimensions affected by changes, carrying forward unchanged scores from the previous evaluation.

### How It Works

1. **Compute diff**: Compare the current output against the previous output.
2. **Identify affected dimensions**: Map the changed regions to evaluation dimensions. For example, if only error handling code changed, the `correctness` and `safety` dimensions are affected but `style` may not be.
3. **Partial re-evaluation**: Send only the affected dimensions to the LLM evaluator, along with the diff.
4. **Merge scores**: Keep old scores for unchanged dimensions. Replace scores for affected dimensions with the new evaluation.
5. **Update findings**: Remove findings that were resolved by the changes. Add new findings from the partial evaluation.

### Token Savings

Incremental evaluation saves **40-70% of evaluation tokens** when changes are localized. For a full re-evaluation, the framework falls back to scoring all dimensions (e.g., when the output changed significantly).

### When Full Re-evaluation Happens

- First iteration (no previous evaluation to compare against)
- Output changes span all or most dimensions
- The diff is large enough that partial evaluation would not be significantly cheaper

---

## Creating Custom Evaluator Skills

Users can create custom evaluator skills for domain-specific evaluation. The process is the same as creating task skills:

```bash
mkdir -p ~/.local/share/openkoi/evaluators/user/my-domain/
```

Then create the SKILL.md:

```yaml
---
name: my-domain
kind: evaluator
description: Evaluates financial report generation
metadata:
  categories: ["finance", "reporting"]
  dimensions:
    - name: accuracy
      weight: 0.5
      description: Are all numbers and calculations correct?
    - name: compliance
      weight: 0.3
      description: Does the report meet regulatory requirements?
    - name: formatting
      weight: 0.2
      description: Is the report properly formatted?
---

# Financial Report Evaluator

## Accuracy (50%)
- Are all financial figures correct?
- Do totals match their line items?
- Are percentages calculated correctly?
- Are date ranges accurate?

## Compliance (30%)
- Does the report follow GAAP/IFRS standards?
- Are all required disclosures present?
- Is the audit trail complete?

## Formatting (20%)
- Is the report in the correct template?
- Are tables properly aligned?
- Are charts readable and labeled?

## Severity Guide
- **Blocker**: Incorrect financial figures, missing regulatory disclosures
- **Important**: Formatting inconsistencies, incomplete sections
- **Suggestion**: Style improvements, additional context
```

Custom evaluator skills take precedence over bundled ones when their categories match.

### Evaluator Skill Sources

Skills are loaded from multiple sources in precedence order (highest to lowest):

| Source | Location | Notes |
|--------|----------|-------|
| User-created | `~/.local/share/openkoi/evaluators/user/` | Highest priority |
| Workspace | `.agents/evaluators/` in the current project | Project-specific |
| Pattern-proposed | `~/.local/share/openkoi/evaluators/proposed/` | Needs approval |
| Managed | `~/.local/share/openkoi/evaluators/managed/` | Installed via registry |
| Bundled | Embedded in the binary | Always available as fallback |

---

## Auto-Proposed Evaluator Skills

The pattern miner can detect when you repeatedly evaluate a certain type of output with consistent criteria and propose a custom evaluator skill. For example, if you run many financial report generation tasks and consistently care about accuracy and compliance, the miner may propose a `financial-report` evaluator.

Proposed evaluator skills are stored in `~/.local/share/openkoi/evaluators/proposed/` and require approval via `openkoi learn` before they are used.

---

## Calibration (Planned)

A planned feature for evaluation calibration:

- Track score distributions per evaluator skill over time.
- Detect score drift (e.g., an evaluator gradually becoming more lenient).
- Provide calibration reports showing score distributions, score stability across similar tasks, and inter-evaluator agreement when multiple evaluators are available.
- Allow users to adjust dimension weights based on calibration data.

This is on the roadmap for v1.0 and is not yet implemented.
