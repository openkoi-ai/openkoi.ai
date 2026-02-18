# MCP Integration

Model Context Protocol (MCP) is at the heart of OpenKoi's tool usage. It allows the agent to safely control your local environment and connect to external data sources.

## How it works

Whether it's reading a local database, searching your file system, or interacting with a browser, OpenKoi leverages MCP subprocesses to get the job done without complex configuration.

## Connect an App

Run the following command to link your favorite workspace tools directly to the orchestrator:

```bash
openkoi connect slack
```

## Features

- **Standardized Communication**: Interact with any MCP-compliant server.
- **Secure Access**: OpenKoi manages handles to external tools via secure subprocesses.
- **Rich Context**: Provide the agent with the exact data it needs to perform complex tasks.
