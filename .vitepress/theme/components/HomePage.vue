<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const copied = ref(false)
const copyInstall = async () => {
  try {
    await navigator.clipboard.writeText('curl -fsSL https://openkoi.ai/install.sh | sh')
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    console.error('Failed to copy: ', err)
  }
}

const activeTab = ref('developers')

// Terminal demo animation
const demoLines = [
  { type: 'prompt', text: '$ openkoi think "refactor auth module to use JWT"' },
  { type: 'output', text: '' },
  { type: 'status', label: 'SOVEREIGN', text: 'Values: security-first, concise code, full test coverage' },
  { type: 'status', label: 'PARLIAMENT', text: 'Guardian APPROVE · Scholar flags missing refresh logic' },
  { type: 'status', label: 'EXEC', text: 'Rewriting token.rs, middleware.rs, handlers.rs' },
  { type: 'status', label: 'EVAL', text: 'correctness=9.2 safety=9.5 style=8.8' },
  { type: 'status', label: 'REFN', text: 'Style below 9.0 — tightening error types' },
  { type: 'output', text: '' },
  { type: 'status', label: 'EVAL', text: 'Pass 2: correctness=9.4 safety=9.5 style=9.3' },
  { type: 'status', label: 'LEARNED', text: 'Pattern: "JWT auth setup" · Confidence: 0.5 → 0.65' },
  { type: 'done', text: '✓ Done — 4 files changed, 47 insertions, 89 deletions.' },
]
const visibleLines = ref(0)
let demoInterval

// Iteration loop animation
const loopStep = ref(0)
let loopInterval

onMounted(() => {
  // Start terminal demo
  demoInterval = setInterval(() => {
    if (visibleLines.value < demoLines.length) {
      visibleLines.value++
    } else {
      // Pause at end, then restart
      clearInterval(demoInterval)
      setTimeout(() => {
        visibleLines.value = 0
        demoInterval = setInterval(() => {
          if (visibleLines.value < demoLines.length) {
            visibleLines.value++
          } else {
            clearInterval(demoInterval)
          }
        }, 400)
      }, 4000)
    }
  }, 400)

  // Start loop animation
  loopInterval = setInterval(() => {
    loopStep.value++
  }, 2500)
})

onUnmounted(() => {
  clearInterval(demoInterval)
  clearInterval(loopInterval)
})

const loopStages = ['Sovereign', 'Parliament', 'Execute', 'Evaluate', 'Learn']
const currentStage = computed(() => loopStep.value % 5)
</script>

