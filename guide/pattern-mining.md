# Pattern Mining

OpenKoi observes your daily usage and automatically detects recurring workflows, time-based habits, and task sequences. When it finds a pattern with sufficient confidence, it proposes a reusable skill that can automate the workflow. You always have the final say on whether to approve or dismiss a proposed skill.

## Pipeline Overview

```
User Activity --> EventLogger --> PatternMiner --> SkillProposer --> Human Review --> Skill Registry
```

The pipeline operates in five stages:

1. **EventLogger** records every task, command, skill use, and integration action.
2. **PatternMiner** runs periodically (default: every 24 hours) to detect patterns in the event log.
3. **SkillProposer** generates SKILL.md files for high-confidence patterns.
4. **Human Review** presents proposals via `openkoi learn` for approval or dismissal.
5. **Skill Registry** activates approved skills for future use.

Each stage is designed to be lightweight. Event logging adds negligible overhead to normal operation, and pattern mining runs as a background job.

## Event Logger

Every task, command, skill invocation, and integration action is logged as a `UsageEvent`. This is the raw data that pattern mining operates on.

### UsageEvent Fields

| Field | Type | Description |
|-------|------|-------------|
| `event_type` | `EventType` | One of: `Task`, `Command`, `SkillUse`, `Integration` |
| `channel` | `String` | Source channel: `"cli"`, `"slack"`, `"telegram"`, etc. |
| `description` | `String` | Natural language description of what happened |
| `category` | `Option<String>` | Task category if detected (e.g., `"code"`, `"communication"`) |
| `skills_used` | `Vec<String>` | Names of skills invoked during this event (JSON array in SQLite) |
| `score` | `Option<f32>` | Final evaluation score if applicable (0.0-1.0) |
| `timestamp` | `DateTime<Utc>` | When the event occurred |

Events are stored in the `usage_events` table with additional derived fields for temporal analysis:

```sql
CREATE TABLE usage_events (
  id              TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  channel         TEXT,
  description     TEXT,
  category        TEXT,
  skills_used     TEXT,              -- JSON array
  score           REAL,
  timestamp       TEXT NOT NULL,
  day             TEXT NOT NULL,     -- YYYY-MM-DD for daily grouping
  hour            INTEGER,          -- 0-23 for time-of-day patterns
  day_of_week     INTEGER           -- 0-6 for weekly patterns
);

CREATE INDEX idx_events_day ON usage_events(day);
```

The `day`, `hour`, and `day_of_week` fields are derived from `timestamp` at insert time to enable efficient temporal queries without date parsing in SQL.

### What Gets Logged

| Activity | Event Type | Example Description |
|----------|-----------|-------------------|
| Running a task | `Task` | "Add error handling to src/api.rs" |
| REPL command | `Command` | "/model executor ollama/codestral" |
| Skill activation | `SkillUse` | "morning-slack-summary executed" |
| Integration action | `Integration` | "slack_read(#engineering): 87 messages" |

## Pattern Miner

The `PatternMiner` analyzes the event log to detect three types of patterns:

### Pattern Type 1: Recurring Tasks

Tasks with semantically similar descriptions that appear multiple times. Detection uses embedding similarity to cluster events.

**Process:**
1. Embed all task descriptions from the lookback window.
2. Cluster embeddings by cosine similarity (threshold: 0.75).
3. Clusters with 3+ members are candidate patterns.
4. Check for schedule regularity (daily, weekly, ad-hoc).

**Example:** If you run "Summarize Slack discussions" 7 times over 2 weeks at roughly the same time each morning, the miner detects a daily recurring task.

### Pattern Type 2: Time-Based Patterns

Tasks that occur at consistent times of day or days of the week, regardless of content similarity.

**Process:**
1. Group events by `hour` and `day_of_week`.
2. Identify time slots with statistically significant activity.
3. Cross-reference with content to determine if the same type of work happens at the same time.

**Example:** Every Monday at 10am you run a task related to "meeting notes." The miner detects a weekly time-based pattern.

### Pattern Type 3: Workflow Sequences

Chains of tasks that consistently occur in the same order.

**Process:**
1. Build a sequence graph of task categories within sessions.
2. Identify repeated subsequences (length 2+).
3. Sequences occurring 3+ times become workflow candidates.

