# Plugins (MCP, WASM, Rhai)

OpenKoi uses a three-tier plugin system that balances compatibility, safety, and ease of use. Each tier serves a different use case and carries a different trust level.

| Tier | Technology | Language | Isolation | Use Case |
|------|-----------|----------|-----------|----------|
| **Tier 1** | MCP (Model Context Protocol) | Any | Subprocess | External tool servers, maximum compatibility |
| **Tier 2** | WASM (WebAssembly) | Any (compiled to WASM) | Sandboxed (wasmtime) | Provider plugins, evaluation strategies, isolated extensions |
| **Tier 3** | Rhai | Rhai scripting | Embedded interpreter | Hooks, custom commands, quick user scripts |

## Tier 1: MCP Tool Servers

MCP is the primary extension mechanism for adding external tools. MCP servers run as subprocesses, communicate via JSON-RPC 2.0, and can be written in any language. This is the same protocol used by Claude Code, VS Code extensions, and other AI tool ecosystems.

### How It Works

1. OpenKoi spawns each configured MCP server as a child process.
2. Communication happens over **stdin/stdout** (JSON-RPC 2.0) or **SSE** (HTTP) for remote servers.
3. On initialization, OpenKoi exchanges capabilities and retrieves the server's tool list.
4. Tools are namespaced and registered for the agent to call during task execution.
5. On shutdown, servers receive a graceful shutdown notification.

### Protocol Support

| Feature | Supported | Notes |
|---------|-----------|-------|
| Transport: stdio | Yes | Default. JSON-RPC 2.0 over stdin/stdout. |
| Transport: SSE | Yes | For remote MCP servers over HTTP. |
| `tools/list` | Yes | Auto-registered as agent tools. |
| `tools/call` | Yes | Routed by server name prefix. |
| `resources/list` | Yes | Exposed as context to the agent. |
| `resources/read` | Yes | Loaded on demand (token-budgeted). |
| `prompts/list` | Yes | Merged into skill/prompt system. |
| `prompts/get` | Yes | Loaded when skill activates. |
| Sampling | Planned | Agent-side sampling planned for a future version. |

### Tool Namespacing

MCP tools are namespaced by server name to prevent collisions when multiple servers expose tools with the same name:

```
{server_name}__{tool_name}
```

Examples:
```
github__create_issue        (from mcp-server-github)
filesystem__read_file       (from mcp-server-filesystem)
postgres__query             (from mcp-server-postgres)
```

The double underscore (`__`) separates the server namespace from the tool name. When the agent calls `github__create_issue`, OpenKoi routes the call to the `github` MCP server with tool name `create_issue`.

### Configuration

MCP servers are configured in the `[plugins]` section of `config.toml`:

```toml
[plugins]
mcp = [
  { name = "github", command = "mcp-server-github" },
  { name = "filesystem", command = "mcp-server-filesystem", args = ["--root", "."] },
  { name = "postgres", command = "mcp-server-postgres", env = { DATABASE_URL = "..." } },
  { name = "custom", command = "./my-server", transport = "stdio" },
]
```

Each server entry supports:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Server identifier, used as the tool namespace prefix |
| `command` | Yes | Executable to run (found via `$PATH` or relative path) |
| `args` | No | Command-line arguments passed to the server |
| `env` | No | Environment variables passed to the server process |
| `transport` | No | `"stdio"` (default) or `"sse"` for HTTP-based servers |

### Auto-Discovery

OpenKoi auto-discovers MCP servers from three well-known locations, checked in order:

1. **Project root**: `.mcp.json` (same format as Claude Code / VS Code)
2. **Config file**: `[plugins.mcp]` in `~/.openkoi/config.toml`
3. **Global user config**: `~/.config/mcp/servers.json`

The `.mcp.json` format is compatible with Claude Code:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
    }
  }
}
```

### Server Lifecycle

```rust
pub struct McpManager {
    servers: HashMap<String, McpServer>,
}

impl McpManager {
    pub async fn start_all(&mut self, config: &[McpServerConfig]) -> Result<()> {
        for cfg in config {
            let server = McpServer::spawn(cfg).await?;
            let tools = server.initialize().await?;
            log::info!("MCP server '{}': {} tools available", cfg.name, tools.len());
            self.servers.insert(cfg.name.clone(), server);
        }
        Ok(())
    }

    pub async fn call(&mut self, server: &str, tool: &str, args: Value) -> Result<Value> {
        let srv = self.servers.get_mut(server)
            .ok_or_else(|| anyhow!("MCP server '{}' not found", server))?;
        srv.call_tool(tool, args).await
    }

