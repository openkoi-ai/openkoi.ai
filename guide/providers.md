# Providers

OpenKoi is model-agnostic. It supports multiple LLM providers out of the box and can assign different models to different roles within the iteration engine. Providers are auto-discovered from environment variables and local services -- no manual configuration required for the common case.

## Provider Trait

Every provider implements the same Rust trait, making them interchangeable:

```rust
#[async_trait]
pub trait ModelProvider: Send + Sync {
    fn id(&self) -> &str;
    fn name(&self) -> &str;
    fn models(&self) -> &[ModelInfo];

    async fn chat(
        &self,
        request: ChatRequest,
    ) -> Result<ChatResponse, ProviderError>;

    async fn chat_stream(
        &self,
        request: ChatRequest,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<ChatChunk>>>>, ProviderError>;

    async fn embed(
        &self,
        texts: &[&str],
    ) -> Result<Vec<Vec<f32>>, ProviderError>;
}
```

The `chat` method is used for non-streaming calls (evaluation, planning). The `chat_stream` method is used for execution output that streams to the terminal. The `embed` method generates vector embeddings for semantic memory search.

---

## Built-in Providers

### Subscription-Based (OAuth)

These providers use **device-code OAuth** — you authenticate through your browser using your existing subscription. No API key needed.

#### GitHub Copilot

| Property | Value |
|----------|-------|
| **Provider ID** | `github-copilot` |
| **Auth** | Device-code OAuth (GitHub login) |
| **Command** | `openkoi connect copilot` |
| **Default model** | Copilot Chat model |
| **API** | GitHub Copilot Chat API |
| **Streaming** | Yes (SSE) |
| **Embeddings** | No |

Works with any GitHub Copilot subscription (Individual, Business, or Enterprise). When you run `openkoi connect copilot`, OpenKoi displays a device code and opens your browser. Sign in to GitHub, enter the code, and you're connected.

```
$ openkoi connect copilot

  Visit: https://github.com/login/device
  Enter code: ABCD-1234

  Waiting for authorization...
  Connected to GitHub Copilot.
```

Tokens are stored in `~/.openkoi/auth.json` and refreshed automatically before expiry.

#### ChatGPT (OpenAI)

| Property | Value |
|----------|-------|
| **Provider ID** | `openai-oauth` |
| **Auth** | Device-code OAuth (OpenAI login) |
| **Command** | `openkoi connect chatgpt` |
| **Default model** | ChatGPT model |
| **API** | OpenAI ChatGPT API |
| **Streaming** | Yes (SSE) |
| **Embeddings** | No |

Works with ChatGPT Plus or Pro subscriptions. The flow is identical to GitHub Copilot — device code, browser login, done.

```
$ openkoi connect chatgpt

  Visit: https://login.chatgpt.com/device
  Enter code: WXYZ-5678

  Waiting for authorization...
  Connected to ChatGPT.
```

Tokens are stored in `~/.openkoi/auth.json` alongside any other OAuth tokens.

### API Key Providers

#### Anthropic

| Property | Value |
|----------|-------|
| **Provider ID** | `anthropic` |
| **API key env var** | `ANTHROPIC_API_KEY` |
| **Default model** | `claude-sonnet-4-5` |
| **API** | Anthropic Messages API |
| **Streaming** | Yes (SSE) |
| **Embeddings** | No (use OpenAI embedder) |

Anthropic is the highest-priority API key provider when auto-detecting. OpenKoi uses Anthropic's **prompt caching** feature to reduce costs on repeated system prompts across iterations within a session.

##### Prompt Caching

The system prompt (soul + task context + skill descriptions) is marked with `cache_control: Ephemeral`. This tells Anthropic to cache the system prompt across consecutive API calls, saving approximately 90% of input tokens on the system prompt portion.

```rust
// Simplified from src/provider/anthropic.rs
SystemBlock {
    text: system_prompt,
    cache_control: Some(CacheControl::Ephemeral),
}
```

Prompt caching is automatic and requires no configuration. It only applies to the Anthropic provider.

##### Credential Sources

Anthropic keys can come from multiple sources (checked in order):

1. `ANTHROPIC_API_KEY` environment variable
2. Claude CLI credentials at `~/.claude/.credentials.json`
3. macOS Keychain entry `Claude Code-credentials`
4. Saved credentials at `~/.openkoi/credentials/anthropic.key`

#### OpenAI

