# Security

OpenKoi runs locally with full filesystem access -- the agent operates with the same permissions as your user account. Security boundaries exist between the agent core, plugins (WASM sandboxed), external tool servers (MCP subprocess), and user scripts (Rhai). The guiding principle: **the agent has the user's permissions, plugins do not.**

This page covers every layer of the security model: trust levels, credential storage, sandboxing, and the safety guardrails that prevent accidental damage.

## Trust Levels

OpenKoi uses a nested trust model. Each layer has strictly less access than the one above it. Trust is also managed per-domain — you can grant the agent autonomous action in specific domains (like code review) while keeping other domains (like deployment) on a tight leash. Use `openkoi trust show` to see current levels and `openkoi trust audit` to review autonomous actions.

```
+---------------------------------------------------------------+
|  User trust level                                             |
|  +----------------------------------------------------------+ |
|  |  Agent core (full filesystem, network, shell)             | |
|  |  +-----------------------------------------------------+ | |
|  |  |  MCP servers (subprocess, inherit env selectively)   | | |
|  |  +-----------------------------------------------------+ | |
|  |  |  Rhai scripts (no I/O unless exposed by host)        | | |
|  |  +-----------------------------------------------------+ | |
|  |  |  WASM plugins (sandboxed, explicit capabilities)     | | |
|  |  +-----------------------------------------------------+ | |
|  +----------------------------------------------------------+ |
+---------------------------------------------------------------+
```

| Layer | Trust Level | Filesystem | Network | Shell | Notes |
|-------|-------------|------------|---------|-------|-------|
| **Agent core** | Full | Yes | Yes | Yes | Runs as `$USER`. Same permissions as your terminal session. |
| **MCP servers** | High (inherited) | Inherited | Inherited | N/A | Separate child process. Env vars passed selectively via config. |
| **Rhai scripts** | Medium | No (unless exposed) | No (unless exposed) | No | Pure computation plus host-exposed functions only. |
| **WASM plugins** | Low (explicit caps) | Explicit grants | Explicit grants | No | wasmtime sandbox. Must declare capabilities in a manifest. |

The agent core has no restrictions beyond what the operating system enforces on your user account. Every layer below the core is progressively more restricted, with WASM plugins being the most constrained.

## Credential Storage

All credentials are stored under `~/.openkoi/credentials/` using plain files protected by filesystem permissions. This is the same proven approach used by SSH keys, GPG keyrings, and most CLI tools.

### Directory Layout

```
~/.openkoi/
  auth.json                       # OAuth tokens for GitHub Copilot, ChatGPT (chmod 600)
  credentials/                    # chmod 700 (rwx------)
    providers.json                # API keys for model providers (chmod 600)
    integrations.json             # OAuth tokens for Slack, Notion, etc. (chmod 600)
    anthropic.key                 # Individual key files (chmod 600)
    openai.key                    # Individual key files (chmod 600)
    ...
```

### Permission Model

| Path | Permission | Meaning |
|------|-----------|---------|
| `~/.openkoi/auth.json` | `chmod 600` (`rw-------`) | Only the owner can read or write. Contains OAuth refresh tokens. |
| `~/.openkoi/credentials/` | `chmod 700` (`rwx------`) | Only the owner can list or enter the directory. |
| `*.key` files | `chmod 600` (`rw-------`) | Only the owner can read or write. |
| `providers.json` | `chmod 600` (`rw-------`) | Only the owner can read or write. |
| `integrations.json` | `chmod 600` (`rw-------`) | Only the owner can read or write. |

### Design Decisions

- **No encryption at rest.** API keys are stored as plaintext, not base64-encoded or obfuscated. Obfuscation without real encryption is security theater. The protection boundary is filesystem permissions, the same as SSH keys in `~/.ssh/`.
- **Permissions set on first write.** When OpenKoi saves a credential for the first time, it immediately sets `chmod 600` on the file and `chmod 700` on the directory.
- **Warn on read if permissions are wrong.** If OpenKoi detects that a credential file has overly permissive access (e.g., world-readable), it logs a warning and offers to fix it.

### Implementation