<template>
  <div class="homepage-root">
    <!-- Header -->
    <header class="site-header">
      <a href="/" class="logo-link">
        <img src="/logo.png" alt="OpenKoi" />
        <span class="brand">OpenKoi</span>
      </a>
      <nav class="header-nav">
        <a href="#how-it-works">How It Works</a>
        <a href="#capabilities">Capabilities</a>
        <a href="/guide/introduction">Docs</a>
      </nav>
      <div class="header-right">
        <span class="header-version">v2026.3.11</span>
        <a href="https://github.com/openkoi-ai/openkoi" target="_blank" class="gh-link" aria-label="GitHub">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
      </div>
    </header>

    <main>
      <!-- Hero -->
      <section class="hero">
        <div class="hero-left">
          <p class="hero-label">Executive Function as a Service</p>
          <h1>Stop babysitting<br/><span class="accent">your AI.</span><br/>OpenKoi thinks.</h1>
          <p class="hero-sub">AI coding tools generate a first draft and leave you to fix it. OpenKoi deliberates through a Sovereign-Parliament cognitive stack — iterating until quality thresholds are met.<br/>Single Rust binary. Zero dependencies. Any model.</p>

          <div class="hero-actions">
            <a href="/guide/installation" class="btn-primary">Install OpenKoi →</a>
            <div class="install-widget" @click="copyInstall" :class="{ copied: copied }">
              <span class="pw">$</span>
              <code>curl -fsSL https://openkoi.ai/install.sh | sh</code>
              <span class="copy-label">{{ copied ? 'Copied' : 'Copy' }}</span>
            </div>
            <a href="https://github.com/openkoi-ai/openkoi" target="_blank" class="btn-github">⭐ Star on GitHub</a>
          </div>
        </div>

        <div class="hero-right">
          <div class="terminal-window">
            <div class="terminal-bar">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
              <span class="terminal-title">openkoi</span>
            </div>
            <div class="terminal-body">
              <div
                v-for="(line, i) in demoLines"
                :key="i"
                class="term-line"
                :class="[line.type, { visible: i < visibleLines }]"
              >
                <template v-if="line.type === 'prompt'">
                  <span class="term-text">{{ line.text }}</span>
                </template>
                <template v-else-if="line.type === 'status'">
                  <span class="term-label" :class="line.label.toLowerCase()">{{ line.label }}</span>
                  <span class="term-text">{{ line.text }}</span>
                </template>
                <template v-else-if="line.type === 'done'">
                  <span class="term-text done-text">{{ line.text }}</span>
                </template>
                <template v-else>
                  <span class="term-text">&nbsp;</span>
                </template>
              </div>
              <div class="cursor-line" :class="{ visible: visibleLines >= demoLines.length }">
                <span class="term-text">$ <span class="block-cursor">&nbsp;</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- The Problem (Villain) -->
      <section class="section-problem">
        <h2>The status quo</h2>
        <p class="section-sub">Current AI coding tools generate output and stop. You become the reviewer, the debugger, the QA team — on top of being the developer.</p>
        <div class="problem-grid">
          <div class="problem-item">
            <span class="problem-icon">🔄</span>
            <h3>Manual iteration</h3>
            <p>You re-prompt corrections 3–5 times per task. The AI generates; you iterate.</p>
          </div>
          <div class="problem-item">
            <span class="problem-icon">💸</span>
            <h3>Wasted tokens</h3>
            <p>You pay for rounds of manual back-and-forth that a system should handle automatically.</p>
          </div>
          <div class="problem-item">
            <span class="problem-icon">🧠</span>
            <h3>Lost learnings</h3>
            <p>Patterns from today's work vanish tomorrow. You re-teach the same corrections every session.</p>
          </div>
        </div>
      </section>

      <!-- How It Works — iteration loop -->
      <section id="how-it-works" class="section-how">
        <h2>OpenKoi thinks before it acts</h2>
        <p class="section-sub">Instead of generating and stopping, OpenKoi runs a full cognitive pipeline. A Sovereign directive guides deliberation through a Parliament of agencies — then executes, evaluates, and learns from every outcome.</p>

        <div class="loop-track">
          <div
            v-for="(stage, idx) in loopStages"
            :key="stage"
            class="loop-stage"
            :class="{ active: currentStage === idx }"
          >
            <div class="stage-num">{{ idx + 1 }}</div>
            <div class="stage-label">{{ stage }}</div>
          </div>
          <div class="loop-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
            <span>loop</span>
          </div>
        </div>

        <div class="features-row">
          <div class="feature-card">
            <div class="feature-header">
              <span class="feature-icon">$_</span>
              <h3>CLI Native</h3>
            </div>
            <p>&lt;10ms startup. ~5MB memory. Single static binary. Pipe stdin, get structured output.</p>
          </div>
          <div class="feature-card">
            <div class="feature-header">
              <span class="feature-icon">{}</span>
              <h3>Model Agnostic</h3>
            </div>
            <p>Claude, GPT, Gemini, Bedrock, Ollama, or local models. Switch with a flag. No vendor lock-in.</p>
          </div>
          <div class="feature-card">
            <div class="feature-header">
              <span class="feature-icon">.rs</span>
              <h3>Rust Core</h3>
            </div>
            <p>No Python. No Node. No runtime dependencies. Just a single binary that finds your API keys automatically.</p>
          </div>
        </div>
      </section>

      <!-- Capabilities Tabs -->
      <section id="capabilities" class="section-caps">
        <h2>Built for</h2>
        <div class="tab-row">
          <button :class="{ active: activeTab === 'developers' }" @click="activeTab = 'developers'">Developers</button>
          <button :class="{ active: activeTab === 'researchers' }" @click="activeTab = 'researchers'">AI Research</button>
          <button :class="{ active: activeTab === 'everyone' }" @click="activeTab = 'everyone'">Everyone</button>
        </div>

        <transition name="fade" mode="out-in">
          <div v-if="activeTab === 'developers'" class="cap-grid" key="dev">
            <div class="cap-item">
              <code class="cap-icon">think</code>
              <h3>Cognitive CLI</h3>
              <p>Six cognitive commands — think, soul, mind, world, reflect, trust — expose the full deliberation pipeline.</p>
            </div>
            <div class="cap-item">
              <code class="cap-icon">MCP</code>
              <h3>Three-Tier Plugins</h3>
              <p>MCP tool servers, sandboxed WASM modules, and Rhai scripts. Full hook system.</p>
            </div>
            <div class="cap-item">
              <code class="cap-icon">*.skill</code>
              <h3>OpenClaw Skills</h3>
              <p>Compatible with the OpenClaw Skill system. Use existing .SKILL.md files.</p>
            </div>
          </div>

          <div v-else-if="activeTab === 'researchers'" class="cap-grid" key="research">
            <div class="cap-item">
              <code class="cap-icon">mind</code>
              <h3>Society of Mind</h3>
              <p>Five agencies deliberate on every decision. Inspect dissent, calibrate accuracy, view parliament records.</p>
            </div>
            <div class="cap-item">
              <code class="cap-icon">Δ</code>
              <h3>Pattern Mining</h3>
              <p>Extract recurring behaviors and anti-patterns from large-scale agent runs automatically.</p>
            </div>
            <div class="cap-item">
              <code class="cap-icon">$0</code>
              <h3>Token-Frugal</h3>
              <p>Context compression, delta-feedback, evaluation caching, and incremental eval minimize cost.</p>
            </div>
          </div>

          <div v-else class="cap-grid" key="everyone">
            <div class="cap-item">
              <code class="cap-icon">trust</code>
              <h3>Earned Autonomy</h3>
              <p>Delegation is granted domain by domain. Trust grows with accuracy. Audit every autonomous action.</p>
            </div>
            <div class="cap-item">
              <code class="cap-icon">0dep</code>
              <h3>Zero Dependencies</h3>
              <p>No Python, no Node, no containers. Single binary that finds your API keys automatically.</p>
            </div>
            <div class="cap-item">
              <code class="cap-icon">reflect</code>
              <h3>Self-Reflection</h3>
              <p>Daily, weekly, and growth reflection loops. The agent admits mistakes and calibrates confidence.</p>
            </div>
          </div>
        </transition>
      </section>

      <!-- What Changes (Success / Transformation) -->
      <section class="section-transform">
        <h2>What changes</h2>
        <p class="section-sub">From babysitting your AI agent to shipping code that's already been deliberated.</p>
        <div class="transform-grid">
          <div class="transform-item">
            <div class="transform-before">You manually review every AI output</div>
            <div class="transform-arrow">→</div>
            <div class="transform-after">OpenKoi evaluates its own work against rubrics</div>
          </div>
          <div class="transform-item">
            <div class="transform-before">No idea how the AI decided</div>
            <div class="transform-arrow">→</div>
            <div class="transform-after">Sovereign directive + Parliament deliberation visible on every task</div>
          </div>
          <div class="transform-item">
            <div class="transform-before">You re-prompt corrections 3–5 times</div>
            <div class="transform-arrow">→</div>
            <div class="transform-after">Automatic iteration — stops when quality threshold is met</div>
          </div>
          <div class="transform-item">
            <div class="transform-before">Learnings vanish between sessions</div>
            <div class="transform-arrow">→</div>
            <div class="transform-after">Patterns persist locally; skills improve over time</div>
          </div>
          <div class="transform-item">
            <div class="transform-before">Locked to one provider</div>
            <div class="transform-arrow">→</div>
            <div class="transform-after">Switch with a flag; different models per role</div>
          </div>
          <div class="transform-item">
            <div class="transform-before">Data on someone else's cloud</div>
            <div class="transform-arrow">→</div>
            <div class="transform-after">Everything stays on your machine</div>
          </div>
        </div>
      </section>

      <!-- Works With — text grid, no fake logos -->
      <section class="section-ecosystem">
        <h2>Works with</h2>
        <div class="eco-grid">
          <div class="eco-group">
            <h4>AI Providers</h4>
            <div class="eco-tags">
              <span class="eco-tag provider">Anthropic</span>
              <span class="eco-tag provider">OpenAI</span>
              <span class="eco-tag provider">Google</span>
              <span class="eco-tag provider">AWS Bedrock</span>
              <span class="eco-tag provider">Ollama</span>
              <span class="eco-tag provider">OpenRouter</span>
              <span class="eco-tag provider">Groq</span>
              <span class="eco-tag provider">Together</span>
              <span class="eco-tag provider">DeepSeek</span>
              <span class="eco-tag provider">xAI</span>
              <span class="eco-tag provider">Qwen</span>
              <span class="eco-tag provider">MiniMax</span>
            </div>
          </div>
          <div class="eco-group">
            <h4>Integrations</h4>
            <div class="eco-tags">
              <span class="eco-tag integration">Slack</span>
              <span class="eco-tag integration">Discord</span>
              <span class="eco-tag integration">Telegram</span>
              <span class="eco-tag integration">Teams</span>
              <span class="eco-tag integration">Notion</span>
              <span class="eco-tag integration">Google Docs</span>
              <span class="eco-tag integration">Email</span>
              <span class="eco-tag integration">iMessage</span>
            </div>
          </div>
          <div class="eco-group">
            <h4>Extensibility</h4>
            <div class="eco-tags">
              <span class="eco-tag ext">MCP Servers</span>
              <span class="eco-tag ext">WASM Plugins</span>
              <span class="eco-tag ext">Rhai Scripts</span>
              <span class="eco-tag ext">OpenClaw Skills</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Quick Start (with 3-step plan) -->
      <section class="section-quickstart">
        <div class="qs-terminal">
          <div class="terminal-bar">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            <span class="terminal-title">quickstart</span>
          </div>
          <div class="terminal-body">
            <div class="term-line visible prompt"><span class="term-text"><span class="comment"># 1. Install</span></span></div>
            <div class="term-line visible prompt"><span class="term-text">$ curl -fsSL https://openkoi.ai/install.sh | sh</span></div>
            <div class="term-line visible output"><span class="term-text">&nbsp;</span></div>
            <div class="term-line visible prompt"><span class="term-text"><span class="comment"># 2. Think — API keys are detected automatically</span></span></div>
            <div class="term-line visible prompt"><span class="term-text">$ openkoi think "refactor auth module to use JWT"</span></div>
            <div class="term-line visible output"><span class="term-text">&nbsp;</span></div>
            <div class="term-line visible prompt"><span class="term-text"><span class="comment"># 3. Ship — it deliberates, executes, and learns</span></span></div>
            <div class="term-line visible prompt"><span class="term-text">$ openkoi status --live</span></div>
          </div>
        </div>
        <div class="qs-text">
          <h2>Three steps to ship</h2>
          <p><strong>Install</strong> with one command. <strong>Think</strong> by describing what you want — OpenKoi discovers your API keys from environment variables, CLI tools, and keychains automatically. <strong>Ship</strong> code that's already been through the cognitive pipeline.</p>
          <a href="/guide/installation" class="btn-primary">Install OpenKoi →</a>
          <a href="/guide/cli-reference" class="btn-secondary">CLI Reference</a>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <a href="/" class="logo-link">
            <img src="/logo.png" alt="OpenKoi" />
            <span class="brand">OpenKoi</span>
          </a>
          <p>Executive Function as a Service. AI agent that thinks before it acts. Built with Rust.</p>
          <div class="footer-social">
            <a href="https://github.com/openkoi-ai/openkoi" target="_blank" aria-label="GitHub">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
          </div>
        </div>
        <div class="footer-nav">
          <div class="nav-col">
            <h4>Getting Started</h4>
            <a href="/guide/introduction">Introduction</a>
            <a href="/guide/installation">Installation</a>
            <a href="/guide/cli-reference">CLI Reference</a>
            <a href="/guide/configuration">Configuration</a>
          </div>
          <div class="nav-col">
            <h4>Core Engine</h4>
            <a href="/guide/architecture">Architecture</a>
            <a href="/guide/iteration-engine">Iteration Engine</a>
            <a href="/guide/evaluator-system">Evaluator System</a>
            <a href="/guide/providers">Providers</a>
          </div>
          <div class="nav-col">
            <h4>Cognitive</h4>
            <a href="/guide/think">Think</a>
            <a href="/guide/mind">Mind</a>
            <a href="/guide/world">World</a>
            <a href="/guide/reflect">Reflect</a>
            <a href="/guide/trust">Trust</a>
          </div>
          <div class="nav-col">
            <h4>Resources</h4>
            <a href="/llm.txt">llm.txt</a>
            <a href="https://github.com/openkoi-ai/openkoi" target="_blank">Source Code</a>
            <a href="https://github.com/openkoi-ai/openkoi/releases" target="_blank">Releases</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; 2026 OpenKoi Project. MIT License.</span>
        <span>Fully OpenClaw Compatible.</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ===== Base ===== */