| Property | Value |
|----------|-------|
| **Provider ID** | `openai` |
| **API key env var** | `OPENAI_API_KEY` |
| **Default model** | `gpt-5.2` |
| **API** | OpenAI Chat Completions API |
| **Streaming** | Yes (SSE) |
| **Embeddings** | Yes (`text-embedding-3-small`) |

OpenAI is the second-priority API key provider. It also serves as the default embedder -- `openai/text-embedding-3-small` is used for vector embeddings unless overridden.

##### Credential Sources

1. `OPENAI_API_KEY` environment variable
2. OpenAI Codex CLI credentials
3. Saved credentials at `~/.openkoi/credentials/openai.key`

#### Google

| Property | Value |
|----------|-------|
| **Provider ID** | `google` |
| **API key env var** | `GOOGLE_API_KEY` |
| **Default model** | `gemini-2.5-pro` |
| **API** | Google Generative AI API |
| **Streaming** | Yes |
| **Embeddings** | Yes |

Google is the third-priority provider in auto-detection.

### Local Providers

#### Ollama

| Property | Value |
|----------|-------|
| **Provider ID** | `ollama` |
| **Connection** | Local probe at `localhost:11434` |
| **Default model** | Best available (see priority below) |
| **API** | Ollama REST API (OpenAI-compatible) |
| **Streaming** | Yes |
| **Embeddings** | Yes (model-dependent) |

Ollama is the zero-cost, zero-key path. OpenKoi probes `localhost:11434` on startup. If Ollama is running, it queries the available models and selects the best one.

##### Model Priority

When multiple Ollama models are available, OpenKoi picks the best one by quality:

| Priority | Model | Notes |
|----------|-------|-------|
| 1 | `qwen2.5-coder` | Best coding model available locally |
| 2 | `codestral` | Strong coding model from Mistral |
| 3 | `deepseek-coder-v2` | Good code + general capability |
| 4 | `llama3.3` | Strong general-purpose model |
| 5 | `llama3.1` | Older but capable |
| 6 | `mistral` | Lightweight general-purpose |
| 7 | `gemma2` | Google's open model |
| fallback | First available model | If none of the above are found |

If no models are installed, OpenKoi suggests running `ollama pull llama3.3`.

#### AWS Bedrock

| Property | Value |
|----------|-------|
| **Provider ID** | `bedrock` |
| **Auth** | AWS credentials (IAM / SigV4) |
| **API** | AWS Bedrock Runtime API |
| **Streaming** | Yes |
| **Embeddings** | Yes (model-dependent) |

##### Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_ACCESS_KEY_ID` | Yes | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS IAM secret key |
| `AWS_SESSION_TOKEN` | No | Temporary session token (for assumed roles) |
| `AWS_REGION` | No | AWS region (defaults to `us-east-1`) |

Bedrock uses **SigV4 signing** for all API requests. OpenKoi handles the signing internally using the standard AWS credential chain.

##### Available Models

| Model | Bedrock Model ID |
|-------|-----------------|
| Claude Sonnet 4 | `anthropic.claude-sonnet-4-20250514` |
| Claude 3.5 Haiku | `anthropic.claude-3-5-haiku-20241022` |
| Amazon Nova Pro | `amazon.nova-pro-v1:0` |
| Llama 3.3 70B | `meta.llama3-3-70b-instruct-v1:0` |

#### OpenAI-Compatible Providers

Any provider that implements the OpenAI Chat Completions API can be used. These are configured via environment variables or the config file.

| Provider | API Key Env Var | Default Model | Base URL |
|----------|----------------|---------------|----------|
| **Groq** | `GROQ_API_KEY` | `llama-3.3-70b-versatile` | `https://api.groq.com/openai/v1` |
| **OpenRouter** | `OPENROUTER_API_KEY` | `auto` | `https://openrouter.ai/api/v1` |
| **Together** | `TOGETHER_API_KEY` | `meta-llama/Llama-3.3-70B-Instruct-Turbo` | `https://api.together.xyz/v1` |
| **DeepSeek** | `DEEPSEEK_API_KEY` | `deepseek-chat` | `https://api.deepseek.com/v1` |
| **MiniMax** | `MINIMAX_API_KEY` | `MiniMax-M2.5` | `https://api.minimax.io/v1` |
| **Moonshot / Kimi** | `MOONSHOT_API_KEY` | `kimi-k2.5` | `https://api.moonshot.cn/v1` |
| **xAI** | `XAI_API_KEY` | `grok-4-0709` | `https://api.x.ai/v1` |
| **Custom** | User-defined | User-defined | User-defined |