```rust
use std::os::unix::fs::PermissionsExt;

const CRED_FILE_MODE: u32 = 0o600;   // rw-------
const CRED_DIR_MODE: u32 = 0o700;    // rwx------

pub async fn save_credential(provider: &str, key: &str) -> Result<()> {
    let creds_dir = config_dir().join("credentials");
    fs::create_dir_all(&creds_dir).await?;
    fs::set_permissions(&creds_dir, Permissions::from_mode(CRED_DIR_MODE)).await?;

    let key_path = creds_dir.join(format!("{provider}.key"));
    fs::write(&key_path, key).await?;
    fs::set_permissions(&key_path, Permissions::from_mode(CRED_FILE_MODE)).await?;
    Ok(())
}
```

## Permission Auditing

The `openkoi doctor` command includes a dedicated permissions check that audits all credential files, the config directory, and the data directory.

### What `openkoi doctor` Checks

```bash
$ openkoi doctor

  Config:       ~/.openkoi/config.toml (loaded)
  Database:     ~/.local/share/openkoi/openkoi.db (12MB, 1,247 entries)
  Credentials:  ~/.openkoi/credentials/ (permissions ok)
  Providers:    anthropic (ok), ollama (ok), openai (key expired)
  MCP:          github (ok, 12 tools), filesystem (ok, 5 tools)
  Skills:       34 active, 2 proposed
  Integrations: slack (ok), notion (token expired)
  Disk:         47MB total
  Permissions:  all ok

  Issues:
    ! OpenAI API key expired. Run: openkoi init
    ! Notion token expired. Run: openkoi connect notion
```

When a permission issue is detected, the doctor reports it with a clear fix suggestion:

```
  Issues:
    ! ~/.openkoi/credentials/providers.json has mode 644 (should be 600)
      Fix: chmod 600 ~/.openkoi/credentials/providers.json
    ! ~/.openkoi/credentials/ has mode 755 (should be 700)
      Fix: chmod 700 ~/.openkoi/credentials/
```

### Automated Permission Fixing

OpenKoi provides two functions for programmatic permission repair:

| Function | Scope | Behavior |
|----------|-------|----------|
| `fix_permissions(path)` | Single file or directory | Sets the correct mode for the given path. |
| `fix_all_permissions()` | Entire credentials directory + auth.json | Walks `~/.openkoi/credentials/` and checks `~/.openkoi/auth.json`, fixing permissions on every file and the directory itself. |

Both functions log what they changed so the user has a clear audit trail.

## WASM Sandbox

WASM plugins are the most restricted execution environment. They run inside the wasmtime sandbox and have zero capabilities by default. Every capability must be explicitly declared in the plugin's manifest and approved by the user on first install.

### Capability Declaration

Each WASM plugin ships with a `plugin.toml` manifest:

```toml
[plugin]
name = "my-custom-plugin"
version = "0.1.0"

[capabilities]
filesystem = ["read:~/.config/my-app/*"]     # Path glob with access mode
network = ["https://api.example.com/*"]       # URL pattern scoped
environment = ["MY_APP_TOKEN"]                # Specific env var names only
```

### Capability Types

| Capability | Declaration | What It Grants |
|-----------|-------------|----------------|
| **Filesystem** | Path globs with `read:`, `write:`, or `readwrite:` prefix | Access to matching paths only. All other paths are invisible to the plugin. |
| **Network** | URL patterns (scheme + host + path glob) | HTTP requests to matching URLs only. All other destinations are blocked. |
| **Environment** | Explicit variable names | Access to specific env vars. All others return empty. |

### Approval Flow

On first install of a WASM plugin, OpenKoi shows the requested capabilities and asks for confirmation:

```
$ openkoi plugin install my-custom-plugin.wasm

  Plugin: my-custom-plugin v0.1.0
  Requested capabilities:
    Filesystem: read ~/.config/my-app/*
    Network:    https://api.example.com/*
    Env vars:   MY_APP_TOKEN

  [a]pprove  [d]eny  [v]iew source
> a
  Installed and approved.
```

Once approved, the capabilities are stored. The plugin runs with those grants on every subsequent invocation. If the plugin updates its manifest to request additional capabilities, the user is prompted again.

### Sandbox Enforcement