.homepage-root {
  background: #0a0a0a;
  color: #e4e4e7;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  --koi-orange: #ea580c;
  --koi-cyan: #22d3ee;
  --koi-dim: #52525b;
  --koi-bg: #0a0a0a;
  --koi-card: #141416;
  --koi-border: #27272a;
  --koi-text: #e4e4e7;
  --koi-muted: #71717a;
  --mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
}

/* ===== Header ===== */
.site-header {
  position: fixed;
  top: 0;
  width: 100%;
  height: 56px;
  background: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  z-index: 1000;
  border-bottom: 1px solid var(--koi-border);
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--koi-text);
}

.logo-link img {
  width: 28px;
  height: 28px;
  border-radius: 6px;
}

.brand {
  font-weight: 700;
  font-size: 18px;
  letter-spacing: -0.02em;
}

.header-nav {
  display: flex;
  gap: 32px;
}

.header-nav a {
  color: var(--koi-muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  font-family: var(--mono);
  transition: color 0.2s;
}

.header-nav a:hover {
  color: var(--koi-text);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-version {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--koi-orange);
  background: rgba(234, 88, 12, 0.1);
  padding: 3px 10px;
  border-radius: 4px;
  letter-spacing: 0.02em;
}

.gh-link {
  color: var(--koi-muted);
  transition: color 0.2s;
}

.gh-link:hover {
  color: var(--koi-text);
}

/* ===== Hero ===== */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 120px 40px 80px;
  min-height: 90vh;
}

