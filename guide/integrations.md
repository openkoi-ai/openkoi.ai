# Integrations

OpenKoi connects to external messaging and document apps through a dual adapter model. Each connected integration automatically registers as tools the agent can call during task execution. All credentials are stored locally with filesystem-level protection.

## Dual Adapter Model

External apps fall into two fundamentally different interaction models: real-time messaging and structured documents. OpenKoi uses two adapter traits to handle this distinction cleanly.

### MessagingAdapter

For apps where communication is message-based and often real-time.

```rust
#[async_trait]
pub trait MessagingAdapter: Send + Sync {
    async fn send(&self, target: &str, content: &str) -> Result<String>;
    async fn history(&self, channel: &str, limit: u32) -> Result<Vec<IncomingMessage>>;
    async fn watch(&self, channel: &str, handler: MessageHandler) -> Result<()>;
    async fn search(&self, query: &str) -> Result<Vec<IncomingMessage>>;
}
```

| Method | Purpose |
|--------|---------|
| `send` | Send a message to a target (channel, user, thread) |
| `history` | Retrieve recent messages from a channel |
| `watch` | Subscribe to new messages in real-time (used by daemon mode) |
| `search` | Search message history by keyword |

### DocumentAdapter

For apps where content is structured, persistent, and edited in place.

```rust
#[async_trait]
pub trait DocumentAdapter: Send + Sync {
    async fn read(&self, doc_id: &str) -> Result<Document>;
    async fn write(&self, doc_id: &str, content: &str) -> Result<()>;
    async fn create(&self, title: &str, content: &str) -> Result<String>;
    async fn search(&self, query: &str) -> Result<Vec<DocumentRef>>;
    async fn list(&self, folder: Option<&str>) -> Result<Vec<DocumentRef>>;
}
```

| Method | Purpose |
|--------|---------|
| `read` | Read a document by ID |
| `write` | Update an existing document's content |
| `create` | Create a new document, returns its ID |
| `search` | Search documents by keyword |
| `list` | List documents, optionally filtered by folder |

## Supported Integrations

OpenKoi supports 10 integrations across messaging and document platforms:

| App | Type | Adapter(s) | Protocol | Platform Requirement | Auth |
|-----|------|-----------|----------|---------------------|------|
| **iMessage** | Messaging | `MessagingAdapter` | AppleScript | macOS only | None (system access) |
| **Telegram** | Messaging | `MessagingAdapter` | Bot API (HTTPS) | Any | `TELEGRAM_BOT_TOKEN` |
| **Slack** | Hybrid | Both | Web API + Socket Mode | Any | `SLACK_BOT_TOKEN` |
| **Discord** | Messaging | `MessagingAdapter` | Bot Gateway (WebSocket) | Any | Bot token |
| **MS Teams** | Messaging | `MessagingAdapter` | Microsoft Graph API | Any | `access_token`, `tenant_id`, `team_id` |
| **Notion** | Document | `DocumentAdapter` | REST API (HTTPS) | Any | `NOTION_API_KEY` |
| **Google Docs** | Document | `DocumentAdapter` | REST API + OAuth2 | Any | OAuth2 credentials |
| **Google Sheets** | Document | `DocumentAdapter` | REST API | Any | OAuth2 credentials (shared with Docs) |
| **MS Office** | Document | `DocumentAdapter` | Local files | Any | None (local filesystem) |
| **Email** | Messaging | `MessagingAdapter` | IMAP/SMTP | Any | IMAP/SMTP credentials |

### iMessage

**Type:** Messaging only | **Platform:** macOS only

Uses AppleScript to interact with the Messages app. No API key needed -- access is granted through macOS system permissions.

Capabilities:
- Send messages to contacts or phone numbers
- Read recent messages from conversations
- Watch for incoming messages (requires daemon mode)
- Search message history

Limitations:
- macOS only (AppleScript dependency)
- Requires granting Accessibility permissions to OpenKoi
- No group chat management

### Telegram

**Type:** Messaging only | **Protocol:** Bot API