```rust
impl WasmSandbox {
    pub fn instantiate(
        wasm_bytes: &[u8],
        caps: &WasmCapabilities,
    ) -> Result<WasmInstance> {
        let mut config = wasmtime::Config::new();
        config.wasm_component_model(true);

        let engine = Engine::new(&config)?;
        let mut linker = Linker::new(&engine);

        // Only link host functions that match declared capabilities
        if !caps.filesystem.is_empty() {
            link_fs_functions(&mut linker, &caps.filesystem)?;
        }
        if !caps.network.is_empty() {
            link_network_functions(&mut linker, &caps.network)?;
        }

        // Env vars: only expose declared ones
        let filtered_env: HashMap<String, String> = caps.environment.iter()
            .filter_map(|k| std::env::var(k).ok().map(|v| (k.clone(), v)))
            .collect();

        let store = Store::new(&engine, SandboxState { env: filtered_env });
        let instance = linker.instantiate(&mut store, &component)?;
        Ok(WasmInstance { store, instance })
    }
}
```

## MCP Server Isolation

MCP (Model Context Protocol) servers run as separate child processes that communicate exclusively over stdin/stdout using JSON-RPC. This provides natural process-level isolation.

### Isolation Properties

| Property | Detail |
|----------|--------|
| **Process boundary** | Each MCP server is a separate OS process. No shared memory with the agent. |
| **Communication channel** | stdin/stdout only (JSON-RPC over stdio). No filesystem sharing. |
| **Crash isolation** | If a server crashes, only that tool becomes unavailable. The agent continues normally. |
| **Timeout** | Default 30-second timeout per tool call. Configurable per server. |
| **Environment** | Env vars are passed selectively, not inherited wholesale. |

### Configuration

```toml
# ~/.openkoi/config.toml

[[mcp.servers]]
name = "filesystem"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]

[[mcp.servers]]
name = "github"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_TOKEN = "${GITHUB_TOKEN}" }   # Only pass this specific env var

[[mcp.servers]]
name = "postgres"
command = "mcp-server-postgres"
env = { DATABASE_URL = "postgres://..." }
timeout_seconds = 60                          # Override default 30s timeout
```

The `env` field controls exactly which environment variables a given MCP server receives. If omitted, the server inherits the agent's full environment. Specifying `env` restricts the server to only the listed variables.

### Lifecycle

1. **Startup**: All configured servers are spawned on session start. Each server goes through an `initialize` handshake that exchanges capabilities and lists available tools.
2. **Tool calls**: The agent routes tool calls to the correct server by namespace prefix (e.g., `github__create_issue`).
3. **Shutdown**: On session end, OpenKoi sends a shutdown notification to each server, waits briefly, then terminates the process.

## Rhai Script Safety

Rhai is an embedded scripting language designed for safe hosting. By default, Rhai scripts in OpenKoi have **no I/O capabilities** -- no filesystem access, no network access, no shell execution, and no environment variable access.

### Default Restrictions

| Capability | Available by Default | How to Enable |
|-----------|---------------------|---------------|
| Logging | No | Set `allow_log = true` in script config |
| HTTP requests | No | Set `allow_http = true` in script config |
| Filesystem | No | Not available (use WASM or MCP for I/O) |
| Shell execution | No | Not available |
| Environment vars | No | Not available |
| Memory search | No | Host must expose `search_memory` function |
| Send messages | No | Host must expose `send_message` function |

### Host-Exposed Functions

The OpenKoi host selectively registers functions into the Rhai engine based on configuration:

```rust
pub fn create_rhai_engine(exposed: &RhaiExposedFunctions) -> Engine {
    let mut engine = Engine::new();

    // Only expose what the user has configured
    if exposed.allow_log {
        engine.register_fn("log", |msg: &str| {
            info!(target: "rhai", "{}", msg);
        });
    }

    if exposed.allow_http {
        engine.register_fn("http_get", |url: &str| -> Result<String, Box<EvalAltResult>> {
            // Runs through a URL-pattern filter (same as WASM plugins)
            Ok(blocking_http_get(url)?)
        });
    }

    engine
}
```

### URL-Pattern Filtering