    pub async fn shutdown_all(&mut self) {
        for (name, mut server) in self.servers.drain() {
            if let Err(e) = server.shutdown().await {
                log::warn!("MCP server '{}' shutdown error: {}", name, e);
            }
        }
    }
}
```

### Timeout and Error Handling

- Default timeout per tool call: **30 seconds** (configurable per server).
- If a server crashes, only that server's tools become unavailable -- other servers and the agent continue operating.
- `openkoi doctor` checks if declared MCP servers can start.

### Security

MCP servers run as child processes with the user's permissions. Environment variables are passed selectively per server config (not inherited wholesale). Each server communicates only via stdin/stdout (stdio transport) or HTTP (SSE transport) -- no shared memory with the agent process.

## Tier 2: WASM Plugins

WASM plugins run inside a wasmtime sandbox with explicit capability grants. They are suitable for extensions that need more isolation than MCP subprocess but more capability than Rhai scripts.

### WasmPluginInterface

Every WASM plugin must implement the `WasmPluginInterface` trait:

```rust
pub trait WasmPluginInterface {
    fn name(&self) -> String;
    fn version(&self) -> String;
    fn capabilities(&self) -> Vec<Capability>;
    fn register(&mut self, api: &mut PluginApi);
}
```

| Method | Purpose |
|--------|---------|
| `name` | Plugin identifier |
| `version` | Semantic version string |
| `capabilities` | Declares what the plugin can register (tools, eval strategies, providers, integrations) |
| `register` | Called on load; the plugin registers its tools, handlers, etc. with the host API |

### Sandbox and Capability Grants

WASM plugins are sandboxed by wasmtime. They have **no access** to the filesystem, network, or environment by default. Access must be explicitly declared in the plugin manifest and approved by the user on first install.

#### Plugin Manifest (`plugin.toml`)

```toml
[plugin]
name = "my-plugin"
version = "0.1.0"

[capabilities]
filesystem = ["read:~/.config/my-app/*"]    # Glob-scoped read access
network = ["https://api.example.com/*"]      # URL-pattern-scoped network
environment = ["MY_APP_TOKEN"]               # Specific env vars only
```

#### Capability Types

| Capability | Format | Example | Description |
|-----------|--------|---------|-------------|
| Filesystem | `access:glob` | `"read:~/.config/my-app/*"` | Glob-scoped file access. Access can be `read`, `write`, or `readwrite`. |
| Network | URL pattern | `"https://api.example.com/*"` | URL-pattern-scoped HTTP access. Only matching URLs are reachable. |
| Environment | Var name | `"MY_APP_TOKEN"` | Specific environment variable names. Only listed vars are visible to the plugin. |

#### Sandbox Implementation

```rust
pub struct WasmCapabilities {
    pub filesystem: Vec<FsGrant>,
    pub network: Vec<UrlPattern>,
    pub environment: Vec<String>,
}

impl WasmSandbox {
    pub fn instantiate(
        wasm_bytes: &[u8],
        caps: &WasmCapabilities,
    ) -> Result<WasmInstance> {
        let mut config = wasmtime::Config::new();
        config.wasm_component_model(true);

        let engine = Engine::new(&config)?;
        let mut linker = Linker::new(&engine);

        // Only link host functions matching declared capabilities
        if !caps.filesystem.is_empty() {
            link_fs_functions(&mut linker, &caps.filesystem)?;
        }
        if !caps.network.is_empty() {
            link_network_functions(&mut linker, &caps.network)?;
        }

        // Only expose declared env vars
        let filtered_env: HashMap<String, String> = caps.environment.iter()
            .filter_map(|k| std::env::var(k).ok().map(|v| (k.clone(), v)))
            .collect();

        let store = Store::new(&engine, SandboxState { env: filtered_env });
        let instance = linker.instantiate(&mut store, &component)?;
        Ok(WasmInstance { store, instance })
    }
}
```

A WASM plugin requesting `filesystem = ["read:~/.config/my-app/*"]` can only read files matching that glob. It cannot read `~/.openkoi/credentials/`, write to any file, or access the network unless those capabilities are also declared.

### Configuration

```toml
[plugins]
wasm = ["~/.openkoi/plugins/wasm/custom-eval.wasm"]
```

WASM plugin files are placed in `~/.local/share/openkoi/plugins/wasm/`.

## Tier 3: Rhai Scripts

Rhai is a lightweight embedded scripting language with no built-in I/O. Rhai scripts are the simplest way to customize OpenKoi behavior -- they are ideal for hooks, custom transformations, and lightweight automation.

### Host-Exposed Functions

Since Rhai has no built-in file, network, or system access, OpenKoi selectively exposes host functions to the scripting engine:

| Function | Signature | Description |
|----------|-----------|-------------|
| `send_message` | `send_message(app: &str, msg: &str)` | Send a message through a connected integration |
| `search_memory` | `search_memory(query: &str) -> String` | Query long-term memory |
| `log` | `log(msg: &str)` | Write to the OpenKoi log |

### Optional Functions

Additional functions can be enabled in config:

| Function | Config Gate | Description |
|----------|------------|-------------|
| `log` | `allow_log = true` | Logging to the OpenKoi log (default: enabled) |
| `http_get` | `allow_http = true` | HTTP GET requests (subject to URL-pattern filtering) |

### Rhai Engine Setup

```rust
pub fn create_rhai_engine(exposed: &RhaiExposedFunctions) -> Engine {
    let mut engine = Engine::new();

    // Core functions always available
    engine.register_fn("send_message", |app: &str, msg: &str| { /* ... */ });
    engine.register_fn("search_memory", |query: &str| { /* ... */ });

    // Optional functions gated by config
    if exposed.allow_log {
        engine.register_fn("log", |msg: &str| {
            info!(target: "rhai", "{}", msg);
        });
    }

    if exposed.allow_http {
        engine.register_fn("http_get", |url: &str| -> Result<String, Box<EvalAltResult>> {
            Ok(blocking_http_get(url)?)
        });
    }

    // No built-in I/O: no filesystem, no shell, no env vars
    engine
}
```

### Configuration

```toml
[plugins]
scripts = ["~/.openkoi/plugins/scripts/my-hooks.rhai"]
```

Rhai scripts are placed in `~/.local/share/openkoi/plugins/scripts/`.

## Hook System

All three plugin tiers can register handlers for lifecycle hooks. Hooks fire at specific points in the Plan-Execute-Evaluate-Refine cycle and during messaging events.

### Available Hooks

| Hook | Fires When | Typical Use |
|------|-----------|-------------|
| `BeforePlan` | Before the orchestrator creates a plan | Modify task context, inject additional instructions |
| `AfterPlan` | After the plan is created | Log or validate the plan, add constraints |
| `BeforeExecute` | Before each execution iteration | Inject context, modify tool list |
| `AfterExecute` | After each execution iteration | Log output, trigger side effects |
| `BeforeEvaluate` | Before evaluation runs | Add custom evaluation criteria |
| `AfterEvaluate` | After evaluation completes | Log scores, trigger alerts on low scores |
| `OnLearning` | When a new learning is extracted | Forward learnings to external systems |
| `OnPattern` | When a new pattern is detected | Custom notification or logging |
| `MessageReceived` | When an incoming message arrives (daemon mode) | Filter, transform, or route messages |
| `MessageSending` | Before a message is sent via integration | Transform outgoing messages, add signatures |

### Hook Execution

```rust
pub enum Hook {
    BeforePlan,
    AfterPlan,
    BeforeExecute,
    AfterExecute,
    BeforeEvaluate,
    AfterEvaluate,
    OnLearning,
    OnPattern,
    MessageReceived,
    MessageSending,
}
```

Hooks are executed in the order plugins are loaded. A hook handler receives a mutable context object and can modify it (e.g., adding fields to the task context or transforming a message). The context is then passed to the next handler.

### Rhai Hook Example

```rhai
// my-hooks.rhai

