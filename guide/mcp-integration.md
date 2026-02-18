# MCP Integration

Model Context Protocol (MCP) is at the heart of OpenKoi's tool usage. It provides a standardized way for the agent to safely interact with your local environment and external data sources.

## Secure Tool Execution

OpenKoi leverages MCP subprocesses to execute tools. This ensures:
- **Isolation**: Each tool runs in its own process.
- **Security**: The agent only has access to the tools you've explicitly connected.
- **Ease of Use**: No complex configuration for new tools—just connect and go.

## Application Integration

OpenKoi can integrate with various workplace applications:
- **Slack/Discord/Telegram**: For collaborative task execution.
- **Notion/Google Docs**: For document reading and writing.
- **Local Databases**: For data analysis and reporting.

## Connecting Tools

To link a new application or tool set, use the `connect` command:

```bash
openkoi connect slack
```

This will guide you through the one-time authentication process and register the Slack MCP server with your local orchestrator.
