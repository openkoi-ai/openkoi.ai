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
    async fn send_rich(&self, target: &str, msg: &RichMessage) -> Result<String> {
        // Default: falls back to self.send(target, &msg.text)
    }
    async fn history(&self, channel: &str, limit: u32) -> Result<Vec<IncomingMessage>>;
    async fn search(&self, query: &str) -> Result<Vec<IncomingMessage>>;
}
```

| Method | Purpose |
|--------|---------|
| `send` | Send a plain text message to a target (channel, user, thread) |
| `send_rich` | Send a structured message with title, fields, color, and thread support. Has a default implementation that falls back to plain `send()` |
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
| **iMessage** | Messaging | `MessagingAdapter` | AppleScript + SQLite | macOS only | None (system access) |
| **Telegram** | Messaging | `MessagingAdapter` | Bot API (HTTPS) | Any | `TELEGRAM_BOT_TOKEN` |
| **Slack** | Hybrid | Both | Web API | Any | `SLACK_BOT_TOKEN` |
| **Discord** | Messaging | `MessagingAdapter` | REST API (v10) | Any | `DISCORD_BOT_TOKEN` |
| **MS Teams** | Messaging | `MessagingAdapter` | Microsoft Graph API | Any | `MSTEAMS_ACCESS_TOKEN`, `MSTEAMS_TENANT_ID` |
| **Notion** | Document | `DocumentAdapter` | REST API (HTTPS) | Any | `NOTION_API_KEY` |
| **Google Docs** | Document | `DocumentAdapter` | REST API + OAuth2 | Any | OAuth2 credentials |
| **Google Sheets** | Document | `DocumentAdapter` | REST API + OAuth2 | Any | OAuth2 credentials (shared with Docs) |
| **MS Office** | Document | `DocumentAdapter` | Local files | Any | None (local filesystem) |
| **Email** | Messaging | `MessagingAdapter` | IMAP/SMTP | Any | IMAP/SMTP credentials |

### iMessage

**Type:** Messaging only | **Platform:** macOS only

Uses AppleScript to send messages and reads history from the `~/Library/Messages/chat.db` SQLite database. No API key needed -- access is granted through macOS system permissions.

Capabilities:
- Send messages to contacts or phone numbers
- Read recent messages from conversations (via chat.db)
- Watch for incoming messages (requires daemon mode)
- Search message history (SQL LIKE query on chat.db)

#### Trigger Pattern

The daemon triggers a task when it sees a message starting with `koi:`:

| Pattern | Example |
|---------|---------|
| `koi: <task>` | `koi: summarize the project readme` |

Limitations:
- macOS only (AppleScript + chat.db dependency)
- Requires granting Accessibility permissions to OpenKoi
- No group chat management
- No `send_rich` override -- rich messages fall back to plain text

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

**Rich message** -- MarkdownV2-formatted output with bold title, pipe-separated fields, and thread reply:

```
*Task Complete: Fix the login bug*
Score: 0.92 | Cost: $0.18 | Iterations: 2