When `allow_http` is enabled, HTTP requests from Rhai scripts are still filtered through a URL-pattern allowlist. This prevents scripts from making requests to arbitrary destinations. The allowlist uses the same pattern format as WASM plugin network capabilities.

## Safety Guardrails

OpenKoi includes multiple layers of circuit breakers and safety limits to prevent runaway execution, excessive cost, and accidental damage.

### SafetyConfig

The safety configuration controls hard limits on iteration, cost, and time:

```rust
pub struct SafetyConfig {
    pub max_iterations: u8,           // Default: 3
    pub max_tokens: u32,              // Default: 200_000
    pub max_duration: Duration,       // Default: 5 minutes
    pub max_cost_usd: f64,            // Default: $2.00
    pub abort_on_regression: bool,    // Default: true
    pub regression_threshold: f32,    // Default: 0.2
}
```

| Limit | Default | What Happens When Exceeded |
|-------|---------|---------------------------|
| `max_iterations` | 3 | Iteration loop stops. Returns best result so far. |
| `max_tokens` | 200,000 | `BudgetExceeded` error. Task aborts with partial result. |
| `max_duration` | 5 minutes | `AbortTimeout` decision. Returns best result so far. |
| `max_cost_usd` | $2.00 | **Hard stop.** No bypass without explicit `--budget` increase. |
| `abort_on_regression` | true | If score drops by more than `regression_threshold`, abort immediately. |
| `regression_threshold` | 0.2 | A 0.2 drop (e.g., 0.85 to 0.65) triggers `ScoreRegression` abort. |

### Tool Loop Detection

The tool loop detector prevents the agent from calling the same tool repeatedly in a pattern that indicates it is stuck. Three thresholds escalate the response:

| Threshold | Count | Action |
|-----------|-------|--------|
| **Warning** | 10 calls | Log a warning. Agent is informed but continues. |
| **Critical** | 20 calls | Log a critical warning. Agent is strongly urged to stop. |
| **Circuit breaker** | 30 calls | **Hard stop.** `ToolLoop` error raised. Task aborts. |

```toml
# config.toml
[safety.tool_loop]
warning = 10
critical = 20
circuit_breaker = 30
```

These thresholds are configurable. For tasks that legitimately require many tool calls (e.g., batch file processing), you can raise the limits.

## Destructive Operation Guardrails

The agent has full filesystem and shell access, but built-in guardrails add a confirmation step before executing operations that could cause irreversible damage.

### Guardrail Rules

| Operation Pattern | Guardrail |
|------------------|-----------|
| `rm -rf`, `rm -r`, destructive file deletion | Pause and confirm with user before executing. |
| `DROP TABLE`, `DROP DATABASE`, destructive SQL | Pause and confirm with user before executing. |
| `git push --force`, `git reset --hard` | Pause and confirm with user before executing. |
| Cost exceeds session budget (`max_cost_usd`) | **Hard stop.** No bypass without `--budget` increase. |
| Unknown binary execution (not in `$PATH` or project) | Warn before executing. |
| Credential detected in output | Redact before displaying. Warn user. |

### How Confirmation Works

When the agent encounters a destructive operation, it pauses execution and presents the command to the user:

```
  The agent wants to execute a potentially destructive command:
    git push --force origin main

  [a]llow  [d]eny  [v]iew context
> d
  Denied. The agent will attempt an alternative approach.
```

### Credential Redaction

If the agent's output contains what appears to be an API key or secret (detected via pattern matching for common key formats), OpenKoi redacts it before displaying:

```
  Output contains a potential credential:
    sk-ant-api03-****...****
  The value has been redacted from the display.
```

## Sensitive Information Redaction

OpenKoi includes an opt-in redaction preprocessor that scans content for sensitive information (API keys, passwords, private keys, connection strings, etc.) before sending it to AI providers. This is designed for enterprise environments where secrets may appear in code, config files, logs, or tool output that the agent processes.

### How It Works

The redaction lifecycle has three phases:

