# Memory & Learning

OpenKoi maintains a layered memory system that persists knowledge across sessions, enables semantic recall, and drives continuous improvement through learning extraction and decay. All data is stored locally -- no cloud dependencies.

## Storage Layout

OpenKoi follows XDG conventions, splitting configuration from data:

```
~/.openkoi/                              # XDG_CONFIG_HOME/openkoi
  config.toml                            # Configuration (TOML)
  credentials/                           # API keys (chmod 600)
    providers.json
    integrations.json
  SOUL.md                                # Agent identity (user-editable)

~/.local/share/openkoi/                  # XDG_DATA_HOME/openkoi
  openkoi.db                             # SQLite (structured data + vectors)
  sessions/
    <session-id>/
      transcript.jsonl                   # Full transcripts (episodic memory)
      <task-id>.md                       # Saved task output (per-task)
  skills/
    managed/                             # Installed skills
    proposed/                            # Auto-proposed from pattern mining
    user/                                # User-created task skills
  evaluators/
    managed/                             # Installed evaluator skills
    proposed/                            # Auto-proposed evaluator skills
    user/                                # User-created evaluator skills
  plugins/
    wasm/                                # WASM plugin binaries
    scripts/                             # Rhai scripts
```

The configuration directory (`~/.openkoi/`) holds user-facing files: settings, credentials, and the soul document. The data directory (`~/.local/share/openkoi/`) holds operational data: the database, session transcripts, skills, and plugins.

You can override these paths with environment variables:

```bash
OPENKOI_HOME=~/my-openkoi          # overrides both config and data dirs
OPENKOI_CONFIG=~/.openkoi/config.toml
OPENKOI_DATA=~/.local/share/openkoi
```

`OPENKOI_HOME` sets the root for **all** OpenKoi directories — config files go under `$OPENKOI_HOME/` and data files under `$OPENKOI_HOME/data/`. It takes precedence over `OPENKOI_CONFIG` and `OPENKOI_DATA` when set.

## SQLite Schema

All structured data lives in a single SQLite database (`openkoi.db`). Vector search is provided by `sqlite-vec` loaded as an extension. Full-text search uses SQLite's built-in FTS5.

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `sessions` | Tracks conversation sessions | `id`, `channel`, `model_provider`, `model_id`, `status`, `total_tokens`, `total_cost_usd`, `transcript_path`, `ended_at` |
| `tasks` | Records every task and its outcome | `id`, `description`, `category`, `session_id`, `final_score`, `iterations`, `decision`, `total_tokens`, `total_cost_usd`, `output_path` |
| `iteration_cycles` | Per-iteration data within a task | `id`, `task_id`, `iteration`, `score`, `decision`, `input_tokens`, `output_tokens`, `duration_ms` |
| `findings` | Individual evaluation findings | `id`, `cycle_id`, `severity`, `dimension`, `title`, `description`, `location`, `fix`, `resolved_in` |
| `learnings` | Extracted knowledge from task outcomes | `id`, `type`, `content`, `category`, `confidence`, `source_task`, `reinforced`, `last_used`, `expires_at` |
| `skill_effectiveness` | Performance tracking per skill per category | `skill_name`, `task_category`, `avg_score`, `sample_count`, `last_used` |

### Memory Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `memory_chunks` | Source text for semantic memory | `id`, `source`, `text`, `created_at` |
| `memory_vec` | Vector index (sqlite-vec virtual table) | `id`, `embedding float[1536]` |
| `memory_fts` | Full-text search index (FTS5 virtual table) | `text` (content synced from `memory_chunks`) |

### Usage & Pattern Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `usage_events` | Raw event log for pattern mining | `id`, `event_type`, `channel`, `description`, `category`, `skills_used` (JSON), `score`, `timestamp`, `day`, `hour`, `day_of_week` |
| `usage_patterns` | Detected recurring patterns | `id`, `pattern_type`, `description`, `frequency`, `trigger_json`, `confidence`, `sample_count`, `proposed_skill`, `status` |
| `_migrations` | Schema version tracking | `version`, `name`, `applied_at` |