Fixed the null check in validateToken\(\) that caused\.\.\.
```

Rich messages use `reply_to_message_id` to thread back to the original command message. Special characters are escaped for MarkdownV2 format.

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

- No message search (Telegram Bot API does not support it -- `search` returns an error)
- History is limited to unprocessed updates via `getUpdates` (no deep message history)
- Bot must be added to groups manually; it cannot join on its own

### Slack

**Type:** Hybrid (messaging + documents) | **Protocol:** Web API

Slack is the only integration that implements **both** adapter types. As a `MessagingAdapter`, it handles channels and DMs. As a `DocumentAdapter`, it can read, create, and list files/snippets.

```bash
export SLACK_BOT_TOKEN=xoxb-your-token-here
```

Configuration supports channel filtering:

```toml
[integrations.slack]
enabled = true
channels = ["#engineering", "#general", "#product"]
```

Required Slack app scopes: `channels:read`, `channels:history`, `chat:write`, `search:read`, `users:read`, `files:read`, `files:write`.

#### Trigger Patterns

The daemon watches configured channels (polling every **30 seconds**) and triggers a task when it detects:

| Pattern | Example |
|---------|---------|
| `@openkoi <task>` | `@openkoi summarize this thread` |
| `<@openkoi> <task>` | Slack's native mention format |

#### Rich Messages

Task results are sent as Slack [Block Kit](https://api.slack.com/block-kit) attachments with:

- Header block for the title
- Section block with inline key-value fields (Score, Cost, Iterations)
- Section block for the body text
- Color sidebar via attachment wrapper (green for success, red for failure)
- Thread support via `thread_ts` -- replies to the original message when triggered from a thread

#### Document Capabilities

Slack's `DocumentAdapter` maps to the Slack Files API:

- **read** -- `files.info` + authenticated download of file content
- **write** -- `files.upload` (uploads as a new snippet; cannot update in-place)
- **create** -- `files.upload` with title and content, returns file ID
- **search** -- `files.list` filtered by query
- **list** -- `files.list` with count=20

### Discord

**Type:** Messaging only | **Protocol:** REST API (v10)

Connects via the Discord REST API (v10) using bot token authentication.

```bash
export DISCORD_BOT_TOKEN=your-bot-token-here
```

```toml
[integrations.discord]
enabled = true
channels = ["engineering", "general"]
```

Capabilities:
- Send and receive messages in channels
- Thread support via `message_reference`
- Message history retrieval

#### Trigger Patterns

The daemon watches configured channels (polling every **30 seconds**) and triggers tasks when it detects `@openkoi <task>` in a message.

#### Rich Messages

Task results are sent as Discord embeds with:

- Embed title and description
- Inline fields (Score, Cost, Iterations)
- Hex color converted to integer for embed color
- Thread reply via `message_reference` when triggered from a thread

#### Limitations

- Search requires a guild ID and is not currently supported (`discord_search` returns an error)
- No reaction monitoring

### MS Teams

**Type:** Messaging only | **Protocol:** Microsoft Graph API

Connects to Microsoft Teams through the Graph API. Requires Azure AD app registration.

```bash
export MSTEAMS_ACCESS_TOKEN=your-access-token
export MSTEAMS_TENANT_ID=your-tenant-id
export MSTEAMS_TEAM_ID=your-team-id  # optional default
```

```toml
[integrations.msteams]
enabled = true
channels = ["engineering"]
```

Required credentials:

| Credential | Env Variable | Description |
|-----------|-------------|-------------|
| `access_token` | `MSTEAMS_ACCESS_TOKEN` | OAuth2 access token (required) |
| `tenant_id` | `MSTEAMS_TENANT_ID` | Azure AD tenant ID (required) |
| `team_id` | `MSTEAMS_TEAM_ID` | Default team ID (optional; can be specified per-target as `team_id/channel_id`) |

#### Target Format

When sending messages or reading history, the target can be specified as:
- `team_id/channel_id` -- explicit team and channel
- `channel_id` -- uses the default `team_id` from credentials (errors if not set)

#### Trigger Pattern

Same as Slack/Discord: `@openkoi <task>` mention in a watched channel.

#### Limitations

- No `send_rich` override -- rich messages fall back to plain text via `send()`
- Search requires Microsoft Search API permissions (not currently supported -- `msteams_search` returns an error)
- HTML content in message history is automatically stripped to plain text

### Notion

**Type:** Document only | **Protocol:** REST API (v2022-06-28)

Connects to Notion workspaces for reading, writing, and creating pages.

```bash
export NOTION_API_KEY=ntn_your-integration-token
```

```toml
[integrations.notion]
enabled = true
```

Capabilities:
- Read page content (Notion blocks converted to plain text)
- Append content to existing pages (adds new paragraph blocks)
- Create new pages in the workspace (with title and content blocks)
- Search across the workspace
- List pages (via search with page filter)

::: info Write behavior
`notion_write_doc` **appends** paragraph blocks to the page. It does not replace existing content. To fully rewrite a page, delete the existing blocks first via the Notion UI.
:::

Supported block types for text extraction: Paragraph, Heading 1-3, Bulleted List Item, Numbered List Item, Code.

### Google Docs

**Type:** Document only | **Protocol:** REST API + OAuth2

Connects to Google Docs for document management. Requires OAuth2 setup with a Google Cloud project.

```bash
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret
export GOOGLE_ACCESS_TOKEN=your-access-token
export GOOGLE_REFRESH_TOKEN=your-refresh-token  # optional, enables auto-refresh
```

Capabilities:
- Read document content (extracted from paragraph elements)
- Append text to documents (inserts at the beginning of the document body)
- Create new documents
- Search across Google Drive (filtered to Google Docs)
- List documents in Drive (ordered by modification time)

::: info Write behavior
`google_docs_write_doc` uses `batchUpdate` with `insertText` at index 1, which inserts content at the beginning of the document body. It does not replace existing content.
:::

### Google Sheets

**Type:** Document only | **Protocol:** REST API + OAuth2

Shares OAuth2 credentials with Google Docs. Treats spreadsheets as structured documents using tab-separated values (TSV).

Capabilities:
- Read sheet data (first sheet, returned as TSV)
- Write to Sheet1 range (input parsed as TSV, uses `RAW` value input option)
- Create new spreadsheets
- Search across Google Drive (filtered to Google Sheets)
- List spreadsheets in Drive (ordered by modification time)

### MS Office (Local)

**Type:** Document only | **Protocol:** Local files

Reads and writes local Office files and plain text files using Rust-native parsing. No network access or API keys required.

```toml
[integrations.msoffice]
enabled = true
base_dir = "~/Projects"  # optional, defaults to ~/Documents
```

Supported file formats:

| Format | Read | Write |
|--------|------|-------|
| `.docx` | Text extraction from `<w:t>` XML tags | Creates minimal valid .docx with content |
| `.xlsx` | Shared strings + cell values as TSV | Not supported (read-only) |
| `.txt` | Direct read | Direct write |
| `.md` | Direct read | Direct write |
| `.csv` | Direct read | Direct write |

Capabilities:
- Read document content (auto-detects format by extension)
- Write documents (.docx, .txt, .md, .csv)
- Create new documents (extension inferred from title, defaults to .docx)
- Search files by name in the base directory (case-insensitive, max depth 3, max 20 results)
- List files in a directory (max depth 2, max 50 results)

### Email

**Type:** Messaging only | **Protocol:** IMAP/SMTP

Connects to email accounts via standard IMAP (reading) and SMTP (sending) protocols. All operations are run on blocking threads via `spawn_blocking` to avoid blocking the async runtime.

```bash
export EMAIL_ADDRESS=you@example.com
export EMAIL_PASSWORD=your-app-password
# Optional overrides (defaults are for Gmail):
export EMAIL_IMAP_HOST=imap.gmail.com
export EMAIL_IMAP_PORT=993
export EMAIL_SMTP_HOST=smtp.gmail.com
export EMAIL_SMTP_PORT=587
```

```toml
[integrations.email]
enabled = true
```

Credentials:

| Field | Env Variable | Default | Description |
|-------|-------------|---------|-------------|
| `email` | `EMAIL_ADDRESS` | -- | Email account address (required) |
| `password` | `EMAIL_PASSWORD` | -- | Account password or app-specific password (required) |
| `imap_host` | `EMAIL_IMAP_HOST` | `imap.gmail.com` | IMAP server hostname |
| `imap_port` | `EMAIL_IMAP_PORT` | `993` | IMAP port |
| `smtp_host` | `EMAIL_SMTP_HOST` | `smtp.gmail.com` | SMTP server hostname |
| `smtp_port` | `EMAIL_SMTP_PORT` | `587` | SMTP port |

Convenience constructors are available for common providers:
- `EmailAdapter::gmail(email, password)` -- Gmail defaults
- `EmailAdapter::outlook(email, password)` -- Outlook/Office365 defaults

#### Sending Emails

The `email_send` tool's `message` parameter supports an optional `Subject: ...` header:

```
Subject: Weekly Report

