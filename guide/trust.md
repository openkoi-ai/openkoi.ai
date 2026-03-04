# Trust (Delegation)

`openkoi trust` manages trust and delegation — granting the agent autonomous action in specific domains, revoking anytime, and auditing every decision it made on its own.

Trust is **earned, not configured**. The agent starts at LOW trust in every domain. As it demonstrates accuracy (visible in `openkoi reflect` and `openkoi mind calibrate`), you can grant higher trust levels.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `show` | Current trust level per domain |
| `grant <domain> <level>` | Delegate a domain. Levels: `ask`, `suggest`, `act`, `autonomous` |
| `revoke <domain>` | Revoke delegation for a domain |
| `audit [domain]` | Audit autonomous actions taken (optionally filter by domain) |

When run without a subcommand, defaults to `show`.

## Trust Levels

| Level | Name | Behavior |
|-------|------|----------|
| `NONE` | Never | Agent will never act in this domain, even if asked |
| `LOW` / `ask` | Always ask | Agent asks before every action |
| `MEDIUM` / `suggest` | Suggest + approve | Agent proposes actions, waits for your approval |
| `HIGH` / `act` | Act, report after | Agent acts autonomously, reports what it did |
| `FULL` / `autonomous` | Fully delegated | Agent acts and only reports in daily reflection |

## `openkoi trust show`

```
$ openkoi trust show

╭─────────────────────────────────────────────────────────────╮
│ TRUST LEVELS                                                 │
│                                                              │
│  Domain               Trust    Mode           Since          │
│  ─────────────────────────────────────────────────────────   │
│  code-review           HIGH    Delegated      47 days ago    │
│  test-generation       HIGH    Delegated      32 days ago    │
│  commit-messages       HIGH    Delegated      28 days ago    │
│  email-drafting        MEDIUM  Suggest+Approve 20 days ago   │
│  slack-replies         MEDIUM  Suggest+Approve 15 days ago   │
│  file-operations       LOW     Always ask      —             │
│  deploy                LOW     Always ask      —             │
│  money/purchases       NONE    Never           —             │
│                                                              │
│ Grant trust:  openkoi trust grant <domain> <level>           │
│ Revoke trust: openkoi trust revoke <domain>                  │
╰─────────────────────────────────────────────────────────────╯
```

## `openkoi trust grant`

Grant higher trust to a specific domain:

```bash
# Grant autonomous code review
openkoi trust grant code-review autonomous

# Grant suggest-level email drafting
openkoi trust grant email-drafting suggest

# Grant basic trust for deployment
openkoi trust grant deploy ask
```

The agent confirms the grant and explains what it means:

```
$ openkoi trust grant code-review autonomous

  code-review trust level: LOW → AUTONOMOUS
  The agent will now:
    • Auto-approve low-risk PRs
    • Request changes on issues it detects
    • Flag security concerns for human review
    • Report all actions in daily reflection

  Revoke anytime: openkoi trust revoke code-review
```

## `openkoi trust revoke`

Immediately revoke delegation for a domain:

```bash
openkoi trust revoke code-review
```

```
$ openkoi trust revoke code-review

  code-review trust level: AUTONOMOUS → LOW
  The agent will now ask before any code review action.
```

## `openkoi trust audit`

Review every autonomous action the agent took. This is the accountability layer — every action taken under delegation is logged and auditable:

```
$ openkoi trust audit

╭─────────────────────────────────────────────────────────────╮
│ AUTONOMOUS ACTION AUDIT — Last 7 days                        │
│                                                              │
│ Domain: code-review (delegated)                              │
│                                                              │
│  Mar 4   Auto-approved PR #147 (test coverage: 94%)         │
│  Mar 3   Requested changes on PR #145 (missing error        │
│          handling). Author fixed in 2hrs.                     │
│  Mar 2   Auto-approved PR #143 (docs update)                │
│  Mar 1   Flagged PR #141 for human review (security)        │
│                                                              │
│ Judgment accuracy: 4/4 (100%)                                │
│ Human overrides: 0                                           │
│ Trust recommendation: MAINTAIN                               │
╰─────────────────────────────────────────────────────────────╯
```

Filter by domain:

```bash
openkoi trust audit code-review
openkoi trust audit email-drafting
```

Without a domain argument, shows all autonomous actions across all domains.

### Trust Recommendations

After each audit, the system provides a recommendation:

| Recommendation | Meaning |
|---------------|---------|
| **MAINTAIN** | Actions were appropriate. Keep current trust level. |
| **INCREASE** | Consistently excellent judgment. Consider granting higher trust. |
| **DECREASE** | Multiple human overrides or errors. Consider revoking. |
| **REVOKE** | Serious judgment failure. Immediate revocation recommended. |

## How Trust Influences the System

Trust levels are not just UI — they actively change agent behavior:

| System | How Trust Affects It |
|--------|---------------------|
| **Guardian** | Higher trust = fewer safety blocks in trusted domains |
| **Orchestrator** | Autonomous domains skip human confirmation |
| **Daemon** | Only acts on domains with HIGH+ trust during background runs |
| **Maturity stages** | Stage 3 (Trusted Delegate) requires 3+ HIGH trust domains |

## Building Trust Over Time

The recommended path from zero to full delegation:

1. **Start at LOW** — Agent asks before every action
2. **After 1-2 weeks**: Review `openkoi trust audit` and `openkoi mind calibrate`
3. **If accuracy > 90%**: Grant `suggest` level — agent proposes, you approve
4. **After another 2 weeks**: If accuracy stays high, grant `act` level
5. **After a month**: If no human overrides, consider `autonomous`

This mirrors how you'd build trust with a new team member — gradual delegation based on demonstrated competence.

## Related Commands

- [`openkoi reflect today`](/guide/reflect) — See decisions and outcomes for trust evaluation
- [`openkoi mind calibrate`](/guide/mind) — Agency accuracy data supports trust decisions
- [`openkoi soul show`](/guide/soul-system) — Trust domains are reflected in the soul
- [Security: Trust Levels](/guide/security) — How trust fits into the security model