Connects via the Telegram Bot API. You create a bot through [@BotFather](https://t.me/BotFather) and provide the token.

```bash
# Set via environment variable
export TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

Capabilities:
- Send and receive messages
- Support for groups and channels
- Message search via bot history
- File and media sharing

### Slack

**Type:** Hybrid (messaging + documents) | **Protocol:** Web API + Socket Mode

Slack is the only integration that implements **both** adapter types. As a `MessagingAdapter`, it handles channels and DMs. As a `DocumentAdapter`, it can read and create Canvas documents.

```bash
export SLACK_BOT_TOKEN=xoxb-your-token-here
```

Configuration supports channel filtering:

```toml
[integrations.slack]
enabled = true
channels = ["#engineering", "#general", "#product"]
```

Required Slack app scopes: `channels:read`, `channels:history`, `chat:write`, `search:read`, `users:read`.

### Discord

**Type:** Messaging only | **Protocol:** Bot Gateway

Connects via the Discord Bot API using WebSocket for real-time events.

Capabilities:
- Send and receive messages in channels
- Thread support
- Message history and search
- Reaction monitoring

### MS Teams

**Type:** Messaging only | **Protocol:** Microsoft Graph API

Connects to Microsoft Teams through the Graph API. Requires Azure AD app registration.

```
Required credentials:
  access_token   - OAuth2 access token
  tenant_id      - Azure AD tenant ID
  team_id        - Target team ID
```

### Notion

**Type:** Document only | **Protocol:** REST API

Connects to Notion workspaces for reading, writing, and creating pages.

```bash
export NOTION_API_KEY=ntn_your-integration-token
```

Capabilities:
- Read page content (converted from Notion blocks to Markdown)
- Write/update page content
- Create new pages in databases or as children of existing pages
- Search across the workspace
- List pages in a database

### Google Docs

**Type:** Document only | **Protocol:** REST API + OAuth2

Connects to Google Docs for document management. Requires OAuth2 setup with a Google Cloud project.

Capabilities:
- Read document content
- Write/update documents
- Create new documents
- Search across Google Drive
- List documents in folders

### Google Sheets

**Type:** Document only | **Protocol:** REST API

Shares OAuth2 credentials with Google Docs. Treats spreadsheets as structured documents.

Capabilities:
- Read sheet data (returned as structured tables)
- Write to specific ranges
- Create new spreadsheets
- List spreadsheets in Drive

### MS Office (Local)

**Type:** Document only | **Protocol:** Local files

Reads and writes local `.docx` and `.xlsx` files using Rust crates for Office format parsing. No network access or API keys required.

Capabilities:
- Read `.docx` document content (text extraction)
- Write `.docx` files
- Read `.xlsx` spreadsheet data
- Write `.xlsx` files
- List Office files in a directory

### Email

**Type:** Messaging only | **Protocol:** IMAP/SMTP

Connects to email accounts via standard IMAP (reading) and SMTP (sending) protocols.

```
Required credentials:
  imap_host       - IMAP server hostname
  imap_port       - IMAP port (default: 993)
  smtp_host       - SMTP server hostname
  smtp_port       - SMTP port (default: 587)
  username        - Email account username
  password        - Email account password (or app-specific password)
```

Capabilities:
- Read emails from inbox and folders
- Send emails
- Search email by subject, sender, date
- Watch for new emails (IMAP IDLE)

## Auto-Registered Tools

When an integration is connected, OpenKoi automatically registers tools that the agent can invoke during task execution. The tool names follow a consistent naming convention using the integration's ID as a prefix.

### Messaging Integrations

Each messaging integration registers two tools:

| Tool Name | Parameters | Description |
|-----------|-----------|-------------|
| `{id}_send` | `target` (string), `message` (string) | Send a message via the integration |
| `{id}_read` | `channel` (string), `limit` (integer, optional) | Read recent messages from a channel |

### Document Integrations

Each document integration registers two tools:

| Tool Name | Parameters | Description |
|-----------|-----------|-------------|
| `{id}_read_doc` | `doc_id` (string) | Read a document from the integration |
| `{id}_write_doc` | `doc_id` (string, optional), `content` (string) | Write to a document in the integration |

### Example: Connected Slack + Notion

With Slack and Notion both connected, the agent has access to:

```
slack_send      - Send a Slack message
slack_read      - Read Slack messages
slack_read_doc  - Read a Slack Canvas (Slack implements both adapters)
slack_write_doc - Write to a Slack Canvas
notion_read_doc - Read a Notion page
notion_write_doc - Write to a Notion page
```

### Tool Registration Code

```rust
pub fn tools_for_integration(integration: &dyn Integration) -> Vec<ToolDef> {
    let mut tools = Vec::new();
    let id = integration.id();

    if let Some(_msg) = integration.messaging() {
        tools.push(ToolDef {
            name: format!("{id}_send"),
            description: format!("Send a message via {}", integration.name()),
            parameters: json!({
                "type": "object",
                "properties": {
                    "target": { "type": "string" },
                    "message": { "type": "string" }
                },
                "required": ["target", "message"]
            }),
        });
        tools.push(ToolDef {
            name: format!("{id}_read"),
            description: format!("Read messages from {}", integration.name()),
            parameters: json!({
                "type": "object",
                "properties": {
                    "channel": { "type": "string" },
                    "limit": { "type": "integer" }
                },
                "required": ["channel"]
            }),
        });
    }

    if let Some(_doc) = integration.document() {
        tools.push(ToolDef {
            name: format!("{id}_read_doc"),
            description: format!("Read a document from {}", integration.name()),
            parameters: json!({
                "type": "object",
                "properties": {
                    "doc_id": { "type": "string" }
                },
                "required": ["doc_id"]
            }),
        });
        tools.push(ToolDef {
            name: format!("{id}_write_doc"),
            description: format!("Write to a document in {}", integration.name()),
            parameters: json!({
                "type": "object",
                "properties": {
                    "doc_id": { "type": "string" },
                    "content": { "type": "string" }
                },
                "required": ["content"]
            }),
        });
    }

    tools
}
```

## Setup

### Connecting an Integration

Use the `openkoi connect` command to set up an integration. When run without an argument, an interactive picker shows all available providers and integrations:

```bash
# Interactive picker (recommended)
openkoi connect

# Or specify directly
openkoi connect slack
openkoi connect notion
openkoi connect telegram
openkoi connect imessage
openkoi connect email
```

```
$ openkoi connect

? Select a provider or integration to connect:
> GitHub Copilot — Device-code OAuth (use your existing subscription)
  ChatGPT Plus/Pro — Device-code OAuth (use your existing subscription)
  Slack — Bot token + channel selection
  Discord — Bot token
  Telegram — Bot token (@BotFather)
  Notion — Integration token
  iMessage — macOS system access (no key needed)
  Google Docs/Sheets — OAuth2 credentials
  Email — IMAP/SMTP credentials
  ...
```

The connect command then walks you through the setup process specific to each integration:

```
$ openkoi connect slack

  Slack Integration Setup
  -----------------------
  1. Create a Slack app at https://api.slack.com/apps
  2. Add these scopes: channels:read, channels:history, chat:write, search:read
  3. Install the app to your workspace
  4. Copy the Bot User OAuth Token

  Paste your Slack Bot Token:
  ****************************************

  Testing connection... OK (workspace: "My Company")
  Available channels: #engineering, #general, #product, #random

  Which channels should OpenKoi monitor? (comma-separated)
  > #engineering, #general

  Saved to ~/.openkoi/credentials/integrations.json
  Slack integration enabled.

  Config added to ~/.openkoi/config.toml:
    [integrations.slack]
    enabled = true
    channels = ["#engineering", "#general"]
```

### Configuration

Integrations are configured in the `[integrations]` section of `config.toml`:

```toml
[integrations.slack]
enabled = true
channels = ["#engineering", "#general"]

[integrations.notion]
enabled = true

[integrations.imessage]
enabled = true   # macOS only

[integrations.telegram]
enabled = true

[integrations.email]
enabled = true
```

### Environment Variables

API tokens can be set as environment variables (auto-discovered) or stored in the credentials file:

```bash
# Integration tokens
SLACK_BOT_TOKEN=xoxb-...
TELEGRAM_BOT_TOKEN=...
NOTION_API_KEY=ntn_...
```

### Credential Storage

Integration credentials are stored in `~/.openkoi/credentials/integrations.json` with restricted file permissions:

```
~/.openkoi/
  credentials/
    integrations.json   # chmod 600 (owner read/write only)
```

The credentials directory is set to `chmod 700` and individual credential files to `chmod 600`. OpenKoi checks permissions on startup and warns if they are misconfigured. `openkoi doctor` also verifies credential file permissions.

No encryption at rest -- filesystem permissions are the security boundary, consistent with how SSH keys, AWS credentials, and other CLI tools handle secrets.

## Cross-App Workflows

The real power of integrations emerges when combining multiple apps in a single task:

```
$ openkoi "Summarize today's Slack and post to Notion"

[skill] morning-slack-summary (learned, conf: 0.89)
[tools] slack_read(#engineering) -> 87 msgs
[tools] slack_read(#product) -> 23 msgs
[tools] notion_write_doc("Daily Summary - Feb 17")
[tools] slack_send(#engineering, "Summary posted: https://notion.so/...")
[done] 1 iteration (deterministic skill), 8k tokens, $0.06
```

The agent seamlessly uses tools from multiple integrations in the same task. The skill system and pattern miner can learn these cross-app workflows and propose skills to automate them.

### Background Watching

When running as a daemon (`openkoi daemon start`), integrations with `watch` capability can monitor channels for incoming messages and trigger automated responses:

```toml
# Daemon watches these channels for messages mentioning @openkoi
[integrations.slack]
enabled = true
channels = ["#engineering", "#general"]
```

Messages directed at the agent (e.g., `@openkoi summarize this thread`) are picked up by the watcher and processed as tasks.

## Checking Integration Status

Use `openkoi status` to verify your integrations:

```
$ openkoi status

  Integrations:
    slack     OK  (workspace: "My Company", 2 channels)
    notion    OK  (workspace: "Team Docs")
    imessage  OK  (macOS)
    telegram  --  (not configured)
    email     --  (not configured)
```

Use `openkoi doctor` for deeper diagnostics:

```
$ openkoi doctor

  Integrations:
    slack (ok): connected, 2 channels monitored
    notion (token expired): Run `openkoi connect notion` to refresh
    imessage (ok): Accessibility permissions granted
```