##### Custom Endpoint Configuration

For a self-hosted or unlisted OpenAI-compatible endpoint, use the provider picker during `openkoi init` and select "Other (OpenAI-compatible URL)", or set it up directly in the config file.

---

## Credential Discovery

On startup, OpenKoi scans for credentials in the following order. The first match wins.

| Priority | Source | Example |
|----------|--------|---------|
| 1 | **Environment variables** | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc. |
| 2 | **OAuth store** | GitHub Copilot, ChatGPT tokens from `openkoi connect` (`~/.openkoi/auth.json`) |
| 3 | **Claude CLI credentials** | `~/.claude/.credentials.json` |
| 4 | **Claude CLI Keychain** (macOS) | macOS Keychain entry `Claude Code-credentials` |
| 5 | **OpenAI Codex CLI** | Codex CLI auth credentials |
| 6 | **Qwen CLI** | `~/.qwen/oauth_creds.json` |
| 7 | **Saved OpenKoi credentials** | `~/.openkoi/credentials/<provider>.key` |
| 8 | **Ollama probe** | TCP connection to `localhost:11434` |

This means if you already have Claude Code or Codex CLI installed and authenticated, OpenKoi will automatically use those credentials with zero setup. And if you have a GitHub Copilot or ChatGPT subscription, `openkoi connect` is all you need.

---

## Default Model Priority

When no model is specified (no `--model` flag, no `OPENKOI_MODEL`, no config file), OpenKoi picks the best available model:

| Priority | Provider | Model | Why |
|----------|----------|-------|-----|
| 1 | `anthropic` | `claude-sonnet-4-5` | Best overall quality for coding and reasoning |
| 2 | `openai` | `gpt-5.2` | Strong general-purpose model |
| 3 | `google` | `gemini-2.5-pro` | Competitive with large context window |
| 4 | `ollama` | Best local model | Free, no API key needed |

If no provider is found at all, OpenKoi launches an interactive provider picker that helps you set up Ollama (free) or paste an API key.

---

## Role-Based Model Assignment

OpenKoi assigns models to four distinct roles in the iteration engine:

| Role | What it does | Recommended characteristics |
|------|-------------|---------------------------|
| **Executor** | Performs the task (writes code, generates text, analyzes data) | Fast, high-quality generation |
| **Evaluator** | Judges the executor's output against rubrics | Precise, critical reasoning |
| **Planner** | Creates the initial plan and refines it between iterations | Good at decomposition and strategy |
| **Embedder** | Generates vector embeddings for semantic memory search | Fast, inexpensive |

### Default Behavior

If you specify a single model (via `--model` or `OPENKOI_MODEL`), it is used for executor, evaluator, and planner. The embedder always defaults to `openai/text-embedding-3-small` unless explicitly overridden.

```bash
# All three roles use claude-sonnet-4-5
openkoi --model anthropic/claude-sonnet-4-5 "Fix the bug"
```

### Per-Role Assignment

For more control, assign different models to different roles:

```bash
# CLI flags
openkoi --executor anthropic/claude-sonnet-4-5 --evaluator anthropic/claude-opus-4-6 "Fix the bug"
```

```toml
# config.toml
[models]
executor  = "anthropic/claude-sonnet-4-5"
evaluator = "anthropic/claude-opus-4-6"
planner   = "anthropic/claude-sonnet-4-5"
embedder  = "openai/text-embedding-3-small"
```

A common pattern is to use a fast, cheaper model for execution and a more capable model for evaluation:

```toml
[models]
executor  = "openai/gpt-5.2"
evaluator = "anthropic/claude-opus-4-6"
```

---

## Fallback Chain

When a provider returns a transient error (rate limit, server error, timeout), OpenKoi automatically falls back to the next model in the chain.

### How It Works

1. The primary model is tried first.
2. On transient failure, the model enters a **cooldown period** and is temporarily skipped.
3. The next model in the fallback chain is tried.
4. If all models in the chain fail, the task returns an `AllCandidatesExhausted` error.

### Configuration

```toml
[models.fallback]
executor = [
  "anthropic/claude-sonnet-4-5",
  "openai/gpt-5.2",
  "ollama/llama3.3",
]
```

### What Triggers a Fallback