Here is the summary of this week's progress...
```

If no `Subject:` line is found, the default subject is "Message from OpenKoi".

#### Capabilities

- Read emails from INBOX (reverse chronological, with text extraction from MIME parts)
- Send emails via SMTP with STARTTLS
- Search email by subject or body (`IMAP SEARCH OR SUBJECT "..." BODY "..."`, max 20 results)

## Rich Messaging

When the daemon completes a task triggered from an integration, it sends a structured `RichMessage` instead of plain text. Rich messages provide a consistent format across platforms while adapting to each platform's native formatting.

### RichMessage Structure

```rust
pub struct RichMessage {
    pub text: String,              // Plain-text fallback (always required)
    pub title: Option<String>,     // Bold heading
    pub fields: Vec<(String, String)>, // Key-value pairs (e.g., Score: 0.92)
    pub color: Option<String>,     // Sidebar color (#36a64f for success)
    pub thread_id: Option<String>, // Reply to this message/thread
}
```

Builder methods: `RichMessage::new(text)`, `.with_title()`, `.with_field(key, value)`, `.with_color()`, `.in_thread()`.

### Platform Rendering

| Platform | Title | Fields | Color | Thread | `send_rich` |
|----------|-------|--------|-------|--------|-------------|
| **Slack** | Block Kit header | Section block with inline fields | Attachment sidebar color | `thread_ts` reply | Custom override |
| **Discord** | Embed title | Embed fields (inline) | Embed color (hex to int) | `message_reference` | Custom override |
| **Telegram** | Bold MarkdownV2 (`*title*`) | Pipe-separated text (`Key: Value \| ...`) | Not supported | `reply_to_message_id` | Custom override |
| **MS Teams** | -- | -- | -- | -- | Default fallback (plain text) |
| **Email** | -- | -- | -- | -- | Default fallback (plain text) |
| **iMessage** | -- | -- | -- | -- | Default fallback (plain text) |

Only Slack, Discord, and Telegram implement custom `send_rich` overrides. All other integrations use the default implementation which falls back to `send(target, &msg.text)`.

### Example: Task Completion

When a task completes, the daemon sends a rich message like:

**Slack rendering:**
```
┌─────────────────────────────────────┐
│ Task Complete: Fix the login bug    │ ← header block
├─────────────────────────────────────┤
│ Score: 0.92  Cost: $0.18            │ ← section fields
│ Iterations: 2                       │
├─────────────────────────────────────┤
│ Fixed the null check in             │ ← section body
│ validateToken() that caused...      │
└─────────────────────────────────────┘
  ▌ green sidebar                       ← attachment color
