# World (World Model)

`openkoi world` lets you inspect the agent's internal world model — its understanding of tools, domains, and humans. The world model is updated by every interaction and failure, building an increasingly accurate map of reality.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `tools [name]` | Tool Atlas: reliability scores, failure modes, call history. Drill into a specific tool by name. |
| `domains` | Domain Atlas: learned domain knowledge and expertise areas |
| `human` | Human Atlas: what the agent knows about your preferences and style |
| `map` | Full World Map overview |

When run without a subcommand, defaults to `map`.

## The Three Atlases

The world model consists of three atlases, each tracking a different dimension of reality:

| Atlas | What It Tracks | Updated By |
|-------|---------------|------------|
| **Tool Atlas** | Tool reliability, failure modes, learned workarounds | Every tool call (success or failure) |
| **Domain Atlas** | Domain knowledge, expertise areas, confidence levels | Task outcomes and learnings |
| **Human Atlas** | User preferences, communication style, work patterns | Interaction patterns over time |

## `openkoi world tools`

Shows the Tool Atlas — every tool the agent has used, with reliability scores and failure history:

```
$ openkoi world tools

╭─────────────────────────────────────────────────────────────╮
│ TOOL ATLAS — 23 known tools                                  │
│                                                              │
│  Tool               Reliability  Calls  Fails  Last Failure  │
│  ───────────────────────────────────────────────────────────  │
│  github-api          0.94        142    8      2d ago (429)   │
│  slack-webhook       0.99        89     1      12d ago        │
│  sqlite-query        1.00        234    0      —              │
│  openai-gpt4         0.91        67     6      1d ago (timeout│
│  google-docs-api     0.87        31     4      5d ago (auth)  │
│  web-scraper          0.72        18     5      today (blocked│
│  ···                                                          │
│                                                              │
│ Drill into any tool: openkoi world tools github-api          │
╰─────────────────────────────────────────────────────────────╯
```

### `openkoi world tools <name>`

Drills into a specific tool, showing all known failure modes with learned workarounds:

```
$ openkoi world tools github-api

╭─────────────────────────────────────────────────────────────╮
│ TOOL: github-api                                             │
│                                                              │
│ Reliability: 0.94 (142 calls, 8 failures)                   │
│                                                              │
│ ┌─ KNOWN FAILURE MODES ──────────────────────────────────┐  │
│ │                                                         │  │
│ │  1. Rate limit (HTTP 429)                               │  │
│ │     Frequency: 5 times                                  │  │
│ │     Learned: "Limit is 5000/hr. Resets at :00.          │  │
│ │     Workaround: batch requests < 50/min"                │  │
│ │     Confidence: 0.92                                    │  │
│ │                                                         │  │
│ │  2. Search returns stale results                        │  │
│ │     Frequency: 2 times                                  │  │
│ │     Learned: "Search index lags by ~2 minutes.          │  │
│ │     Workaround: wait 3min after push before searching"  │  │
│ │     Confidence: 0.71                                    │  │
│ │                                                         │  │
│ │  3. 422 on emoji in branch names                        │  │
│ │     Frequency: 1 time                                   │  │
│ │     Learned: "Strip emoji from branch names before      │  │
│ │     API call"                                           │  │
│ │     Confidence: 0.55                                    │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ Class generalization:                                        │
│    "REST APIs with auth tokens tend to have undocumented     │
│     rate limits. Always check for X-RateLimit headers."      │
│    Applied to: github-api, notion-api, slack-api              │
╰─────────────────────────────────────────────────────────────╯
```

Each failure mode includes the frequency, what was learned, and a confidence score. The agent uses this data to avoid known failure modes proactively.

**Class generalization** is where the agent applies learnings across similar tools. If it learns that REST APIs have undocumented rate limits from GitHub, it applies that caution to Notion and Slack APIs as well.

## `openkoi world domains`

Shows the Domain Atlas — areas where the agent has built up knowledge:

```
$ openkoi world domains

╭─────────────────────────────────────────────────────────────╮
│ DOMAIN ATLAS — 8 learned domains                             │
│                                                              │
│  Domain              Confidence  Tasks  Last Active          │
│  ───────────────────────────────────────────────────────     │
│  rust-development     0.91       47     today                │
│  api-design           0.85       23     yesterday            │
│  email-drafting       0.78       31     today                │
│  code-review          0.92       89     today                │
│  database-migrations  0.72       12     3 days ago           │
│  frontend-react       0.65       8      1 week ago           │
│  devops-docker        0.60       5      2 weeks ago          │
│  investor-comms       0.55       4      yesterday            │
╰─────────────────────────────────────────────────────────────╯
```

## `openkoi world human`

Shows the Human Atlas — the agent's model of your preferences and work patterns:

```
$ openkoi world human

╭─────────────────────────────────────────────────────────────╮
│ HUMAN ATLAS — Yong                                           │
│                                                              │
│ ┌─ PREFERENCES ──────────────────────────────────────────┐  │
│ │  Communication: Direct, concise, technical              │  │
│ │  Code style: Functional, minimal abstractions           │  │
│ │  Review style: Focuses on correctness then style        │  │
│ │  Risk tolerance: Conservative (0.35)                    │  │
│ │  Cost sensitivity: Budget-conscious (0.70)              │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ WORK PATTERNS ────────────────────────────────────────┐  │
│ │  Active hours: 08:00 - 18:00 (Pacific)                  │  │
│ │  Peak productivity: mornings                            │  │
│ │  Most common tasks: code review, refactoring            │  │
│ │  Avg tasks/day: 7                                       │  │
│ └─────────────────────────────────────────────────────────┘  │
╰─────────────────────────────────────────────────────────────╯
```

## `openkoi world map`

High-level overview combining all three atlases:

```
$ openkoi world map

╭─────────────────────────────────────────────────────────────╮
│ WORLD MAP                                                    │
│                                                              │
│ Tools:   23 known  │  Avg reliability: 0.91                 │
│ Domains: 8 learned │  Strongest: code-review (0.92)         │
│ Human:   312 interactions │  47 days tracked                │
│                                                              │
│ Recent updates:                                              │
│  • web-scraper reliability dropped 0.78 → 0.72 (today)      │
│  • New domain: investor-comms (confidence: 0.55)             │
│  • Human preference learned: "prefers brevity" (0.88)        │
╰─────────────────────────────────────────────────────────────╯
```

## How the World Model Feeds Other Systems

The world model is not just for display — it actively influences the agent's behavior:

| Consumer | How It Uses the World Model |
|----------|---------------------------|
| **Parliament** | Guardian checks tool reliability before approving tool calls |
| **Orchestrator** | Avoids tools with low reliability, uses learned workarounds |
| **Sovereign Directive** | Human Atlas preferences are injected into the directive |
| **Evaluator** | Domain confidence adjusts evaluation thresholds |
| **Reflection** | World model changes are surfaced in daily/weekly reviews |

## Related Commands

- [`openkoi think`](/guide/think) — The pipeline that reads from the world model
- [`openkoi mind`](/guide/mind) — Parliament uses world model data in deliberation
- [`openkoi reflect`](/guide/reflect) — Reviews world model changes over time