**Example:** You consistently run "review PR" followed by "fix issues" followed by "run tests." The miner detects a 3-step workflow sequence.

### Mining Execution

```rust
pub struct PatternMiner {
    db: Arc<Database>,
    embedder: Arc<dyn ModelProvider>,
}

impl PatternMiner {
    pub async fn mine(&self, lookback_days: u32) -> Result<Vec<DetectedPattern>> {
        let events = self.db.query_events_since(days_ago(lookback_days)).await?;
        let mut patterns = Vec::new();

        // 1. Recurring tasks: cluster by embedding similarity
        patterns.extend(self.detect_recurring_tasks(&events).await?);

        // 2. Time-based patterns: consistent time slots
        patterns.extend(self.detect_time_patterns(&events));

        // 3. Workflow sequences: ordered task chains
        patterns.extend(self.detect_workflows(&events));

        // Filter by confidence and sample count
        patterns.retain(|p| p.confidence >= 0.6 && p.sample_count >= 3);
        Ok(patterns)
    }
}
```

### Filtering Thresholds

Detected patterns must meet minimum thresholds before they are surfaced:

| Filter | Threshold | Purpose |
|--------|-----------|---------|
| `confidence` | >= 0.6 | Minimum confidence to consider a pattern real |
| `sample_count` | >= 3 | Minimum occurrences to avoid false positives from coincidences |

These are the internal detection thresholds. The `min_confidence` and `min_samples` in the config (see below) apply to skill proposal and are typically stricter.

## Configuration

Pattern mining is configured in the `[patterns]` section of `config.toml`:

```toml
[patterns]
enabled = true               # Enable/disable pattern mining entirely
mine_interval_hours = 24     # How often to run the miner (hours)
min_confidence = 0.7         # Minimum confidence to propose a skill
min_samples = 3              # Minimum event count to propose a skill
auto_propose = true          # Automatically generate SKILL.md proposals
```

| Setting | Default | Description |
|---------|---------|-------------|
| `enabled` | `true` | Master switch for the pattern mining pipeline |
| `mine_interval_hours` | `24` | Mining runs once per interval. Lower values detect patterns faster but cost more CPU. |
| `min_confidence` | `0.7` | A pattern must reach this confidence before a skill is proposed. Higher values mean fewer but more reliable proposals. |
| `min_samples` | `3` | Minimum number of matching events. Prevents proposals based on 1-2 coincidences. |
| `auto_propose` | `true` | When `true`, the SkillProposer automatically generates SKILL.md files. When `false`, patterns are detected but not proposed. |

## Skill Proposer

When a pattern passes the confidence and sample count thresholds, the `SkillProposer` generates a SKILL.md file for it.

### Proposal Process

1. The planner model generates a SKILL.md with YAML frontmatter and instruction body based on the detected pattern.
2. The generated file is written to `~/.local/share/openkoi/skills/proposed/<skill-name>/SKILL.md`.
3. The pattern record in `usage_patterns` is updated with `proposed_skill = <skill-name>` and `status = 'proposed'`.

```rust
impl SkillProposer {
    pub async fn propose(&self, pattern: &DetectedPattern) -> Result<SkillProposal> {
        let skill_md = self.generate_skill_md(pattern).await?;

        let skill_dir = format!(
            "{}/skills/proposed/{}",
            data_dir(),
            slugify(&pattern.description)
        );
        fs::create_dir_all(&skill_dir).await?;
        fs::write(format!("{}/SKILL.md", skill_dir), &skill_md).await?;

        Ok(SkillProposal {
            name: slugify(&pattern.description),
            confidence: pattern.confidence,
            skill_md,
        })
    }
}
```

### Generated Skill Example

For a detected "morning Slack summary" pattern, the proposer might generate:

```yaml
---
name: morning-slack-summary
description: >
  Fetches messages from configured Slack channels since yesterday.
  Summarizes key discussions, decisions, and action items.
metadata:
  openclaw:
    os: ["darwin", "linux"]
    requires:
      env: ["SLACK_BOT_TOKEN"]
  openkoi:
    category: "communication"
    trigger:
      type: time
      schedule: { hour: 9, days: [1,2,3,4,5] }
    learned_from: "pattern:abc123"
---

# Morning Slack Summary

Fetch all messages from the configured Slack channels since the
previous business day. Summarize key discussions, decisions made,
and action items assigned. Format the summary with sections per
channel.
```