```

**Telegram rendering:**
```
*Task Complete: Fix the login bug*
Score: 0.92 | Cost: $0.18 | Iterations: 2

Fixed the null check in validateToken\(\) that caused\.\.\.
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

Each messaging integration registers three tools:

| Tool Name | Parameters | Description |
|-----------|-----------|-------------|
| `{id}_send` | `target` (string, required), `message` (string, required) | Send a message via the integration |
| `{id}_read` | `channel` (string, required), `limit` (integer, optional) | Read recent messages from a channel |
| `{id}_search` | `query` (string, required) | Search messages in the integration |

### Document Integrations

Each document integration registers up to five tools:

| Tool Name | Parameters | Description |
|-----------|-----------|-------------|
| `{id}_read_doc` | `doc_id` (string, required) | Read a document |
| `{id}_write_doc` | `doc_id` (string, required), `content` (string, required) | Write/update a document |
| `{id}_create_doc` | `title` (string, required), `content` (string, optional) | Create a new document |
| `{id}_search` | `query` (string, required) | Search documents (only if messaging didn't already register `_search`) |
| `{id}_list_docs` | `folder` (string, optional) | List documents in a folder |

### Tool Deduplication

If an integration implements **both** adapters (like Slack), the `_search` tool is only registered once by the messaging branch, to avoid duplicate tool names.

### Example: Connected Slack + Notion

With Slack and Notion both connected, the agent has access to:

```
# Slack (hybrid — 7 tools)
slack_send       - Send a Slack message
slack_read       - Read Slack messages
slack_search     - Search Slack messages
slack_read_doc   - Read a Slack file/snippet
slack_write_doc  - Upload a new file to Slack
slack_create_doc - Create a new file in Slack
slack_list_docs  - List Slack files

# Notion (document — 5 tools)
notion_read_doc   - Read a Notion page
notion_write_doc  - Append content to a Notion page
notion_create_doc - Create a new Notion page
notion_search     - Search Notion workspace
notion_list_docs  - List Notion pages
```

### Complete Tool Reference

| Integration | ID | Tools | Count |
|------------|-----|-------|-------|
| **Slack** | `slack` | `_send`, `_read`, `_search`, `_read_doc`, `_write_doc`, `_create_doc`, `_list_docs` | 7 |
| **Discord** | `discord` | `_send`, `_read`, `_search` | 3 |
| **Telegram** | `telegram` | `_send`, `_read`, `_search` | 3 |
| **MS Teams** | `msteams` | `_send`, `_read`, `_search` | 3 |
| **Email** | `email` | `_send`, `_read`, `_search` | 3 |
| **iMessage** | `imessage` | `_send`, `_read`, `_search` | 3 |
| **Notion** | `notion` | `_read_doc`, `_write_doc`, `_create_doc`, `_search`, `_list_docs` | 5 |
| **Google Docs** | `google_docs` | `_read_doc`, `_write_doc`, `_create_doc`, `_search`, `_list_docs` | 5 |
| **Google Sheets** | `google_sheets` | `_read_doc`, `_write_doc`, `_create_doc`, `_search`, `_list_docs` | 5 |
| **MS Office** | `msoffice` | `_read_doc`, `_write_doc`, `_create_doc`, `_search`, `_list_docs` | 5 |
| | | **Maximum total (all active):** | **42** |

### Tool Registration Code

```rust
pub fn tools_for_integration(integration: &dyn Integration) -> Vec<ToolDef> {
    let mut tools = Vec::new();
    let id = integration.id();
    let name = integration.name();
    let has_messaging = integration.messaging().is_some();
    let has_document = integration.document().is_some();

    if has_messaging {
        tools.push(ToolDef {
            name: format!("{id}_send"),
            description: format!("Send a message via {name}"),
            parameters: json!({
                "type": "object",
                "properties": {
                    "target": { "type": "string", "description": "Channel or conversation ID" },
                    "message": { "type": "string", "description": "Message content to send" }
                },
                "required": ["target", "message"]
            }),
        });
        tools.push(ToolDef {
            name: format!("{id}_read"),
            description: format!("Read recent messages from {name}"),
            parameters: json!({
                "type": "object",
                "properties": {
                    "channel": { "type": "string", "description": "Channel or conversation ID" },
                    "limit": { "type": "integer", "description": "Number of messages to fetch (default 20)" }
                },
                "required": ["channel"]
            }),
        });
        tools.push(ToolDef {
            name: format!("{id}_search"),
            description: format!("Search messages in {name}"),
            parameters: json!({
                "type": "object",
                "properties": {
                    "query": { "type": "string", "description": "Search query" }
                },
                "required": ["query"]
            }),
        });
    }

    if has_document {
        tools.push(ToolDef {
            name: format!("{id}_read_doc"),
            description: format!("Read a document from {name}"),
            parameters: json!({
                "type": "object",
                "properties": {
                    "doc_id": { "type": "string", "description": "Document ID" }
                },
                "required": ["doc_id"]
            }),
        });
        tools.push(ToolDef {
            name: format!("{id}_write_doc"),
            description: format!("Write/update a document in {name}"),
            parameters: json!({
                "type": "object",
                "properties": {
                    "doc_id": { "type": "string", "description": "Document ID to update" },
                    "content": { "type": "string", "description": "New content for the document" }
                },
                "required": ["doc_id", "content"]
            }),
        });
        tools.push(ToolDef {
            name: format!("{id}_create_doc"),
            description: format!("Create a new document in {name}"),
            parameters: json!({
                "type": "object",
                "properties": {
                    "title": { "type": "string", "description": "Document title" },
                    "content": { "type": "string", "description": "Initial content" }
                },
                "required": ["title"]
            }),
        });
        // Only add _search for document if messaging didn't already add it
        if !has_messaging {
            tools.push(ToolDef {
                name: format!("{id}_search"),
                description: format!("Search documents in {name}"),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "query": { "type": "string", "description": "Search query" }
                    },
                    "required": ["query"]
                }),
            });
        }
        tools.push(ToolDef {
            name: format!("{id}_list_docs"),
            description: format!("List documents in {name}"),
            parameters: json!({
                "type": "object",
                "properties": {
                    "folder": { "type": "string", "description": "Optional folder/database to list from" }
                }
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
openkoi connect discord
openkoi connect telegram
openkoi connect notion
openkoi connect imessage
openkoi connect email
openkoi connect msteams
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
  MS Teams — Graph API credentials
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

[integrations.discord]
enabled = true
channels = ["engineering", "general"]

[integrations.telegram]
enabled = true
channels = ["-1001234567890"]

[integrations.notion]
enabled = true

[integrations.imessage]
enabled = true   # macOS only

[integrations.msteams]
enabled = true
channels = ["engineering"]

[integrations.email]
enabled = true

[integrations.google_sheets]
enabled = true

[integrations.msoffice]
enabled = true
base_dir = "~/Projects"  # optional, defaults to ~/Documents
```

::: info MS Office config
MS Office uses a different config struct (`MsOfficeConfig`) with an optional `base_dir` field. All other integrations use `IntegrationEntry` with `enabled` and `channels` fields.
:::

### Environment Variables

API tokens can be set as environment variables (auto-discovered on startup) or stored in the credentials file. Environment variables take precedence over stored credentials.

```bash
# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...            # optional, for Socket Mode

# Discord
DISCORD_BOT_TOKEN=...

# Telegram
TELEGRAM_BOT_TOKEN=...

# Notion
NOTION_API_KEY=ntn_...

# Google Docs/Sheets (both required to activate)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_ACCESS_TOKEN=...             # optional if using refresh flow
GOOGLE_REFRESH_TOKEN=...            # optional, enables auto-refresh

# Email (both required to activate)
EMAIL_ADDRESS=you@example.com
EMAIL_PASSWORD=your-app-password
EMAIL_IMAP_HOST=imap.gmail.com      # optional, default: imap.gmail.com
EMAIL_IMAP_PORT=993                  # optional, default: 993
EMAIL_SMTP_HOST=smtp.gmail.com      # optional, default: smtp.gmail.com
EMAIL_SMTP_PORT=587                  # optional, default: 587

# MS Teams (access_token + tenant_id both required)
MSTEAMS_ACCESS_TOKEN=...
MSTEAMS_TENANT_ID=...
MSTEAMS_TEAM_ID=...                  # optional default team
```

### Token Format Validation

When connecting an integration, OpenKoi validates the token format (without making API calls):

| Integration | Validation Rule |
|------------|-----------------|
| Slack | Must start with `xoxb-` or `xoxp-` |
| Notion | Must start with `secret_` or `ntn_` |
| Telegram | Must contain `:` |
| Discord | Must be at least 20 characters |
| Others | No format validation (all tokens accepted) |

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
[tools] notion_create_doc("Daily Summary - Feb 17", "...")
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
