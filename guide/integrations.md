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
    async fn send_rich(&self, target: &str, msg: &RichMessage) -> Result<String>;
    async fn history(&self, channel: &str, limit: u32) -> Result<Vec<IncomingMessage>>;
    async fn search(&self, query: &str) -> Result<Vec<IncomingMessage>>;
}
```

| Method | Purpose |
|--------|---------|
| `send` | Send a plain text message to a target (channel, user, thread) |
| `send_rich` | Send a structured message with title, fields, color, and thread support |
| `history` | Retrieve recent messages from a channel |
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

#### Trigger Pattern

The daemon triggers a task when it sees a message starting with `koi:`:

| Pattern | Example |
|---------|---------|
| `koi: <task>` | `koi: summarize the project readme` |

Limitations:
- macOS only (AppleScript dependency)
- Requires granting Accessibility permissions to OpenKoi
- No group chat management

### Telegram

**Type:** Messaging only | **Protocol:** Bot API

Connects via the [Telegram Bot API](https://core.telegram.org/bots/api). You create a bot through [@BotFather](https://t.me/BotFather) and provide the token.

#### Setup

1. Open Telegram and message [@BotFather](https://t.me/BotFather).
2. Send `/newbot`, follow the prompts to name your bot.
3. Copy the bot token (format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`).
4. Connect it to OpenKoi:

```bash
# Interactive setup (recommended)
openkoi connect telegram

# Or set via environment variable
export TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

5. Add your bot to a group chat, or message it directly.
6. Get the chat ID by sending a message to the bot and checking:

```bash
curl https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
```

Look for `"chat": {"id": ...}` in the response. Group/supergroup IDs are negative (e.g., `-1001234567890`), direct chat IDs are positive.

7. Configure which chats the daemon should watch:

```toml
[integrations.telegram]
enabled = true
channels = ["-1001234567890", "987654321"]
```

#### Sending Messages to Telegram

When a task completes (triggered from Telegram or the API), OpenKoi replies to the same chat. Two message formats are used:

**Plain text** -- simple text via `sendMessage`:

```
Task completed: Fix the login bug
Score: 0.92 | Cost: $0.18 | Iterations: 2
```

**Rich message** -- structured output with bold title, key-value fields, and thread reply:

```
*Task Complete: Fix the login bug*
Score: 0.92 | Cost: $0.18 | Iterations: 2

Fixed the null check in validateToken() that caused...
```

Rich messages use `reply_to_message_id` to thread back to the original command message.

#### Receiving Messages from Telegram

The daemon polls `getUpdates` every **10 seconds** for new messages in configured channels. A task is triggered when OpenKoi detects one of these patterns:

| Pattern | Example | Notes |
|---------|---------|-------|
| `/koi <task>` | `/koi fix the login bug` | Standard bot command |
| `/koi@botname <task>` | `/koi@myopenkoi_bot fix the login bug` | Group format (Telegram appends bot name) |
| `@openkoi_bot <task>` | `@openkoi_bot summarize this thread` | Mention anywhere in message |

The text after the trigger pattern becomes the task description. The daemon executes the task and replies in the same chat with the result.

#### Progress Notifications

During long-running tasks, the daemon sends progress updates every **60 seconds** to the originating chat:

```
*In Progress: Fix the login bug*
Phase: executing | Iteration: 2/3 | Score: 0.78
```

#### Limitations

- No message search (Telegram Bot API does not support it)
- History is limited to unprocessed updates via `getUpdates` (no deep message history)
- Bot must be added to groups manually; it cannot join on its own

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

#### Trigger Patterns

The daemon watches configured channels (polling every **30 seconds**) and triggers a task when it detects:

| Pattern | Example |
|---------|---------|
| `@openkoi <task>` | `@openkoi summarize this thread` |
| `<@openkoi> <task>` | Slack's native mention format |

#### Rich Messages

Task results are sent as Slack [Block Kit](https://api.slack.com/block-kit) attachments with:

- Bold title
- Key-value fields (Score, Cost, Iterations) displayed inline
- Color sidebar (green for success, red for failure)
- Thread support -- replies to the original message when triggered from a thread

### Discord

**Type:** Messaging only | **Protocol:** Bot Gateway

Connects via the Discord Bot API using WebSocket for real-time events.

Capabilities:
- Send and receive messages in channels
- Thread support
- Message history and search
- Reaction monitoring

#### Trigger Patterns

The daemon watches configured channels (polling every **30 seconds**) and triggers tasks when it detects `@openkoi <task>` in a message.

#### Rich Messages

Task results are sent as Discord embeds with:

- Title and description
- Inline fields (Score, Cost, Iterations)
- Color sidebar
- Thread reply via `message_reference` when triggered from a thread

### MS Teams

**Type:** Messaging only | **Protocol:** Microsoft Graph API

Connects to Microsoft Teams through the Graph API. Requires Azure AD app registration.

```
Required credentials:
  access_token   - OAuth2 access token
  tenant_id      - Azure AD tenant ID
  team_id        - Target team ID