.hero-label {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--koi-orange);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 16px;
}

.hero h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0 0 24px;
}

.accent {
  color: var(--koi-orange);
}

.hero-sub {
  font-size: 16px;
  color: var(--koi-muted);
  line-height: 1.6;
  max-width: 480px;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 36px;
  align-items: flex-start;
}

.btn-primary {
  display: inline-block;
  padding: 12px 28px;
  background: var(--koi-orange);
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.2s, transform 0.15s;
}

.btn-primary:hover {
  background: #c2410c;
  transform: translateY(-1px);
}

.btn-secondary {
  display: inline-block;
  padding: 10px 24px;
  border: 1px solid var(--koi-border);
  color: var(--koi-muted);
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  border-radius: 8px;
  font-family: var(--mono);
  transition: border-color 0.2s, color 0.2s;
  margin-right: 12px;
}

.btn-secondary:hover {
  border-color: var(--koi-muted);
  color: var(--koi-text);
}

.btn-github {
  display: inline-block;
  padding: 10px 24px;
  border: 1px solid var(--koi-border);
  color: var(--koi-muted);
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  border-radius: 8px;
  font-family: var(--mono);
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.btn-github:hover {
  border-color: #eab308;
  color: #eab308;
  background: rgba(234, 179, 8, 0.06);
}

/* Install widget */
.install-widget {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--koi-card);
  border: 1px solid var(--koi-border);
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  transition: border-color 0.2s;
  font-family: var(--mono);
  font-size: 13px;
}