### Full Schema (SQL)

```sql
CREATE TABLE sessions (
  id              TEXT PRIMARY KEY,
  channel         TEXT,
  model_provider  TEXT,
  model_id        TEXT,
  status          TEXT DEFAULT 'active',
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  ended_at        TEXT,
  total_tokens    INTEGER DEFAULT 0,
  total_cost_usd  REAL DEFAULT 0.0,
  transcript_path TEXT
);

CREATE TABLE tasks (
  id              TEXT PRIMARY KEY,
  description     TEXT NOT NULL,
  category        TEXT,
  session_id      TEXT REFERENCES sessions(id),
  final_score     REAL,
  iterations      INTEGER,
  decision        TEXT,
  total_tokens    INTEGER,
  total_cost_usd  REAL,
  output_path     TEXT,
  created_at      TEXT NOT NULL,
  completed_at    TEXT
);

CREATE TABLE iteration_cycles (
  id              TEXT PRIMARY KEY,
  task_id         TEXT NOT NULL REFERENCES tasks(id),
  iteration       INTEGER NOT NULL,
  score           REAL,
  decision        TEXT NOT NULL,
  input_tokens    INTEGER,
  output_tokens   INTEGER,
  duration_ms     INTEGER,
  created_at      TEXT NOT NULL,
  UNIQUE(task_id, iteration)
);

CREATE TABLE findings (
  id              TEXT PRIMARY KEY,
  cycle_id        TEXT REFERENCES iteration_cycles(id),
  severity        TEXT NOT NULL,
  dimension       TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  location        TEXT,
  fix             TEXT,
  resolved_in     TEXT REFERENCES iteration_cycles(id)
);

CREATE TABLE learnings (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  content         TEXT NOT NULL,
  category        TEXT,
  confidence      REAL NOT NULL,
  source_task     TEXT REFERENCES tasks(id),
  reinforced      INTEGER DEFAULT 0,
  created_at      TEXT NOT NULL,
  last_used       TEXT,
  expires_at      TEXT
);

CREATE TABLE skill_effectiveness (
  skill_name      TEXT NOT NULL,
  task_category   TEXT NOT NULL,
  avg_score       REAL NOT NULL,
  sample_count    INTEGER NOT NULL,
  last_used       TEXT NOT NULL,
  PRIMARY KEY (skill_name, task_category)
);

CREATE TABLE memory_chunks (
  id              TEXT PRIMARY KEY,
  source          TEXT NOT NULL,
  text            TEXT NOT NULL,
  created_at      TEXT NOT NULL
);

CREATE VIRTUAL TABLE memory_vec USING vec0(
  id TEXT PRIMARY KEY,
  embedding float[1536]
);

CREATE VIRTUAL TABLE memory_fts USING fts5(
  text, content='memory_chunks', content_rowid='rowid'
);

CREATE TABLE usage_events (
  id              TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  channel         TEXT,
  description     TEXT,
  category        TEXT,
  skills_used     TEXT,
  score           REAL,
  timestamp       TEXT NOT NULL,
  day             TEXT NOT NULL,
  hour            INTEGER,
  day_of_week     INTEGER
);

CREATE TABLE usage_patterns (
  id              TEXT PRIMARY KEY,
  pattern_type    TEXT NOT NULL,
  description     TEXT NOT NULL,
  frequency       TEXT,
  trigger_json    TEXT,
  confidence      REAL NOT NULL,
  sample_count    INTEGER NOT NULL,
  first_seen      TEXT NOT NULL,
  last_seen       TEXT NOT NULL,
  proposed_skill  TEXT,
  status          TEXT DEFAULT 'detected'
);

CREATE INDEX idx_events_day ON usage_events(day);
CREATE INDEX idx_learnings_type ON learnings(type);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created ON sessions(created_at);
CREATE INDEX idx_tasks_session ON tasks(session_id);
```

## Memory Layers

