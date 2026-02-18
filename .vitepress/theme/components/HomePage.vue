<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const copied = ref(false)
const copyInstall = async () => {
  try {
    await navigator.clipboard.writeText('cargo install openkoi')
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy: ', err)
  }
}

const activeTab = ref('developers')
const scrollY = ref(0)
const handleScroll = () => {
  scrollY.value = window.scrollY
}

const loopStep = ref(0)
let loopInterval

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  loopInterval = setInterval(() => {
    loopStep.value++
  }, 3000)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  clearInterval(loopInterval)
})
</script>

<template>
  <div class="homepage-root">
    <!-- Ambient Glow Effects -->
    <div class="ambient-glow hero-glow"></div>
    <div class="ambient-glow capabilities-glow"></div>

    <header class="custom-header">
      <a href="/" class="logo-container">
        <img src="/logo.png" alt="OpenKoi Logo" />
        <span class="brand-name">OpenKoi</span>
      </a>
      <nav class="desktop-nav">
        <a href="#vision">Vision</a>
        <a href="#capabilities">Capabilities</a>
        <a href="/guide/introduction">Documentation</a>
      </nav>
      <div class="header-actions">
        <a href="https://github.com/openkoi-ai/openkoi" target="_blank" class="github-icon" aria-label="GitHub">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
      </div>
    </header>

    <main class="custom-main">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="badge fade-in">Introducing OpenKoi</div>
          <h1 class="fade-in">The Engine of <span class="gradient-text">Certainty.</span></h1>
          <p class="hero-subtitle fade-in">Standalone. Self-iterating. Rust-native.<br/>The agent that doesn't stop until the job is done perfectly.</p>
          
          <div class="hero-ctas fade-in">
            <a href="/guide/introduction" class="apple-btn primary">Get Started</a>
            <div class="terminal-cta" @click="copyInstall" :class="{ 'is-copied': copied }">
              <span class="prompt">$</span>
              <code>cargo install openkoi</code>
              <div class="copy-action">
                <svg v-if="!copied" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--koi-cyan)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span class="copy-hint">{{ copied ? 'Copied' : 'Copy' }}</span>
              </div>
            </div>
          </div>
          
          <div class="scroll-hint fade-in" :style="{ opacity: Math.max(0, 1 - scrollY / 300) }">
            <p>Scroll to explore</p>
            <div class="chevron"></div>
          </div>
        </div>
      </section>

      <!-- Vision Section - Bento Grid -->
      <section id="vision" class="bento-grid">
        <div class="bento-card large iteration-focus">
          <div class="card-content">
            <span class="cap">The Process</span>
            <h2>Perfection through iteration.</h2>
            <p>Unlike "fire and forget" agents, OpenKoi follows a rigorous Plan-Execute-Evaluate-Refine cycle. It critiques its own work using domain-specific rubrics until quality thresholds are met.</p>
          </div>
          <div class="card-visual">
             <div class="loop-container">
               <svg class="loop-bg" viewBox="0 0 300 300">
                 <circle cx="150" cy="150" r="120" stroke="rgba(255,255,255,0.05)" stroke-width="2" fill="none" stroke-dasharray="8 8" />
                 <circle cx="150" cy="150" r="120" stroke="var(--koi-orange)" stroke-width="2" fill="none" class="loop-path" style="opacity: 0.2" />
               </svg>
                <div class="orbit-wrap">
                 <div class="orbit-item plan" :class="{ active: loopStep % 4 === 0 }" style="top: 30px; left: 50%;">
                   <div class="item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24"></path><path d="M21 3v9h-9"></path></svg></div>
                   <span>Plan</span>
                 </div>
                 <div class="orbit-item execute" :class="{ active: loopStep % 4 === 1 }" style="top: 50%; left: 270px;">
                   <div class="item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div>
                   <span>Execute</span>
                 </div>
                 <div class="orbit-item evaluate" :class="{ active: loopStep % 4 === 2 }" style="top: 270px; left: 50%;">
                   <div class="item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></div>
                   <span>Evaluate</span>
                 </div>
                 <div class="orbit-item refine" :class="{ active: loopStep % 4 === 3 }" style="top: 50%; left: 30px;">
                   <div class="item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div>
                   <span>Refine</span>
                 </div>
               </div>
               <div class="center-koi">
                 <img src="/logo.png" alt="Koi logo" />
                 <div class="pulse-ring"></div>
               </div>
             </div>
          </div>
        </div>

        <div class="bento-card performance">
          <div class="card-icon-large">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--koi-orange)" stroke-width="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
          </div>
          <div class="card-content">
            <span class="cap">Performance</span>
            <h3>Built for Speed.</h3>
            <p>Rust-native core means &lt;10ms startup and ~5MB memory footprint. Powerful enough for researchers, light enough for your daily CLI.</p>
          </div>
        </div>

        <div class="bento-card ecosystems">
          <div class="card-icon-large">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--koi-cyan)" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
          </div>
          <div class="card-content">
            <span class="cap">Ecosystem</span>
            <h3>Standardized Skills.</h3>
            <p>Fully compatible with the OpenClaw Skill system. Use your existing .SKILL.md files and connect to the world via MCP.</p>
          </div>
        </div>
      </section>

      <!-- Audience Tabbed Section -->
      <section id="capabilities" class="audience-section">
        <div class="section-header">
          <h2>One engine. Multiple worlds.</h2>
          <div class="tab-switcher">
            <button :class="{ active: activeTab === 'developers' }" @click="activeTab = 'developers'">Developers</button>
            <button :class="{ active: activeTab === 'researchers' }" @click="activeTab = 'researchers'">AI Research</button>
            <button :class="{ active: activeTab === 'everyone' }" @click="activeTab = 'everyone'">Everyone</button>
          </div>
        </div>

        <div class="tab-content">
          <transition name="fade" mode="out-in">
            <div v-if="activeTab === 'developers'" class="tab-pane" key="developers">
              <div class="capability-columns">
                <div class="col">
                  <div class="col-icon-large">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                  </div>
                  <h3>CLI First</h3>
                  <p>Designed for the terminal. Piped input support, interactive REPL, and zero-config setup.</p>
                </div>
                <div class="col">
                  <div class="col-icon-large">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  </div>
                  <h3>Model Agnostic</h3>
                  <p>Switch between Claude, GPT, Gemini, Bedrock, or local Llama models with a single flag. No vendor lock-in.</p>
                </div>
                <div class="col">
                  <div class="col-icon-large">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  </div>
                  <h3>Three-Tier Plugins</h3>
                  <p>Extend with MCP tool servers, sandboxed WASM modules, or Rhai scripts. Full hook system included.</p>
                </div>
              </div>
            </div>

            <div v-else-if="activeTab === 'researchers'" class="tab-pane" key="researchers">
              <div class="capability-columns">
                <div class="col">
                  <div class="col-icon-large">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <h3>Formal Evaluation</h3>
                  <p>Define rigorous rubrics in Markdown. Track scores across dimensions like safety, correctness, and style.</p>
                </div>
                <div class="col">
                  <div class="col-icon-large">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  </div>
                  <h3>Pattern Mining</h3>
                  <p>Automatically extract recurring behaviors and anti-patterns from large-scale agent runs.</p>
                </div>
                <div class="col">
                  <div class="col-icon-large">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                  </div>
                  <h3>Token-Frugal</h3>
                  <p>Context compression, delta-feedback loops, evaluation caching, and incremental eval minimize cost.</p>
                </div>
              </div>
            </div>

            <div v-else class="tab-pane" key="everyone">
              <div class="capability-columns">
                <div class="col">
                  <div class="col-icon-large">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  </div>
                  <h3>10 Integrations</h3>
                  <p>Slack, Discord, Telegram, Teams, iMessage, Email, Notion, Google Docs, Google Sheets, and MS Office.</p>
                </div>
                <div class="col">
                  <div class="col-icon-large">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  </div>
                  <h3>It Just Works</h3>
                  <p>No Python, no Node, no dependencies. Just a single binary that finds your API keys automatically.</p>
                </div>
                <div class="col">
                  <div class="col-icon-large">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                  </div>
                  <h3>Self-Learning</h3>
                  <p>The more you use it, the better it understands your workflow. Patterns become skills automatically.</p>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </section>

      <!-- Works With - Enhanced Presence -->
      <section class="works-with-section">
        <p class="over-title">The Open Ecosystem</p>
        <div class="logo-grid-modern">
          <div class="logo-card" v-for="logo in logos" :key="logo.name">
            <div class="logo-icon-wrap" v-html="logo.svg"></div>
            <span class="logo-name">{{ logo.name }}</span>
          </div>
        </div>
      </section>
    </main>

    <footer class="modern-footer">
      <div class="footer-container">
        <div class="footer-top">
          <div class="footer-brand">
            <a href="/" class="f-logo">
              <img src="/logo.png" alt="OpenKoi" />
              <span>OpenKoi</span>
            </a>
            <p class="f-tagline">The high-performance orchestrator<br/>for the AI era. Built with Rust.</p>
            <div class="social-links">
              <a href="https://github.com/openkoi-ai/openkoi" target="_blank" aria-label="GitHub">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>
          <div class="footer-nav-grid">
            <div class="nav-column">
              <h4>Getting Started</h4>
              <a href="/guide/introduction">Introduction</a>
              <a href="/guide/installation">Installation</a>
              <a href="/guide/cli-reference">CLI Reference</a>
              <a href="/guide/configuration">Configuration</a>
            </div>
            <div class="nav-column">
              <h4>Core Engine</h4>
              <a href="/guide/architecture">Architecture</a>
              <a href="/guide/iteration-engine">Iteration Engine</a>
              <a href="/guide/evaluator-system">Evaluator System</a>
              <a href="/guide/providers">Providers</a>
            </div>
            <div class="nav-column">
              <h4>Resources</h4>
              <a href="/llm.txt">llm.txt</a>
              <a href="https://github.com/openkoi-ai/openkoi" target="_blank">Open Source</a>
              <a href="https://github.com/openkoi-ai/openkoi/releases" target="_blank">Release Notes</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="f-bottom-left">
            <span>&copy; 2026 OpenKoi Project. MIT License.</span>
            <span class="f-separator">|</span>
            <span>Fully OpenClaw Compatible.</span>
          </div>
          <div class="f-bottom-right">
            <a href="#vision">Back to top</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  data() {
    return {
      logos: [
        { name: 'Anthropic', svg: '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"></path></svg>' },
        { name: 'OpenAI', svg: '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M22.28 7.53a5.023 5.023 0 0 0-4.47-4.48c-2.27-.27-4.47.64-5.81 2.39-1.34-1.75-3.54-2.66-5.81-2.39a5.023 5.023 0 0 0-4.47 4.48c-.27 2.27.64 4.47 2.39 5.81-1.75 1.34-2.66 3.54-2.39 5.81a5.023 5.023 0 0 0 4.48 4.47c2.27.27 4.47-.64 5.81-2.39 1.34 1.75 3.54 2.66 5.81 2.39a5.023 5.023 0 0 0 4.47-4.48c.27-2.27-.64-4.47-2.39-5.81 1.75-1.34 2.66-3.54 2.39-5.81zM12 13.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path></svg>' },
        { name: 'Google', svg: '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.56-1.56 2.73-3.21 2.73-2.13 0-3.86-1.73-3.86-3.86s1.73-3.86 3.86-3.86c.94 0 1.8.34 2.46.91l2.06-2.06C18.74 3.6 15.65 2.5 12.18 2.5 6.7 2.5 2.25 6.95 2.25 12.43s4.45 9.93 9.93 9.93c5.48 0 9.27-3.69 9.27-9.43 0-.6-.06-1.22-.1-1.83z"></path></svg>' },
        { name: 'AWS Bedrock', svg: '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"></path></svg>' },
        { name: 'Ollama', svg: '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path></svg>' },
        { name: 'Slack', svg: '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M6 12.5C6 11.12 7.12 10 8.5 10H10V8.5C10 7.12 8.88 6 7.5 6C6.12 6 5 7.12 5 8.5C5 9.88 6.12 11 7.5 11H8V12.5C8 13.88 6.88 15 5.5 15C4.12 15 3 13.88 3 12.5C3 11.12 4.12 10 5.5 10H6V12.5zM15.5 14H14V15.5C14 16.88 15.12 18 16.5 18C17.88 18 19 16.88 19 15.5C19 14.12 17.88 13 16.5 13C15.12 13 14 14.12 14 15.5V16H15.5C16.88 16 18 14.88 18 13.5C18 12.12 16.88 11 15.5 11C14.12 11 13 12.12 13 13.5V14H15.5z"></path></svg>' },
        { name: 'Notion', svg: '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 2v14h14V5H5zm2 2h2v2H7V7zm4 0h6v2h-6V7zm-4 4h2v2H7v-2zm4 0h10v2H11v-2zm-4 4h2v2H7v-2zm4 0h10v2H11v-2z"></path></svg>' },
        { name: 'Discord', svg: '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M19.27 4.73C17.78 4.05 16.18 3.55 14.5 3.27C14.29 3.65 14.05 4.15 13.88 4.56C12.11 4.3 10.39 4.3 8.62 4.56C8.45 4.15 8.21 3.65 8 3.27C6.32 3.55 4.72 4.05 3.23 4.73C0.21 9.24 -0.61 13.63 0.4 17.93C2.41 19.41 4.36 20.3 6.27 20.89C6.74 20.25 7.15 19.56 7.5 18.82C6.8 18.57 6.13 18.25 5.5 17.87C5.67 17.74 5.83 17.61 6 17.47C9.88 19.27 14.15 19.27 18 17.47C18.17 17.61 18.33 17.74 18.5 17.87C17.87 18.25 17.2 18.57 16.5 18.82C16.85 19.56 17.26 20.25 17.73 20.89C19.64 20.3 21.59 19.41 23.6 17.93C24.76 12.91 23.67 8.57 19.27 4.73ZM8.5 14.65C7.34 14.65 6.39 13.58 6.39 12.27C6.39 10.96 7.32 9.89 8.5 9.89C9.69 9.89 10.63 10.96 10.61 12.27C10.61 13.58 9.69 14.65 8.5 14.65ZM15.5 14.65C14.34 14.65 13.39 13.58 13.39 12.27C13.39 10.96 14.32 9.89 15.5 9.89C16.69 9.89 17.63 10.96 17.61 12.27C17.61 13.58 16.69 14.65 15.5 14.65Z"></path></svg>' },
        { name: 'Telegram', svg: '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.91-1.27 4.85-2.11 5.82-2.52 2.77-1.17 3.34-1.37 3.72-1.38.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"></path></svg>' }
      ]
    }
  }
}
</script>