.install-widget:hover {
  border-color: var(--koi-muted);
}

.install-widget.copied {
  border-color: var(--koi-cyan);
}

.install-widget .pw {
  color: var(--koi-muted);
}

.install-widget code {
  color: var(--koi-cyan);
}

.copy-label {
  color: var(--koi-dim);
  font-size: 12px;
  margin-left: auto;
  min-width: 40px;
}

.install-widget.copied .copy-label {
  color: var(--koi-cyan);
}

/* ===== Terminal Window ===== */
.terminal-window {
  background: #0d0d0f;
  border: 1px solid var(--koi-border);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.terminal-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #161618;
  border-bottom: 1px solid var(--koi-border);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #27272a;
}

.dot:first-child { background: #ef4444; }
.dot:nth-child(2) { background: #eab308; }
.dot:nth-child(3) { background: #22c55e; }

.terminal-title {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--koi-dim);
  margin-left: 8px;
}

.terminal-body {
  padding: 20px;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.7;
  min-height: 260px;
}

.term-line {
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.25s ease, transform 0.25s ease;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.term-line.visible {
  opacity: 1;
  transform: translateY(0);
}

.term-line.prompt .term-text {
  color: #a1a1aa;
}

.term-label {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.term-label.sovereign { background: rgba(234, 88, 12, 0.2); color: var(--koi-orange); }
.term-label.parliament { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
.term-label.exec { background: rgba(34, 211, 238, 0.15); color: var(--koi-cyan); }
.term-label.eval { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
.term-label.refn { background: rgba(234, 179, 8, 0.15); color: #eab308; }
.term-label.learned { background: rgba(34, 197, 94, 0.15); color: #22c55e; }

.term-text {
  color: #a1a1aa;
}

.done-text {
  color: #22c55e;
}

.comment {
  color: #52525b;
}

.cursor-line {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cursor-line.visible {
  opacity: 1;
}

.block-cursor {
  display: inline-block;
  width: 8px;
  height: 15px;
  background: var(--koi-orange);
  animation: blink 1s step-end infinite;
  vertical-align: middle;
}

@keyframes blink {
  50% { opacity: 0; }
}

/* ===== Problem Section (Villain) ===== */
.section-problem {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 40px 60px;
}

.section-problem h2 {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 16px;
}

.problem-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 36px;
}

.problem-item {
  background: var(--koi-card);
  border: 1px solid var(--koi-border);
  border-radius: 10px;
  padding: 28px;
  transition: border-color 0.2s;
}

.problem-item:hover {
  border-color: #ef4444;
}

.problem-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 16px;
}

.problem-item h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 8px;
  color: #fca5a5;
}

.problem-item p {
  font-size: 14px;
  color: var(--koi-muted);
  line-height: 1.5;
  margin: 0;
}

/* ===== Transformation Section (Success) ===== */
.section-transform {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 40px;
}

.section-transform h2 {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 16px;
}

.transform-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 36px;
}

.transform-item {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  align-items: center;
  background: var(--koi-card);
  border: 1px solid var(--koi-border);
  border-radius: 10px;
  padding: 20px 28px;
  transition: border-color 0.2s;
}

.transform-item:hover {
  border-color: var(--koi-muted);
}

.transform-before {
  font-size: 14px;
  color: #fca5a5;
  font-family: var(--mono);
  text-decoration: line-through;
  text-decoration-color: rgba(252, 165, 165, 0.3);
}

.transform-arrow {
  font-size: 18px;
  color: var(--koi-orange);
  font-weight: 700;
}

.transform-after {
  font-size: 14px;
  color: #86efac;
  font-family: var(--mono);
}

/* ===== How It Works ===== */
.section-how {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 40px;
}

.section-how h2,
.section-caps h2,
.section-ecosystem h2,
.section-quickstart h2 {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 16px;
}

.section-sub {
  font-size: 16px;
  color: var(--koi-muted);
  max-width: 600px;
  line-height: 1.6;
  margin-bottom: 48px;
}

/* Loop Track */
.loop-track {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 64px;
  position: relative;
}

.loop-stage {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  background: var(--koi-card);
  border: 1px solid var(--koi-border);
  transition: all 0.4s ease;
  position: relative;
}

.loop-stage:first-child {
  border-radius: 8px 0 0 8px;
}

.loop-stage:nth-child(5) {
  border-radius: 0 8px 8px 0;
}

.loop-stage + .loop-stage {
  border-left: none;
}

.loop-stage.active {
  background: rgba(234, 88, 12, 0.08);
  border-color: var(--koi-orange);
  z-index: 1;
}

.loop-stage.active + .loop-stage {
  border-left-color: var(--koi-orange);
}

.stage-num {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 700;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--koi-border);
  color: var(--koi-muted);
  transition: all 0.4s ease;
}

.loop-stage.active .stage-num {
  background: var(--koi-orange);
  color: #fff;
}

.stage-label {
  font-family: var(--mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--koi-muted);
  transition: color 0.4s;
}

.loop-stage.active .stage-label {
  color: var(--koi-text);
}

.loop-arrow {
  position: absolute;
  right: -80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--koi-dim);
}

.loop-arrow span {
  font-family: var(--mono);
  font-size: 11px;
}

/* Feature Cards */
.features-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.feature-card {
  background: var(--koi-card);
  border: 1px solid var(--koi-border);
  border-radius: 10px;
  padding: 28px;
  transition: border-color 0.2s;
}

.feature-card:hover {
  border-color: var(--koi-muted);
}

.feature-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.feature-icon {
  font-family: var(--mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--koi-orange);
  background: rgba(234, 88, 12, 0.1);
  padding: 6px 10px;
  border-radius: 6px;
  letter-spacing: -0.02em;
}

.feature-card h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.feature-card p {
  font-size: 14px;
  color: var(--koi-muted);
  line-height: 1.5;
  margin: 0;
}

/* ===== Capabilities Tabs ===== */
.section-caps {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 40px;
}

.tab-row {
  display: flex;
  gap: 4px;
  background: var(--koi-card);
  border: 1px solid var(--koi-border);
  border-radius: 8px;
  padding: 4px;
  display: inline-flex;
  margin-bottom: 48px;
}

.tab-row button {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--koi-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-row button.active {
  background: var(--koi-orange);
  color: #fff;
}

.tab-row button:hover:not(.active) {
  color: var(--koi-text);
}

.cap-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.cap-item {
  background: var(--koi-card);
  border: 1px solid var(--koi-border);
  border-radius: 10px;
  padding: 28px;
  transition: border-color 0.2s;
}

.cap-item:hover {
  border-color: var(--koi-muted);
}

.cap-icon {
  font-family: var(--mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--koi-cyan);
  background: rgba(34, 211, 238, 0.1);
  padding: 6px 12px;
  border-radius: 6px;
  display: inline-block;
  margin-bottom: 16px;
}

.cap-item h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 8px;
}

.cap-item p {
  font-size: 14px;
  color: var(--koi-muted);
  line-height: 1.5;
  margin: 0;
}

/* Fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ===== Ecosystem ===== */
.section-ecosystem {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 40px;
}

.eco-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-top: 36px;
}

.eco-group h4 {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--koi-dim);
  margin-bottom: 16px;
}

.eco-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.eco-tag {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--koi-border);
  background: var(--koi-card);
  color: var(--koi-muted);
  transition: all 0.2s;
}