1. **Scan and redact** -- Before content is sent to the AI provider, the redactor scans it against a library of pattern categories. Detected secrets are replaced with deterministic placeholders like `[REDACTED_API_KEY_1]`.
2. **AI processes placeholders** -- The provider sees only the placeholders, never the actual secrets. The AI can still reason about the structure (e.g., "this config has an API key") without seeing the value.
3. **Restore** -- After the AI responds, placeholders in the output are replaced with the original values so the final result shown to the user is correct.

This scan-redact-restore cycle runs at three interception points in the executor pipeline:

| Interception Point | When | What Is Redacted |
|--------------------|------|-----------------|
| Before `provider.chat()` | User message + context sent to the AI | Secrets in the prompt, file contents, and conversation history |
| After response | AI response received | Restores any placeholders the AI echoed back |
| After tool dispatch | Tool results returned to the agent | Secrets in command output, file reads, search results |

### Built-in Pattern Categories

The redactor ships with 10 categories of patterns. Each category can be individually enabled or disabled.

| Category | Default | Examples |
|----------|---------|----------|
| `api_keys` | on | `sk-ant-api03-...`, `AKIA...`, `ghp_...`, `xoxb-...` |
| `passwords` | on | `password = "..."`, `passwd: ...`, `secret_key = "..."` |
| `private_keys` | on | `-----BEGIN RSA PRIVATE KEY-----`, `-----BEGIN EC PRIVATE KEY-----` |
| `connection_strings` | on | `postgres://user:pass@host/db`, `mongodb+srv://...`, `redis://...` |
| `tokens` | on | `Bearer eyJ...`, JWT tokens, session tokens |
| `aws_credentials` | on | `aws_access_key_id`, `aws_secret_access_key` values |
| `ip_addresses` | on | IPv4 and IPv6 addresses |
| `email_addresses` | on | `user@example.com` patterns |
| `credit_cards` | on | 16-digit card number patterns (Luhn-validated) |
| `high_entropy` | **off** | Generic high-entropy strings (potential secrets). Off by default due to false positives. |

### Deterministic Placeholders

The same secret always maps to the same placeholder within a session. If `sk-ant-api03-abc123` appears in three different messages, all three are replaced with `[REDACTED_API_KEY_1]`. A different API key gets `[REDACTED_API_KEY_2]`. This lets the AI maintain referential consistency (e.g., "the key in line 5 is the same one used in line 42").

### Custom Patterns and Literal Secrets

Beyond the built-in categories, you can define custom regex patterns and literal secret values:

```toml
# Custom regex patterns
[[redaction.custom_patterns]]
name = "internal_token"
pattern = "itk-[a-zA-Z0-9]{32}"
placeholder_prefix = "INTERNAL_TOKEN"

# Literal secrets (exact string match, no regex)
[redaction]
literal_secrets = [
  "my-company-internal-secret-value",
  "super-secret-database-password",
]
```

### Enabling Redaction

Redaction is **disabled by default**. Enable it in one of two ways:

**CLI flag (per-invocation):**

```bash
openkoi --redact "Refactor the database module"
openkoi chat --redact
```

**Config file (persistent):**

```toml
# ~/.openkoi/config.toml
[redaction]
enabled = true
```

The CLI flag takes precedence -- `--redact` enables redaction even if the config has `enabled = false`.

See the [Configuration](/guide/configuration) page for the full `[redaction]` config reference.

## Security Summary

OpenKoi's security model is defense-in-depth. The primary boundary is that the agent runs as you -- it can do anything you can do from a terminal. Everything below that is layered protection:

1. **WASM plugins** are fully sandboxed with explicit capability grants.
2. **MCP servers** are process-isolated with selective env var passing.
3. **Rhai scripts** have zero I/O by default with opt-in function exposure.
4. **Safety guardrails** prevent runaway cost, time, and iteration.
5. **Destructive operation detection** adds human confirmation for dangerous commands.
6. **Credential storage** uses filesystem permissions (the same model as SSH keys).
7. **Permission auditing** via `openkoi doctor` catches misconfigurations.
8. **Sensitive information redaction** scans and replaces secrets before they reach AI providers (opt-in).

These are safeguards against accidents, not security against a hostile agent. The design assumes the agent is acting in good faith on behalf of the user, and the guardrails exist to catch the inevitable mistakes that any automated system will make.