<style scoped>
.homepage-root {
  background-color: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  --apple-black: #000000;
  --apple-gray: #1d1d1f;
  --apple-soft-gray: #86868b;
  --apple-blue: #0071e3;
  --apple-white: #f5f5f7;
  --koi-orange: #ea580c;
  --koi-cyan: #22d3ee;
  position: relative;
  overflow-x: hidden;
}

/* Ambient Glow */
.ambient-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.15;
}

.hero-glow {
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, var(--koi-orange) 0%, transparent 70%);
}

.capabilities-glow {
  bottom: 20%;
  right: -100px;
  background: radial-gradient(circle, var(--koi-cyan) 0%, transparent 70%);
}

/* Header - Glassmorphism */
.custom-header {
  position: fixed;
  top: 0;
  width: 100%;
  height: 64px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: saturate(200%) blur(30px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 60px;
  z-index: 1000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #fff;
}

.logo-container img {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.brand-name {
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -0.02em;
}

.desktop-nav {
  display: flex;
  gap: 40px;
}

.desktop-nav a {
  color: #fff;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  opacity: 0.7;
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.desktop-nav a:hover {
  opacity: 1;
  color: var(--koi-cyan);
}

/* Hero Section */
.hero-section {
  padding-top: 180px;
  padding-bottom: 120px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.badge {
  color: var(--koi-orange);
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 20px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.hero-section h1 {
  font-size: clamp(4rem, 12vw, 8rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  margin: 0 auto;
  line-height: 0.95;
  max-width: 1000px;
}

.gradient-text {
  background-image: linear-gradient(135deg, #ea580c 0%, #f97316 40%, #22d3ee 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}


.hero-ctas {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-top: 60px;
}

.apple-btn {
  padding: 16px 36px;
  border-radius: 980px;
  font-size: 19px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.apple-btn.primary {
  background-color: #fff;
  color: #000;
}

.apple-btn.primary:hover {
  transform: scale(1.05);
  box-shadow: 0 20px 40px rgba(255,255,255,0.1);
}

.terminal-cta {
  background: rgba(29, 29, 31, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  border: 1px solid rgba(255,255,255,0.1);
  position: relative;
}

.terminal-cta:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.3);
}

.terminal-cta.is-copied {
  border-color: var(--koi-cyan);
}

.copy-action {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 20px;
  color: #86868b;
  transition: color 0.2s;
}

.terminal-cta:hover .copy-action {
  color: #fff;
}

.terminal-cta.is-copied .copy-action {
  color: var(--koi-cyan);
}

.copy-hint {
  font-size: 13px;
  font-weight: 500;
}

.hero-subtitle {
  font-size: clamp(20px, 4vw, 24px);
  color: #86868b;
  margin-top: 30px;
  line-height: 1.4;
  font-weight: 400;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  transition: opacity 0.5s;
}

.scroll-hint {
  margin-top: 80px;
  color: #86868b;
  font-size: 15px;
  font-weight: 500;
  transition: opacity 0.3s ease;
}

.chevron {
  width: 14px;
  height: 14px;
  border-right: 2px solid #86868b;
  border-bottom: 2px solid #86868b;
  transform: rotate(45deg);
  margin: 12px auto;
  animation: bounce 2s infinite;
}
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0) rotate(45deg); }
  40% { transform: translateY(-10px) rotate(45deg); }
  60% { transform: translateY(-5px) rotate(45deg); }
}

/* Bento Grid */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
  position: relative;
  z-index: 1;
}

.bento-card {
  background: rgba(22, 22, 23, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 32px;
  padding: 48px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  display: flex;
  flex-direction: column;
}

.bento-card:hover {
  transform: translateY(-8px) scale(1.01);
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(30, 30, 32, 0.8);
}

.bento-card.large {
  grid-column: 1 / -1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  min-height: 520px;
}

.bento-card h2 { font-size: 48px; font-weight: 700; margin-bottom: 20px; }
.bento-card h3 { font-size: 32px; font-weight: 700; margin-bottom: 16px; }
.bento-card p { font-size: 19px; color: #86868b; line-height: 1.5; }

.card-icon-large {
  margin-bottom: 30px;
  transition: transform 0.3s;
}

.bento-card:hover .card-icon-large {
  transform: scale(1.1);
}

/* Iteration Animation */
.loop-container {
  position: relative;
  width: 300px;
  height: 300px;
}

.loop-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.loop-path {
  transform-origin: center;
}

.orbit-wrap {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 10;
  pointer-events: none;
}

.orbit-item {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0.3;
  transition: all 0.5s ease;
  z-index: 5;
}

.orbit-item.active {
  opacity: 1;
}

.item-icon {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  transform: translate(-50%, -50%);
  position: absolute;
}

.orbit-item.active .item-icon {
  background: var(--apple-blue);
  border-color: var(--apple-blue);
  box-shadow: 0 0 20px rgba(0, 113, 227, 0.4);
}

.orbit-item span {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  position: absolute;
  white-space: nowrap;
  transition: all 0.3s;
  text-shadow: 0 0 10px rgba(0,0,0,0.8);
}

.orbit-item.plan span { top: 40px; left: 0; transform: translateX(-50%); }
.orbit-item.execute span { top: 0; left: -25px; transform: translate(-100%, -50%); }
.orbit-item.evaluate span { top: -40px; left: 0; transform: translateX(-50%); }
.orbit-item.refine span { top: 0; left: 25px; transform: translate(0, -50%); }

.orbit-item.active span { color: #fff; }

.center-koi {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.center-koi img {
  width: 100px;
  height: 100px;
  filter: drop-shadow(0 0 30px var(--koi-orange));
  animation: pulse 4s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 30px var(--koi-orange)); }
  50% { transform: scale(1.05); filter: drop-shadow(0 0 50px var(--koi-cyan)); }
}

.pulse-ring {
  position: absolute;
  width: 100px;
  height: 100px;
  border: 1px solid var(--koi-orange);
  border-radius: 50%;
  animation: ripple 3s infinite;
  opacity: 0;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@keyframes ripple {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}

/* Audience Section */
.audience-section {
  padding: 120px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header h2 {
  font-size: 64px;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 48px;
}

.tab-switcher {
  background: rgba(255, 255, 255, 0.05);
  padding: 6px;
  border-radius: 20px;
  display: inline-flex;
}

.tab-switcher button {
  padding: 12px 32px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
}

.tab-switcher button.active {
  background: #fff;
  color: #000;
  box-shadow: 0 10px 30px rgba(255,255,255,0.1);
}

.capability-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 60px;
  margin-top: 80px;
}

.col h3 { font-size: 24px; margin-bottom: 16px; font-weight: 700; }
.col p { font-size: 18px; color: #86868b; line-height: 1.6; }

.col-icon-large {
  margin-bottom: 24px;
  color: var(--koi-cyan);
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Works With */
.works-with-section {
  padding: 120px 20px;
  text-align: center;
}

.logo-grid-modern {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
  max-width: 1100px;
  margin: 60px auto 0;
}

.logo-card {
  background: rgba(255, 255, 255, 0.03);
  padding: 40px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  transition: all 0.3s;
}

.logo-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-5px);
  border-color: var(--koi-orange);
}

.logo-name {
  font-size: 16px;
  font-weight: 600;
  color: #86868b;
}

.logo-card:hover .logo-name { color: #fff; }

/* Modern Footer */
.modern-footer {
  background: #000;
  padding: 100px 0 60px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  z-index: 10;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 80px;
  gap: 60px;
}

.footer-brand {
  max-width: 320px;
}

.f-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #fff;
  margin-bottom: 24px;
}

.f-logo img {
  width: 48px;
  height: 48px;
}

.f-logo span {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.f-tagline {
  font-size: 16px;
  color: #86868b;
  line-height: 1.6;
  margin-bottom: 30px;
}

.social-links {
  display: flex;
  gap: 20px;
}

.social-links a {
  color: #86868b;
  transition: color 0.3s;
}

.social-links a:hover {
  color: #fff;
}

.footer-nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 80px;
}

.nav-column h4 {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 24px;
}

.nav-column a {
  display: block;
  font-size: 14px;
  color: #86868b;
  text-decoration: none;
  margin-bottom: 12px;
  transition: color 0.3s;
}

.nav-column a:hover {
  color: #fff;
}

.footer-bottom {
  padding-top: 40px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #424245;
}

.f-bottom-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.f-separator {
  opacity: 0.3;
}

.f-bottom-right a {
  color: #424245;
  text-decoration: none;
  transition: color 0.3s;
}

.f-bottom-right a:hover {
  color: #86868b;
}

@media (max-width: 900px) {
  .footer-top {
    flex-direction: column;
    gap: 60px;
  }
  .footer-nav-grid {
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }
  .bento-card.large {
    flex-direction: column;
    min-height: auto;
  }
}

@media (max-width: 600px) {
  .custom-header {
    padding: 0 20px;
  }
  .desktop-nav {
    display: none;
  }
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .capability-columns {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .section-header h2 {
    font-size: 36px;
  }
  .footer-nav-grid {
    grid-template-columns: 1fr;
  }
  .footer-bottom {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
}
</style>