.eco-tag:hover {
  color: var(--koi-text);
  border-color: var(--koi-muted);
}

.eco-tag.provider:hover { border-color: var(--koi-orange); color: var(--koi-orange); }
.eco-tag.integration:hover { border-color: var(--koi-cyan); color: var(--koi-cyan); }
.eco-tag.ext:hover { border-color: #a855f7; color: #a855f7; }

/* ===== Quick Start ===== */
.section-quickstart {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.qs-terminal {
  background: #0d0d0f;
  border: 1px solid var(--koi-border);
  border-radius: 10px;
  overflow: hidden;
}

.qs-terminal .terminal-body {
  min-height: auto;
  padding: 16px 20px;
}

.qs-text p {
  font-size: 15px;
  color: var(--koi-muted);
  line-height: 1.6;
  margin: 16px 0 28px;
}

/* ===== Footer ===== */
.site-footer {
  border-top: 1px solid var(--koi-border);
  padding: 80px 0 40px;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  gap: 60px;
  margin-bottom: 48px;
}

.footer-brand {
  max-width: 280px;
}

.footer-brand > .logo-link {
  margin-bottom: 16px;
}

.footer-brand > p {
  font-size: 14px;
  color: var(--koi-muted);
  line-height: 1.5;
  margin: 16px 0;
}

.footer-social {
  display: flex;
  gap: 16px;
}

.footer-social a {
  color: var(--koi-dim);
  transition: color 0.2s;
}

.footer-social a:hover {
  color: var(--koi-text);
}

.footer-nav {
  display: flex;
  gap: 64px;
}

.nav-col h4 {
  font-size: 13px;
  font-weight: 700;
  color: var(--koi-text);
  margin-bottom: 16px;
  font-family: var(--mono);
}

.nav-col a {
  display: block;
  font-size: 13px;
  color: var(--koi-muted);
  text-decoration: none;
  margin-bottom: 10px;
  transition: color 0.2s;
}

.nav-col a:hover {
  color: var(--koi-text);
}

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 40px 0;
  border-top: 1px solid var(--koi-border);
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--koi-dim);
  font-family: var(--mono);
}

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 40px;
    min-height: auto;
    padding: 100px 24px 60px;
  }

  .hero h1 {
    font-size: 2.2rem;
  }

  .features-row,
  .cap-grid,
  .eco-grid,
  .problem-grid {
    grid-template-columns: 1fr;
  }

  .transform-item {
    grid-template-columns: 1fr;
    gap: 8px;
    text-align: center;
  }

  .transform-arrow {
    transform: rotate(90deg);
  }

  .section-quickstart {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .footer-inner {
    flex-direction: column;
    gap: 40px;
  }

  .footer-nav {
    flex-direction: column;
    gap: 32px;
  }

  .loop-track {
    flex-direction: column;
    gap: 0;
  }

  .loop-stage {
    border-radius: 0;
    border-left: 1px solid var(--koi-border);
  }

  .loop-stage:first-child {
    border-radius: 8px 8px 0 0;
  }

  .loop-stage:nth-child(4) {
    border-radius: 0 0 8px 8px;
  }

  .loop-stage + .loop-stage {
    border-left: 1px solid var(--koi-border);
    border-top: none;
  }

  .loop-stage.active + .loop-stage {
    border-left-color: var(--koi-border);
  }

  .loop-arrow {
    display: none;
  }
}

@media (max-width: 600px) {
  .site-header {
    padding: 0 16px;
  }

  .header-nav {
    display: none;
  }

  .section-how,
  .section-caps,
  .section-ecosystem,
  .section-quickstart,
  .section-problem,
  .section-transform {
    padding: 60px 16px;
  }

  .hero {
    padding: 90px 16px 40px;
  }

  .features-row,
  .cap-grid,
  .problem-grid {
    grid-template-columns: 1fr;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>