### Evaluator Skill Proposals

The pattern miner can also propose **evaluator skills** when it detects the user repeatedly evaluates a certain type of output with consistent criteria. For example, if you frequently review database migration scripts and consistently flag the same types of issues, the system may propose a `migration-review` evaluator skill with a rubric tuned to your standards.

## User Interaction

The `openkoi learn` command is the user interface for reviewing patterns and proposed skills.

### Reviewing Patterns and Proposals

```
$ openkoi learn

Patterns detected (last 30 days):
  recurring  "Morning Slack summary"          daily  18x  conf: 0.89
  workflow   "PR review -> fix -> test"       3x/wk  12x  conf: 0.82
  recurring  "Weekly meeting notes to Notion"  weekly  4x  conf: 0.75

Proposed skills:
  1. morning-slack-summary (conf: 0.89)
     "Fetch Slack messages, summarize discussions and action items."
     [a]pprove  [d]ismiss  [v]iew

  2. pr-review-workflow (conf: 0.82)
     "Full PR review: checkout, review, fix, test, merge."
     [a]pprove  [d]ismiss  [v]iew
```

### Actions

| Key | Action | Effect |
|-----|--------|--------|
| `a` | Approve | Skill is moved from `proposed/` to `user/` and becomes active. If the skill has a schedule trigger, it is optionally scheduled. |
| `d` | Dismiss | Skill is removed from `proposed/`. The pattern remains in the database but its status is set to `'dismissed'`. It will not be re-proposed unless the pattern strengthens significantly. |
| `v` | View | Shows the full SKILL.md content so you can inspect the generated instructions and metadata before deciding. |

### Approval Flow

```
> a
Approved: morning-slack-summary
  Saved to ~/.local/share/openkoi/skills/user/morning-slack-summary/
  Scheduled: daily at 09:00 (weekdays)
```

On approval:
1. The SKILL.md is moved from `skills/proposed/` to `skills/user/`.
2. The pattern status is updated to `'approved'` in the database.
3. If the skill has a `trigger.type: time` in its metadata, OpenKoi offers to schedule it via the daemon.
4. The skill becomes immediately available for the skill selector to rank and use.

### REPL Access

You can also access pattern review from the interactive REPL:

```
$ openkoi chat
> /learn
  1 new pattern detected: "JWT auth setup" (seen 4x, confidence: 0.78)
    [a]pprove  [d]ismiss  [v]iew
```

## Pattern Lifecycle

The full lifecycle of a pattern from first detection to active skill:

```
Events accumulate in usage_events
         |
         v
PatternMiner detects pattern -----> status: 'detected'
         |
         | confidence >= min_confidence
         | sample_count >= min_samples
         v
SkillProposer generates SKILL.md -> status: 'proposed'
         |                           location: skills/proposed/
         |
   User reviews via `openkoi learn`
         |
    +----+----+
    |         |
 Approve   Dismiss
    |         |
    v         v
 status:    status:
 'approved' 'dismissed'
    |
    v
 Skill moved to skills/user/
 Available for skill selector
 Optionally scheduled
```

Dismissed patterns are not deleted -- they remain in the database so the system does not re-propose them. However, if a dismissed pattern's confidence later increases substantially (e.g., from 0.75 to 0.92 due to continued usage), it may be re-proposed.

## Integration with the Learning System

Pattern mining and the learning system (covered in [Memory & Learning](./memory-learning)) serve complementary roles:

| System | Scope | Output | Trigger |
|--------|-------|--------|---------|
| **Learning Extractor** | Single task | Heuristics, anti-patterns, preferences | After each task completes |
| **Pattern Miner** | Across many tasks | Proposed skills, workflow automations | Periodic (default: daily) |

The learning extractor asks "what did I learn from this one task?" The pattern miner asks "what have I been doing repeatedly across many tasks?" Together, they enable OpenKoi to both improve individual task quality and automate recurring workflows.

### Feedback Loop

Approved skills that run via the daemon generate their own `SkillUse` events, which feed back into the event log. This means the pattern miner can detect patterns within automated workflows -- for example, noticing that a scheduled skill consistently fails on Mondays and proposing an adjustment.

Skill effectiveness data from the learning system also influences which proposed skills the user sees. If a proposed skill's category has historically low effectiveness scores, the proposal may include a note about this.
