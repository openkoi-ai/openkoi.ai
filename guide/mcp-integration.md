# MCP Integration

[Model Context Protocol](https://modelcontextprotocol.io) (MCP) is the primary mechanism OpenKoi uses to interact with external tools and data sources. It provides a standardized, secure way for the agent to execute operations in your local environment — file manipulation, database queries, API calls, and more.

## How MCP Works in OpenKoi

MCP servers are external processes that expose tools, resources, and prompts over a JSON-RPC protocol. OpenKoi manages these servers through its `McpManager`:

```
┌──────────────┐     JSON-RPC      ┌────────────────────┐
│   OpenKoi    │ ◄──── stdio ────► │  MCP Server        │
│  Orchestrator│                    │  (filesystem, git, │
│              │                    │   postgres, etc.)  │
└──────────────┘                    └────────────────────┘
```

The agent treats MCP tools identically to its built-in tools — they appear in the tool list, can be called during task execution, and are subject to the same safety checks.

## Server Discovery

OpenKoi discovers MCP servers from three locations (checked in order):

### 1. Project-Local `.mcp.json`

The most common setup. Place an `.mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://localhost:5432/mydb"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

This format is compatible with Claude Code, VS Code Copilot, and other MCP-aware tools. If you already have an `.mcp.json` for another tool, OpenKoi reads it directly.

### 2. Global User Config

For servers you want available in every project:

```
~/.config/mcp/servers.json
```

Same format as `.mcp.json`. Useful for personal tools like a notes server or calendar integration.

### 3. OpenKoi Config (`config.toml`)

Explicit configuration in your OpenKoi settings:

```toml
[plugins.mcp]
servers = [
  { name = "filesystem", command = "npx", args = ["-y", "@modelcontextprotocol/server-filesystem", "."] },
  { name = "custom-api", command = "/usr/local/bin/my-mcp-server", args = ["--port", "3000"] }
]
```

## Server Lifecycle

The `McpManager` handles the full lifecycle of MCP servers:

| Method | Description |
|--------|-------------|
| `start_all()` | Spawns all configured servers, exchanges capabilities, lists tools |
| `all_tools()` | Collects tools from all servers into a unified tool list |
| `call()` | Routes a tool call to the correct server by name |
| `shutdown_all()` | Graceful shutdown: notification → wait → kill |

Servers are started lazily on first use or eagerly at startup depending on configuration. Shutdown is graceful — OpenKoi sends a shutdown notification, waits for acknowledgment, then terminates the process.

## Transport Protocols

| Transport | Usage | Description |
|-----------|-------|-------------|
| **stdio** | Default | JSON-RPC over stdin/stdout. Most common for local servers. |
| **SSE** | Remote | Server-Sent Events over HTTP. For remote or shared MCP servers. |

stdio is the default and recommended transport for local development. SSE is used when connecting to remote servers that can't use stdin/stdout.

## Tool Namespacing

To prevent name collisions between servers, all tools are prefixed with their server name using `__` as a separator:

```
filesystem__read_file
filesystem__write_file
github__create_issue
github__list_prs
postgres__query
postgres__list_tables
```

This namespacing is transparent to the agent — it sees all tools in a flat list and calls them by their full prefixed name. The `McpManager` routes the call to the correct server.

## Protocol Features

| Feature | Status | Notes |
|---------|--------|-------|
| `tools/list` | Supported | Auto-registered as agent tools |
| `tools/call` | Supported | Full JSON-RPC request/response |
| `resources/list` | Supported | Token-budgeted, loaded on demand |
| `resources/read` | Supported | Fetches resource content |
| `prompts/list` | Supported | Merged into the skill/prompt system |
| `prompts/get` | Supported | Retrieved when needed |
| Sampling | Planned (v2) | Server-initiated model calls |

### Resources

MCP resources are treated as on-demand context. OpenKoi lists available resources from each server and loads them when the agent needs additional context — subject to token budget constraints. This prevents loading large resources unnecessarily.

### Prompts

MCP prompts from servers are merged into OpenKoi's skill system. They appear alongside native skills and can be used by the agent as additional instructions for specific tasks.

## Connecting a New Server

### Using the CLI

```bash
# Connect a pre-configured integration
openkoi connect slack
openkoi connect github
openkoi connect notion

# The connect command handles authentication and
# registers the appropriate MCP server
```

### Manual Setup

1. Add the server to `.mcp.json` or `config.toml`
2. Restart OpenKoi (or run `openkoi doctor` to verify)
3. The server's tools appear automatically in the next task

```bash
# Verify MCP servers are running
openkoi doctor

# Output includes:
# MCP Servers:
#   ✓ filesystem (3 tools)
#   ✓ github (12 tools)
#   ✓ postgres (4 tools)
```

## Security Model

MCP servers run as separate processes with explicit boundaries:

- **Process isolation** — Each server runs in its own OS process
- **Explicit configuration** — Only servers you configure are started; nothing is auto-discovered from the internet
- **Tool approval** — High-risk tools (writes, deletes, network calls) can require confirmation
- **Environment scoping** — Each server gets only the environment variables you specify

OpenKoi never executes arbitrary code from MCP servers. The protocol is strictly request-response: the agent sends a tool call, the server returns a result. Servers cannot invoke the agent or access its memory.

For the full security model, see [Security & Trust](/guide/security).

## Integration with App Adapters

OpenKoi's 10 built-in integrations (Slack, GitHub, Jira, etc.) also expose their capabilities as MCP-compatible tools. When you connect an integration, its operations appear in the same tool list as MCP server tools:

```
slack__send_message
slack__search_messages
github__create_issue
jira__transition_issue
```

This unified tool model means the agent doesn't distinguish between MCP tools and integration tools — they're all just tools it can use during task execution.

See [Integrations](/guide/integrations) for the full list of built-in adapters.

## Troubleshooting

### Server won't start

```bash
# Check if the server command works directly
npx -y @modelcontextprotocol/server-filesystem .

# Verify environment variables are set
echo $GITHUB_TOKEN

# Run doctor for diagnostics
openkoi doctor
```

### Tools not appearing

- Verify the server is listed in `.mcp.json`, `~/.config/mcp/servers.json`, or `config.toml`
- Check that the server process started successfully (visible in `openkoi doctor` output)
- Ensure the server implements `tools/list` correctly

### Permission errors

MCP servers inherit the permissions of the user running OpenKoi. If a filesystem server can't access a directory, check that *your* user has the required permissions.

## Next Steps

- [Plugins](/guide/plugins) — The three-tier plugin system (MCP, WASM, Rhai)
- [Integrations](/guide/integrations) — Built-in app adapters
- [Security & Trust](/guide/security) — Trust levels and isolation model
- [Configuration](/guide/configuration) — Full `config.toml` reference for MCP settings