fn AfterExecute(context) {
    let score = context.score;
    if score < 0.5 {
        log("Low score detected: " + score);
        send_message("slack", "Task scored below 0.5: " + context.task);
    }
}

fn MessageReceived(context) {
    // Add a timestamp prefix to all incoming messages
    context.content = "[" + timestamp() + "] " + context.content;
}
```

## Plugin Configuration Summary

All plugin configuration lives in the `[plugins]` section of `config.toml`:

```toml
[plugins]
# Tier 1: MCP tool servers
mcp = [
  { name = "github", command = "mcp-server-github" },
  { name = "filesystem", command = "mcp-server-filesystem", args = ["--root", "."] },
  { name = "postgres", command = "mcp-server-postgres", env = { DATABASE_URL = "..." } },
]

# Tier 2: WASM plugins
wasm = [
  "~/.openkoi/plugins/wasm/custom-eval.wasm",
  "~/.openkoi/plugins/wasm/my-provider.wasm",
]

# Tier 3: Rhai scripts
scripts = [
  "~/.openkoi/plugins/scripts/my-hooks.rhai",
  "~/.openkoi/plugins/scripts/message-filter.rhai",
]
```

## Security Comparison

| Aspect | MCP (Tier 1) | WASM (Tier 2) | Rhai (Tier 3) |
|--------|-------------|---------------|---------------|
| **Isolation** | Subprocess | wasmtime sandbox | Embedded interpreter |
| **Filesystem** | Inherited from user | Explicit glob grants | None |
| **Network** | Inherited from user | Explicit URL patterns | None (unless `allow_http`) |
| **Env vars** | Selective per config | Explicit var names | None |
| **Shell access** | N/A | None | None |
| **Crash impact** | Server-local (other servers unaffected) | Plugin-local | Script-local |
| **Trust level** | High | Low | Medium |
| **Best for** | External tools, any language | Sandboxed extensions | Quick hooks, transformations |

The trust levels reflect the isolation boundaries:
- **MCP** servers inherit the user's permissions (high trust), but crashes are isolated to the subprocess.
- **WASM** plugins are maximally sandboxed (low trust required) -- they can only do what their declared capabilities allow.
- **Rhai** scripts have no I/O by default (medium trust) -- the host controls exactly which functions are available.

## Diagnostics

Check plugin status with `openkoi doctor`:

```
$ openkoi doctor

  MCP:    github (ok, 12 tools), filesystem (ok, 5 tools)
  WASM:   custom-eval (ok, 2 capabilities)
  Rhai:   my-hooks (ok, 3 hooks registered)
```
