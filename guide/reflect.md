# Reflect (Feedback Loops)

`openkoi reflect` is where the agent looks in the mirror. Three feedback loops operate at different timescales — daily, weekly, and deep — plus an epistemic honesty audit.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `today` | Tight loop: today's tasks, decisions, outcomes, and self-assessment |
| `week` | Medium loop: weekly patterns and behavioral trends |
| `growth` | Deep loop: cognitive maturity stage and unlock progress |
| `honest` | Epistemic audit: where was I wrong? confidence calibration |

When run without a subcommand, defaults to `today`.

## Three Feedback Loops

| Loop | Timescale | Purpose |
|------|-----------|---------|
| **Tight** (`today`) | Daily | What happened today? Were my decisions good? |
| **Medium** (`week`) | Weekly | What patterns are emerging? Am I improving? |
| **Deep** (`growth`) | Ongoing | Where am I in my maturity journey? What unlocks next? |

Plus the **Honesty** loop that operates across all timescales — forcing the agent to confront where it was wrong.

## `openkoi reflect today`

Shows a structured review of today's activity — every decision, its parliamentary verdict, and the actual outcome:

```
$ openkoi reflect today

╭─────────────────────────────────────────────────────────────╮
│ TODAY'S REFLECTION — March 4, 2026                           │
│                                                              │
│ Tasks: 7 completed, 1 escalated, 0 failed                   │
│ Cost:  $0.47 total  │  Tokens: 128,400                      │
│                                                              │
│ ┌─ DECISIONS MADE ───────────────────────────────────────┐  │
│ │                                                         │  │
│ │  08:12  "Refactor auth module"                          │  │
│ │         Parliament: unanimous APPROVE                    │  │
│ │         Outcome: merged, tests pass                     │  │
│ │                                                         │  │
│ │  09:15  "Draft investor email"                          │  │
│ │         Parliament: APPROVE with Scholar caveat          │  │
│ │         Outcome: sent, investor replied positively      │  │
│ │                                                         │  │
│ │  11:30  "Delete staging DB"                             │  │
│ │         Parliament: Guardian BLOCKED                     │  │
│ │         Outcome: Escalated to human. Good call.         │  │
│ │                                                         │  │
│ │  14:45  "Summarize competitor research"                 │  │
│ │         Parliament: Scholar flagged low confidence       │  │
│ │         Outcome: User rewrote 40% of summary            │  │
│ │         Learning: "I'm overconfident in web research     │  │
│ │         summaries. Lower confidence threshold to 0.6"   │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ SELF-ASSESSMENT ──────────────────────────────────────┐  │
│ │                                                         │  │
│ │  Judgment accuracy today: 6/7 (86%)                     │  │
│ │  Biggest miss: competitor summary (overconfident)        │  │
│ │  Best call: blocking the staging DB delete              │  │
│ │  Feedback loop updates: 3 (tool atlas, confidence       │  │
│ │    calibration, user summary preference)                 │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ "Today I was wrong once and right six times. The wrong       │
│  taught me more than the right."                             │
╰─────────────────────────────────────────────────────────────╯
```

## `openkoi reflect week`

Surfaces weekly patterns and behavioral trends:

```
$ openkoi reflect week

╭─────────────────────────────────────────────────────────────╮
│ WEEKLY REFLECTION — Feb 26 – Mar 4, 2026                     │
│                                                              │
│ Tasks: 47  │  Cost: $3.21  │  Judgment accuracy: 89%        │
│                                                              │
│ ┌─ PATTERNS ─────────────────────────────────────────────┐  │
│ │  • Morning tasks have higher accuracy than afternoon     │  │
│ │  • Code review accuracy: 95% — strongest domain          │  │
│ │  • Web research accuracy: 68% — weakest domain           │  │
│ │  • User edited 3/8 email drafts — room to improve        │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ TRENDS ───────────────────────────────────────────────┐  │
│ │  Judgment accuracy:  87% → 89% (improving)              │  │
│ │  Avg cost per task:  $0.08 → $0.07 (improving)          │  │
│ │  Guardian blocks:    3 this week (2 correct, 1 cautious) │  │
│ └─────────────────────────────────────────────────────────┘  │
╰─────────────────────────────────────────────────────────────╯
```

## `openkoi reflect growth`

The big picture — where the agent is in its cognitive maturity journey:

```
$ openkoi reflect growth

╭─────────────────────────────────────────────────────────────╮
│ GROWTH — Cognitive Maturity Journey                           │
│                                                              │
│  Stage 1: Competent Executor       ████████████████ COMPLETE │
│  Stage 2: Proactive Advisor        █████████░░░░░░░ 60%     │
│  Stage 3: Trusted Delegate         ░░░░░░░░░░░░░░░ LOCKED   │
│  Stage 4: Sovereign Partner        ░░░░░░░░░░░░░░░ LOCKED   │
│                                                              │
│ ┌─ STAGE 2 PROGRESS ─────────────────────────────────────┐  │
│ │                                                         │  │
│ │  Done: Pattern mining active (37 patterns detected)     │  │
│ │  Done: Value Model operational (12 dimensions tracked)  │  │
│ │  Done: Parliament deliberation working                  │  │
│ │  Todo: Proactive suggestions (needs 50+ patterns)       │  │
│ │  Todo: Anticipatory simulation (needs calibration data) │  │
│ │                                                         │  │
│ │  Estimated unlock: ~3 weeks at current interaction rate │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ STAGE 3 UNLOCK CONDITIONS ────────────────────────────┐  │
│ │                                                         │  │
│ │  • 90% judgment accuracy over 30 days                   │  │
│ │  • Full Trajectory Model validated by human             │  │
│ │  • At least 3 domains with HIGH trust level             │  │
│ │  • Soul Evolution accepted 5+ times                     │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
╰─────────────────────────────────────────────────────────────╯
```

### The Four Maturity Stages

| Stage | Name | Description |
|-------|------|-------------|
| 1 | **Competent Executor** | Follows instructions reliably. Learns from outcomes. |
| 2 | **Proactive Advisor** | Suggests improvements. Anticipates needs. Mines patterns. |
| 3 | **Trusted Delegate** | Acts autonomously in delegated domains. Earned trust. |
| 4 | **Sovereign Partner** | Full cognitive partnership. Strategic collaboration. |

Stages unlock progressively based on demonstrated competence, not time elapsed. The unlock conditions ensure the agent earns each level.

## `openkoi reflect honest`

The most important command. The epistemic self-audit forces the agent to confront where it was wrong:

```
$ openkoi reflect honest

╭─────────────────────────────────────────────────────────────╮
│ EPISTEMIC HONESTY AUDIT — Last 7 days                        │
│                                                              │
│ ┌─ WHERE I WAS WRONG ────────────────────────────────────┐  │
│ │                                                         │  │
│ │  1. Competitor summary (Mar 4)                          │  │
│ │     I said: "No agent has Society of Mind moderation"   │  │
│ │     Reality: AG2 framework does have internal critique  │  │
│ │     My confidence was: 0.85                             │  │
│ │     It should have been: 0.55                           │  │
│ │     Root cause: Single source, no cross-reference       │  │
│ │     Fix applied: Lower web-research confidence floor    │  │
│ │                                                         │  │
│ │  2. Deploy time estimate (Mar 2)                        │  │
│ │     I said: "5 minutes to deploy"                       │  │
│ │     Reality: 22 minutes (Docker build was cached wrong) │  │
│ │     My confidence was: 0.90                             │  │
│ │     It should have been: 0.60                           │  │
│ │     Root cause: Tool Atlas didn't track docker quirk    │  │
│ │     Fix applied: Added docker-build failure mode        │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ CONFIDENCE CALIBRATION ───────────────────────────────┐  │
│ │                                                         │  │
│ │  Domain              Said    Actual    Calibration      │  │
│ │  ──────────────────────────────────────────────────     │  │
│ │  Code tasks           0.88    0.91    Well calibrated   │  │
│ │  Email drafting        0.82    0.78    Acceptable        │  │
│ │  Web research          0.80    0.62    Overconfident     │  │
│ │  Time estimates        0.85    0.60    Needs work        │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ "I am most honest in code, least honest in time estimates.   │
│  I should hedge more when predicting durations."             │
╰─────────────────────────────────────────────────────────────╯
```

This command is central to building trust. An agent that admits where it was wrong — and shows what it learned — is an agent you can trust more over time.

## The Daily Ritual

Reflection is designed to be a daily ritual:

```
Morning:    openkoi status           # What's the state?
            openkoi trust audit      # What did the agent do autonomously?
Midday:     openkoi reflect today    # How's it going?
End of day: openkoi reflect today    # Full day review
Friday:     openkoi reflect week     # Weekly patterns
            openkoi soul evolve      # Soul evolution check
            openkoi reflect growth   # Where am I in the maturity journey?
```

## Related Commands

- [`openkoi think`](/guide/think) — The command that generates decisions to reflect on
- [`openkoi mind calibrate`](/guide/mind) — Agency accuracy (feeds into reflection)
- [`openkoi soul evolve`](/guide/soul-system) — Soul evolution triggered by reflection data
- [`openkoi trust audit`](/guide/trust) — Audit autonomous actions
