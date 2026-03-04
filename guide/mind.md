# Mind (Society of Mind)

`openkoi mind` lets you introspect the Society of Mind — the five agencies that deliberate on every task processed through `openkoi think`.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `parliament` | Show the last parliamentary deliberation |
| `agencies` | List active agencies with weights and recent verdicts |
| `dissent` | Show cases where agencies disagreed |
| `calibrate` | Review agency prediction accuracy vs. actual outcomes |

When run without a subcommand, defaults to `parliament`.

## The Five Agencies

Every task that passes through `openkoi think` is evaluated by five agencies before execution:

| Agency | Role | Focus |
|--------|------|-------|
| **Guardian** | Safety & reversibility | Can this be undone? What's the blast radius? Has veto power. |
| **Economist** | Cost & efficiency | Token cost, API calls, time budget. Optimizes for frugality. |
| **Empath** | Human impact | Recipient experience, tone, timing, social awareness. |
| **Scholar** | Factual accuracy | Evidence quality, source verification, confidence levels. |
| **Strategist** | Final synthesis | Weighs all agencies, resolves conflicts, decides proceed/block/escalate. |

Each agency votes independently: **APPROVE**, **APPROVE+** (with caveat), **ABSTAIN**, or **BLOCK**. The Guardian can unilaterally block any action.

## `openkoi mind parliament`

Shows the most recent parliamentary deliberation record:

```
$ openkoi mind parliament

╭─────────────────────────────────────────────────────────────╮
│ LAST DELIBERATION                                            │
│                                                              │
│ Task: "Draft a response to the investor email from Alice"    │
│ Time: 2026-03-04 09:15                                      │
│                                                              │
│  Guardian   APPROVE     — Draft mode, reversible             │
│  Economist  APPROVE     — ~$0.01, one inference              │
│  Empath     APPROVE+    — "Add a reassurance note"           │
│  Scholar    APPROVE+    — "Verify investor name"             │
│  Strategist PROCEED     — with Empath & Scholar caveats      │
│                                                              │
│ Outcome: Executed successfully                               │
╰─────────────────────────────────────────────────────────────╯
```

## `openkoi mind agencies`

Lists all agencies with their current weights and a summary of recent activity:

```
$ openkoi mind agencies

╭─────────────────────────────────────────────────────────────╮
│ AGENCIES                                                     │
│                                                              │
│  Agency      Weight  Last 7d   Accuracy                     │
│  ─────────────────────────────────────────                   │
│  Guardian     0.30    12 votes   100%                        │
│  Economist    0.20    12 votes   92%                         │
│  Empath       0.15    10 votes   85%                         │
│  Scholar      0.20    11 votes   89%                         │
│  Strategist   0.15    12 votes   94%                         │
╰─────────────────────────────────────────────────────────────╯
```

Weights are adjusted over time based on calibration data. Agencies that are consistently accurate gain more influence.

## `openkoi mind dissent`

Shows cases where agencies disagreed — these are the most interesting deliberations because they reveal decision boundaries:

```
$ openkoi mind dissent

╭─────────────────────────────────────────────────────────────╮
│ DISSENT RECORDS — Last 7 days                                │
│                                                              │
│  Mar 4  "Delete staging DB"                                  │
│         Guardian: BLOCK  │  Economist: APPROVE               │
│         Resolution: BLOCKED (Guardian veto)                  │
│         Outcome: Correct — DB was still referenced           │
│                                                              │
│  Mar 3  "Send casual Slack reply"                            │
│         Empath: APPROVE  │  Scholar: ABSTAIN                 │
│         Resolution: APPROVED                                 │
│         Outcome: Reply was well-received                     │
│                                                              │
│  Mar 1  "Deploy to production at 5 PM Friday"                │
│         Guardian: BLOCK  │  Economist: APPROVE               │
│         Resolution: BLOCKED                                  │
│         Outcome: Correct — deploy would have hit peak        │
╰─────────────────────────────────────────────────────────────╯
```

## `openkoi mind calibrate`

Reviews historical accuracy: how often each agency's prediction matched the actual outcome. This is essential for understanding whether the agent's judgment is well-calibrated:

```
$ openkoi mind calibrate

╭─────────────────────────────────────────────────────────────╮
│ AGENCY CALIBRATION — Last 30 days                            │
│                                                              │
│  Agency      Predictions  Correct  Accuracy  Trend          │
│  ──────────────────────────────────────────────────          │
│  Guardian     28           28       100%      ━━━ stable     │
│  Economist    45           41       91%       ↑ improving    │
│  Empath       32           27       84%       ━━━ stable     │
│  Scholar      38           34       89%       ↑ improving    │
│  Strategist   45           42       93%       ━━━ stable     │
│                                                              │
│ Overall judgment accuracy: 91%                               │
╰─────────────────────────────────────────────────────────────╯
```

## Related Commands

- [`openkoi think`](/guide/think) — The command that triggers parliamentary deliberation
- [`openkoi soul`](/guide/soul-system) — The Sovereign identity that generates directives
- [`openkoi reflect honest`](/guide/reflect) — Epistemic audit of where the agent was wrong