OpenKoi uses five distinct memory layers, each serving a different temporal and functional role:

| Layer | Name | Storage | Lifetime | Purpose |
|-------|------|---------|----------|---------|
| 1 | **Working Memory** | LLM context window | Single turn | Active reasoning; compressed between iterations |
| 2 | **Task Memory** | In-process structs | Single task | Accumulates iteration cycles; flushed to SQLite on completion |
| 3 | **Long-term Memory** | SQLite + vec + FTS5 | Persistent | Learnings, task history, semantic search across all past data |
| 4 | **Episodic Memory** | JSONL transcripts | Persistent | Complete session transcripts, indexed into chunks for recall |
| 5 | **Skill Memory** | SKILL.md files + effectiveness matrix | Persistent | Reusable instructions plus per-category performance tracking |

### How the Layers Interact

```
Working Memory (context window)
       ^
       | recall / inject
       |
Task Memory (in-process)
       |
       | flush on completion
       v
Long-term Memory (SQLite) <---> Episodic Memory (JSONL)
       ^                               |
       | effectiveness updates          | chunk + embed
       |                               v
Skill Memory (SKILL.md files)    memory_chunks + memory_vec
```

During a task, the orchestrator pulls relevant context from long-term memory into working memory via the recall system. When a task completes, task memory is persisted to SQLite. Session transcripts are written as JSONL and their key content is chunked into the embedding index.

## Context Compaction

When a conversation grows too long, OpenKoi compacts older messages to stay within the model's context window. Compaction triggers when the estimated token count of the message history exceeds `max_tokens`.

### Compaction Process

1. **Split point**: Messages are divided at the 2/3 mark. The older two-thirds are candidates for compaction; the recent one-third is kept intact.
2. **Fact extraction**: Before summarizing, durable facts are extracted from the old messages and persisted to long-term memory. This prevents information loss.
3. **Summarization**: The old messages are summarized to approximately 500 tokens using the LLM.
4. **Reassembly**: The compacted history becomes: `[Compacted history summary] + [recent messages]`.

```rust
pub async fn compact(
    messages: &[Message],
    max_tokens: u32,
    model: &dyn ModelProvider,
) -> Result<Vec<Message>> {
    let total = estimate_total_tokens(messages);
    if total <= max_tokens {
        return Ok(messages.to_vec());
    }

    let split_point = messages.len() * 2 / 3;
    let (old, recent) = messages.split_at(split_point);

    // Extract durable facts before summarizing
    let facts = extract_facts(old, model).await?;
    persist_facts(&facts).await?;

    // Summarize to ~500 tokens
    let summary = summarize(old, model, 500).await?;

    let mut compacted = vec![Message::system(format!(
        "[Compacted history]\n{summary}"
    ))];
    compacted.extend_from_slice(recent);
    Ok(compacted)
}
```

The key insight is that compaction is not just truncation -- it extracts facts into long-term memory first, so nothing truly important is lost.

## Learning Types

OpenKoi extracts three types of learning from completed tasks:

| Type | Pattern | Example | Use |
|------|---------|---------|-----|
| **Heuristic** | "Do X" | "Diminishing returns after 2 iterations on this type of task. Consider reducing max_iterations to 2." | Positive guidance injected into future task prompts |
| **AntiPattern** | "Don't do X" | "Iteration 2 regressed from 0.85 to 0.72. The attempted fix was counterproductive." | Highest-priority recall to prevent repeating mistakes |
| **Preference** | "X better than Y for Z" | "For SQL tasks, the sql-safety evaluator produces more actionable findings than general." | Comparative knowledge guiding skill and strategy selection |

## Learning Extraction

Learning extraction happens automatically after every task completes. It uses a two-tier approach to balance cost and depth.

### Tier 1: Rule-Based Extraction (0 Tokens)

Rule-based extraction runs on every task and costs nothing. It detects:

- **Regressions**: When a score drops by more than 0.1 between iterations, the attempted fix is recorded as an `AntiPattern`.
- **Diminishing returns**: When the last two iterations in a 3+ iteration task improved by less than 0.02, a `Heuristic` is recorded suggesting fewer iterations.
- **Recurring blockers**: When the same evaluation dimension produces 2+ blocker-severity findings across iterations, an `AntiPattern` is recorded.

### Tier 2: LLM-Assisted Extraction (~500 Tokens)

LLM extraction runs only when the task is complex enough to contain non-obvious learnings. The conditions are:

- The task ran for **2 or more iterations** (`cycles >= 2`)
- At least one evaluation produced **3 or more findings** (`findings.len() >= 3`)

When triggered, the LLM is given a tight budget (~500 tokens) and asked to extract 1-3 reusable learnings as single sentences.

```
Extract 1-3 reusable learnings from this task execution.
Each learning should be a single sentence that would help
with similar future tasks.

[Summary of iteration cycles, scores, and findings]
```

### Extraction Flow

```
Task completes
     |
     +-- Rule-based extraction (0 tokens)
     |     +-- Score regressions       --> AntiPattern
     |     +-- Diminishing returns     --> Heuristic
     |     +-- Recurring findings      --> AntiPattern
     |
     +-- LLM extraction (~500 tokens, conditional)
     |     +-- Non-obvious learnings   --> Heuristic | Preference
     |
     +-- Skill effectiveness update (0 tokens)
     |     +-- (skill_name, category, avg_score) --> skill_effectiveness table
     |
     +-- Deduplication
     |     +-- Similar existing (>0.8) --> reinforce existing
     |     +-- Novel                   --> persist new learning
     |
     +-- Persist to SQLite
```

## Learning Lifecycle

### Deduplication

Before persisting a new learning, OpenKoi checks for semantic overlap with existing learnings. If `text_similarity` between a new learning and an existing one exceeds **0.8**, the new learning is dropped and the existing learning is reinforced instead (its confidence is bumped and `last_used` is updated).

### Skill Effectiveness Updates

After every task, each skill that was used has its effectiveness record updated:

```sql
-- Upsert into skill_effectiveness
INSERT INTO skill_effectiveness (skill_name, task_category, avg_score, sample_count, last_used)
VALUES (?1, ?2, ?3, 1, ?4)
ON CONFLICT(skill_name, task_category)
DO UPDATE SET
  avg_score = (avg_score * sample_count + ?3) / (sample_count + 1),
  sample_count = sample_count + 1,
  last_used = ?4;
```

This creates a running average of how well each skill performs for each task category, which feeds into the skill selector for future tasks.

### Confidence Decay

Learnings lose confidence over time unless they are reinforced by appearing relevant to new tasks. The decay formula is:

```
confidence *= exp(-rate_per_week * weeks_since_reinforced)
```

| Parameter | Default | Meaning |
|-----------|---------|---------|
| `rate_per_week` | 0.05 | Decay rate per week |
| Prune threshold | 0.1 | Learnings below this confidence are deleted |

**Example decay timeline** (starting confidence 0.8, never reinforced):

| Weeks | Confidence | Status |
|-------|-----------|--------|
| 0 | 0.80 | Active |
| 4 | 0.65 | Active |
| 8 | 0.54 | Active |
| 16 | 0.36 | Active |
| 24 | 0.24 | Active |
| 32 | 0.16 | Active |
| 40 | 0.11 | Active |
| 44 | 0.09 | **Pruned** |

A learning that is reinforced resets `last_used` to now, effectively restarting the decay clock. Frequently-reinforced learnings become long-lived knowledge.

```rust
pub fn apply_decay(learnings: &mut [Learning], rate_per_week: f32) {
    let now = Utc::now();
    for learning in learnings.iter_mut() {
        let weeks_since_reinforced = (now - learning.last_used)
            .num_days() as f32 / 7.0;
        let decay = (-rate_per_week * weeks_since_reinforced).exp();
        learning.confidence *= decay;
    }
    learnings.retain(|l| l.confidence >= 0.1);
}
```