```

#### Trigger Pattern

Same as Slack/Discord: `@openkoi <task>` mention in a watched channel.

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

## Rich Messaging

When the daemon completes a task triggered from an integration, it sends a structured `RichMessage` instead of plain text. Rich messages provide a consistent format across platforms while adapting to each platform's native formatting.

### RichMessage Structure

```rust
pub struct RichMessage {
    pub text: String,              // Main body text
    pub title: Option<String>,     // Bold heading
    pub fields: Vec<(String, String)>, // Key-value pairs (e.g., Score: 0.92)
    pub color: Option<String>,     // Sidebar color (#36a64f for success)
    pub thread_id: Option<String>, // Reply to this message/thread
}
```

### Platform Rendering

| Platform | Title | Fields | Color | Thread |
|----------|-------|--------|-------|--------|
| **Slack** | Block Kit header | Inline fields in attachment | Attachment sidebar color | `thread_ts` reply |
| **Discord** | Embed title | Embed fields (inline) | Embed color | `message_reference` |
| **Telegram** | Bold Markdown (`*title*`) | Inline text (`Key: Value \| ...`) | Not supported | `reply_to_message_id` |
| **MS Teams** | Adaptive Card title | Card fields | Theme color | Thread reply |

### Example: Task Completion

When a task completes, the daemon sends a rich message like:

**Slack rendering:**
```
┌─────────────────────────────────────┐
│ Task Complete: Fix the login bug    │ ← title
├─────────────────────────────────────┤
│ Score: 0.92  Cost: $0.18            │ ← fields
│ Iterations: 2                       │
├─────────────────────────────────────┤
│ Fixed the null check in             │ ← body text
│ validateToken() that caused...      │
└─────────────────────────────────────┘
  ▌ green sidebar                       ← color
```

**Telegram rendering:**
```
*Task Complete: Fix the login bug*
Score: 0.92 | Cost: $0.18 | Iterations: 2

Fixed the null check in validateToken() that caused...
```

### Progress Notifications

During long-running tasks, the daemon sends progress updates every **60 seconds** via rich messages:

```
*In Progress: Fix the login bug*
Phase: executing | Iteration: 2/3 | Score: 0.78 | Cost: $0.12
```

These are sent to the same channel/thread as the original trigger message.

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

When running as a daemon (`openkoi daemon start`), integrations with messaging capability are polled for incoming messages at regular intervals:

| Integration | Poll Interval | Trigger Pattern |
|-------------|--------------|-----------------|
| Slack | 30s | `@openkoi <task>` |
| Discord | 30s | `@openkoi <task>` |
| MS Teams | 30s | `@openkoi <task>` |
| Telegram | 10s | `/koi <task>` or `@openkoi_bot <task>` |
| iMessage | 30s | `koi: <task>` |
| Email | 60s | Subject or body matching configured keywords |

When a trigger is detected, the daemon:

1. Extracts the task description from the message
2. Executes the task through the full iteration engine
3. Sends progress updates every 60 seconds (as rich messages when supported)
4. Replies with the final result in the same channel/thread

```toml
# config.toml — enable watching for specific integrations
[integrations.slack]
enabled = true
channels = ["#engineering", "#general"]

[integrations.telegram]
enabled = true
channels = ["-1001234567890"]

[integrations.discord]
enabled = true
channels = ["engineering", "general"]
```

Messages directed at the agent (e.g., `@openkoi summarize this thread` or `/koi fix the login bug`) are picked up by the watcher and processed as tasks. The daemon responds through the same integration with structured results.

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