| Error Type | Fallback? | Notes |
|-----------|-----------|-------|
| Rate limit (429) | Yes | Model enters cooldown |
| Server error (5xx) | Yes | Model enters cooldown |
| Timeout | Yes | Model enters cooldown |
| Authentication error (401/403) | No | Permanent error, not retriable |
| Invalid request (400) | No | Permanent error, not retriable |

---

## Model Reference Format

Throughout OpenKoi -- CLI flags, config files, REPL commands -- models are referenced using the `provider/model-name` format:

```
anthropic/claude-sonnet-4-5
openai/gpt-5.2
google/gemini-2.5-pro
ollama/llama3.3
ollama/codestral
bedrock/anthropic.claude-sonnet-4-20250514
groq/llama-3.3-70b-versatile
openrouter/auto
together/meta-llama/Llama-3.3-70B-Instruct-Turbo
deepseek/deepseek-chat
minimax/MiniMax-M2.5
xai/grok-4-0709
```

The provider prefix is required to disambiguate models that may share names across providers.

---

## Connect and Disconnect

Use `openkoi connect` to authenticate with subscription-based providers, and `openkoi disconnect` to remove stored credentials. Both commands support interactive selection when the provider argument is omitted.

### Connecting

```bash
# Interactive picker (shows all providers and integrations with descriptions)
openkoi connect

# Or specify directly
openkoi connect copilot     # GitHub Copilot
openkoi connect chatgpt     # ChatGPT Plus/Pro

# Check connection status for all providers
openkoi connect status
```

When run without an argument, `connect` shows an interactive picker listing all 12 supported targets with descriptive hints:

```
$ openkoi connect

? Select a provider or integration to connect:
> GitHub Copilot — Device-code OAuth (use your existing subscription)
  ChatGPT Plus/Pro — Device-code OAuth (use your existing subscription)
  Anthropic — API key
  OpenAI — API key
  ...
```

Each `connect` command initiates a device-code flow: OpenKoi displays a URL and a short code, opens your browser, and waits for you to authorize. Once complete, tokens are saved to `~/.openkoi/auth.json` and refreshed automatically.

### Disconnecting

```bash
# Interactive picker (shows only currently connected providers)
openkoi disconnect

# Or specify directly
openkoi disconnect copilot      # Remove GitHub Copilot OAuth token
openkoi disconnect chatgpt      # Remove ChatGPT OAuth token
openkoi disconnect anthropic    # Remove saved API key

# Remove all OAuth tokens
openkoi disconnect all
```

When run without an argument, `disconnect` dynamically scans your currently connected providers and integrations and shows only those in the picker, plus an "All" option:

```
$ openkoi disconnect

? Select a provider to disconnect:
> GitHub Copilot (connected)
  Anthropic (API key from env)
  Slack (connected)
  All — remove all stored credentials
```

Disconnecting deletes the stored token or key. You can reconnect at any time by running `openkoi connect` again.

### Connection Status

```bash
$ openkoi connect status

  GitHub Copilot:  connected (token valid, expires in 47m)
  ChatGPT:         connected (token valid, expires in 2h 13m)
  Anthropic:       connected (API key from env)
  Ollama:          connected (localhost:11434, 3 models)
```

---

## Adding a New Provider

OpenKoi's provider layer is designed for extensibility. There are three paths:

### 1. OpenAI-Compatible (Easiest)

If the provider implements the OpenAI Chat Completions API, no code changes are needed. Set the API key and base URL:

```bash
export MY_PROVIDER_API_KEY=sk-...
```

Then reference it via config or CLI with an OpenAI-compatible prefix.

### 2. WASM Plugin

For providers with non-standard APIs, implement the provider interface as a WASM plugin:

```toml
[plugins]
wasm = ["~/.openkoi/plugins/wasm/my-provider.wasm"]
```

WASM plugins run sandboxed and must declare network capabilities in their manifest.

### 3. Native (Rust)

For first-class support, implement the `ModelProvider` trait in Rust and submit a contribution. See `src/provider/` for existing implementations.

---

## Token Usage Tracking

Every API call returns a `TokenUsage` struct that feeds into cost tracking:

```rust
pub struct TokenUsage {
    pub input_tokens: u32,
    pub output_tokens: u32,
    pub cache_read_tokens: u32,   // Anthropic prompt caching
    pub cache_write_tokens: u32,  // Anthropic prompt caching
}
```

The `cache_read_tokens` and `cache_write_tokens` fields are specific to Anthropic's prompt caching. For other providers, these are always zero. Cost is calculated per-model using the provider's published pricing.

View your token usage and costs with:

```bash
openkoi status --costs
```