The decay rate is configurable in `config.toml`:

```toml
[memory]
learning_decay_rate = 0.05   # per week
```

## Recall System

When a new task arrives, the Historian recalls relevant context from long-term memory. Recall is **token-budgeted** -- it fills context in priority order until the budget is exhausted.

### Recall Priority

| Priority | Category | Max Items | Rationale |
|----------|----------|-----------|-----------|
| 1 (highest) | Anti-patterns | 5 | "Don't do X" is the most valuable recall -- prevents repeating known mistakes |
| 2 | Skill recommendations | 3 | Low token cost, directly influences skill selection |
| 3 | Learnings (heuristics/preferences) | 5 | "Do X" and "prefer X over Y" guidance for the executor |
| 4 (lowest) | Similar past tasks | 3 | Expensive (full task summaries), only loaded if budget remains |

The recall budget is typically 1/10 of the total task token budget. For a default 200,000-token budget, recall gets up to 20,000 tokens.

```rust
pub async fn recall(
    &self,
    task: &TaskInput,
    token_budget: u32,
) -> Result<HistoryRecall> {
    let embedding = self.embed(&task.description).await?;
    let mut used_tokens: u32 = 0;
    let mut recall = HistoryRecall::default();

    // Priority 1: Anti-patterns
    let anti_patterns = self.query_learnings(
        LearningType::AntiPattern, &embedding, 5
    ).await?;
    for ap in anti_patterns {
        let tokens = estimate_tokens(&ap.content);
        if used_tokens + tokens > token_budget { break; }
        used_tokens += tokens;
        recall.anti_patterns.push(ap);
    }

    // Priority 2: Skill recommendations
    // Priority 3: Learnings (heuristics)
    // Priority 4: Similar past tasks (only if budget > 50% remaining)
    // ...
}
```

Similar past tasks are only loaded if less than half the recall budget has been consumed by higher-priority items. This prevents expensive task summaries from crowding out actionable learnings.

## Embeddings & Hybrid Search

### Embedding Model

OpenKoi uses `text-embedding-3-small` from OpenAI by default, producing vectors with **1536 dimensions**. The embedding model is configured separately from the chat model:

```toml
[models]
embedder = "openai/text-embedding-3-small"
```

### Vector Storage

Embeddings are stored in a `sqlite-vec` virtual table, which provides approximate nearest-neighbor search directly within SQLite:

```sql
CREATE VIRTUAL TABLE memory_vec USING vec0(
  id TEXT PRIMARY KEY,
  embedding float[1536]
);
```

### Hybrid Search

Recall uses a hybrid search strategy combining vector similarity (semantic) with FTS5 (keyword):

1. **Vector search** via `memory_vec`: Finds semantically similar content even when exact keywords differ. Used for finding similar tasks, relevant learnings, and related memory chunks.
2. **FTS5 search** via `memory_fts`: Catches exact keyword matches that embedding similarity might miss (e.g., specific function names, error codes, file paths).

Results from both searches are merged, deduplicated, and ranked by a combined score. This hybrid approach provides better recall than either method alone.

## How Learnings Feed Back

| Learning Type | Where Used | Effect |
|---------------|-----------|--------|
| `Heuristic` | Recalled into system prompt (Priority 3) | "Do X" guidance for the executor |
| `AntiPattern` | Recalled into system prompt (Priority 1) | "Don't do X" -- highest priority recall |
| `Preference` | Recalled into system prompt (Priority 3) | "Prefer X over Y" guidance |
| Skill effectiveness | Skill selector scoring | Higher-scoring skills ranked first |
| Reinforced learnings | Confidence stays high, survives decay | Long-lived knowledge |
| Unreinforced learnings | Confidence decays over time | Eventually pruned from memory |

The learning system creates a feedback loop: task outcomes produce learnings, learnings influence future tasks, and successful influence reinforces the learning. Over time, this produces an agent that avoids known pitfalls and gravitates toward strategies that work for your specific usage patterns.
