<script setup>
import { ref } from 'vue'

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
</script>

<template>
  <div class="homepage-root">
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
        <a href="https://github.com/openkoi/openkoi" target="_blank" class="github-icon">
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
            <div class="terminal-cta" @click="copyInstall">
              <span class="prompt">$</span>
              <code>cargo install openkoi</code>
              <span class="copy-hint" v-if="!copied">Copy</span>
              <span class="copy-hint active" v-else>Copied</span>
            </div>
          </div>
          
          <div class="scroll-hint fade-in">
            <p>Scroll to explore</p>
            <div class="chevron"></div>
          </div>
        </div>
      </section>

      <!-- Vision Section -->
      <section id="vision" class="vision-grid">
        <div class="vision-card large iteration-focus">
          <div class="card-content">
            <span class="cap">The Process</span>
            <h2>Perfection through iteration.</h2>
            <p>Unlike "fire and forget" agents, OpenKoi follows a rigorous Plan-Execute-Evaluate-Refine cycle. It critiques its own work using domain-specific rubrics until quality thresholds are met.</p>
          </div>
          <div class="card-visual iteration-anim">
             <div class="loop-container">
               <div class="orbit">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24"></path><path d="M21 3v9h-9"></path></svg>
                 Plan
               </div>
               <div class="orbit">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                 Execute
               </div>
               <div class="orbit">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                 Evaluate
               </div>
               <div class="orbit">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                 Refine
               </div>
               <div class="center-koi">
                 <img src="/logo.png" alt="Koi logo" />
               </div>
             </div>
          </div>
        </div>

        <div class="vision-card performance">
          <div class="card-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--koi-orange)" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
          </div>
          <div class="card-content">
            <span class="cap">Performance</span>
            <h2>Built for Speed.</h2>
            <p>Rust-native core means &lt;10ms startup and ~5MB memory footprint. Powerful enough for researchers, light enough for your daily CLI.</p>
          </div>
        </div>

        <div class="vision-card ecosystems">
          <div class="card-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--koi-cyan)" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
          </div>
          <div class="card-content">
            <span class="cap">Ecosystem</span>
            <h2>Standardized Skills.</h2>
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
          <div v-if="activeTab === 'developers'" class="tab-pane">
            <div class="capability-columns">
              <div class="col">
                <div class="col-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                </div>
                <h3>CLI First</h3>
                <p>Designed for the terminal. Piped input support, interactive REPL, and zero-config setup.</p>
              </div>
              <div class="col">
                <div class="col-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                </div>
                <h3>Model Agnostic</h3>
                <p>Switch between Claude, GPT, or local Llama models with a single flag. No vendor lock-in.</p>
              </div>
              <div class="col">
                <div class="col-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                </div>
                <h3>WASM Plugins</h3>
                <p>Extend the orchestrator logic with pre-compiled, sandboxed WASM modules.</p>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'researchers'" class="tab-pane">
            <div class="capability-columns">
              <div class="col">
                <div class="col-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <h3>Formal Evaluation</h3>
                <p>Define rigorous rubrics in Markdown. Track scores across dimensions like safety and correctness.</p>
              </div>
              <div class="col">
                <div class="col-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </div>
                <h3>Pattern Mining</h3>
                <p>Automatically extract recurring behaviors and anti-patterns from large-scale agent runs.</p>
              </div>
              <div class="col">
                <div class="col-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                </div>
                <h3>Token-Frugal</h3>
                <p>Context compression and delta-feedback loops minimize model latency and cost.</p>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'everyone'" class="tab-pane">
            <div class="capability-columns">
              <div class="col">
                <div class="col-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                </div>
                <h3>App Integrations</h3>
                <p>Talk to Slack, Notion, iMessage, and more. OpenKoi lives where you work.</p>
              </div>
              <div class="col">
                <div class="col-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                </div>
                <h3>It Just Works</h3>
                <p>No Python, no Node, no dependencies. Just a single binary that finds your API keys automatically.</p>
              </div>
              <div class="col">
                <div class="col-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                </div>
                <h3>Self-Learning</h3>
                <p>The more you use it, the better it understands your specific workflow preferences.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Works With - Logo Grid Style -->
      <section class="works-with-section">
        <p class="over-title">Integrated with your workflow</p>
        <div class="logo-cloud">
          <div class="logo-item" title="Anthropic">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"></path></svg>
            <span>Anthropic</span>
          </div>
          <div class="logo-item" title="OpenAI">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M22.28 7.53a5.023 5.023 0 0 0-4.47-4.48c-2.27-.27-4.47.64-5.81 2.39-1.34-1.75-3.54-2.66-5.81-2.39a5.023 5.023 0 0 0-4.47 4.48c-.27 2.27.64 4.47 2.39 5.81-1.75 1.34-2.66 3.54-2.39 5.81a5.023 5.023 0 0 0 4.48 4.47c2.27.27 4.47-.64 5.81-2.39 1.34 1.75 3.54 2.66 5.81 2.39a5.023 5.023 0 0 0 4.47-4.48c.27-2.27-.64-4.47-2.39-5.81 1.75-1.34 2.66-3.54 2.39-5.81zM12 13.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path></svg>
            <span>OpenAI</span>
          </div>
          <div class="logo-item" title="Google">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.56-1.56 2.73-3.21 2.73-2.13 0-3.86-1.73-3.86-3.86s1.73-3.86 3.86-3.86c.94 0 1.8.34 2.46.91l2.06-2.06C18.74 3.6 15.65 2.5 12.18 2.5 6.7 2.5 2.25 6.95 2.25 12.43s4.45 9.93 9.93 9.93c5.48 0 9.27-3.69 9.27-9.43 0-.6-.06-1.22-.1-1.83z"></path></svg>
            <span>Google</span>
          </div>
          <div class="logo-item" title="Ollama">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path></svg>
            <span>Ollama</span>
          </div>
          <div class="logo-item" title="Slack">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M6 12.5C6 11.12 7.12 10 8.5 10H10V8.5C10 7.12 8.88 6 7.5 6C6.12 6 5 7.12 5 8.5C5 9.88 6.12 11 7.5 11H8V12.5C8 13.88 6.88 15 5.5 15C4.12 15 3 13.88 3 12.5C3 11.12 4.12 10 5.5 10H6V12.5zM15.5 14H14V15.5C14 16.88 15.12 18 16.5 18C17.88 18 19 16.88 19 15.5C19 14.12 17.88 13 16.5 13C15.12 13 14 14.12 14 15.5V16H15.5C16.88 16 18 14.88 18 13.5C18 12.12 16.88 11 15.5 11C14.12 11 13 12.12 13 13.5V14H15.5z"></path></svg>
            <span>Slack</span>
          </div>
          <div class="logo-item" title="Notion">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 2v14h14V5H5zm2 2h2v2H7V7zm4 0h6v2h-6V7zm-4 4h2v2H7v-2zm4 0h10v2H11v-2zm-4 4h2v2H7v-2zm4 0h10v2H11v-2z"></path></svg>
            <span>Notion</span>
          </div>
          <div class="logo-item" title="Discord">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M19.27 4.73C17.78 4.05 16.18 3.55 14.5 3.27C14.29 3.65 14.05 4.15 13.88 4.56C12.11 4.3 10.39 4.3 8.62 4.56C8.45 4.15 8.21 3.65 8 3.27C6.32 3.55 4.72 4.05 3.23 4.73C0.21 9.24 -0.61 13.63 0.4 17.93C2.41 19.41 4.36 20.3 6.27 20.89C6.74 20.25 7.15 19.56 7.5 18.82C6.8 18.57 6.13 18.25 5.5 17.87C5.67 17.74 5.83 17.61 6 17.47C9.88 19.27 14.15 19.27 18 17.47C18.17 17.61 18.33 17.74 18.5 17.87C17.87 18.25 17.2 18.57 16.5 18.82C16.85 19.56 17.26 20.25 17.73 20.89C19.64 20.3 21.59 19.41 23.6 17.93C24.76 12.91 23.67 8.57 19.27 4.73ZM8.5 14.65C7.34 14.65 6.39 13.58 6.39 12.27C6.39 10.96 7.32 9.89 8.5 9.89C9.69 9.89 10.63 10.96 10.61 12.27C10.61 13.58 9.69 14.65 8.5 14.65ZM15.5 14.65C14.34 14.65 13.39 13.58 13.39 12.27C13.39 10.96 14.32 9.89 15.5 9.89C16.69 9.89 17.63 10.96 17.61 12.27C17.61 13.58 16.69 14.65 15.5 14.65Z"></path></svg>
            <span>Discord</span>
          </div>
          <div class="logo-item" title="Telegram">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.91-1.27 4.85-2.11 5.82-2.52 2.77-1.17 3.34-1.37 3.72-1.38.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"></path></svg>
            <span>Telegram</span>
          </div>
        </div>
      </section>
    </main>

    <footer class="apple-footer">
      <div class="footer-content">
        <div class="footer-meta">
          <img src="/logo.png" alt="OpenKoi" class="footer-logo" />
          <p>The high-performance orchestrator for the AI era.</p>
        </div>
        <div class="footer-links">
          <div class="link-group">
            <h4>Resources</h4>
            <a href="/guide/introduction">Guide</a>
            <a href="/llm.txt">llm.txt</a>
            <a href="https://github.com/openkoi/openkoi">GitHub</a>
          </div>
          <div class="link-group">
            <h4>Community</h4>
            <a href="#">Discord</a>
            <a href="#">X (Twitter)</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 OpenKoi Project. The Engine of Certainty and related marks are trademarks of the OpenKoi team. Fully OpenClaw Compatible. Apache 2.0.</p>
      </div>
    </footer>
  </div>
</template>

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
}

/* Header - Glassmorphism */
.custom-header {
  position: fixed;
  top: 0;
  width: 100%;
  height: 52px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: saturate(180%) blur(20px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  z-index: 1000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #fff;
}

.logo-container img {
  width: 24px;
  height: 24px;
  border-radius: 5px;
}

.brand-name {
  font-weight: 600;
  font-size: 19px;
  letter-spacing: -0.01em;
}

.desktop-nav {
  display: flex;
  gap: 30px;
}

.desktop-nav a {
  color: #f5f5f7;
  text-decoration: none;
  font-size: 12px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.desktop-nav a:hover {
  opacity: 1;
}

.github-icon {
  color: #fff;
  opacity: 0.8;
}

/* Hero Section */
.hero-section {
  padding-top: 120px;
  padding-bottom: 100px;
  text-align: center;
}

.badge {
  color: var(--koi-orange);
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 15px;
  letter-spacing: 0.02em;
}

.hero-section h1 {
  font-size: clamp(3.5rem, 10vw, 6rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 auto;
  line-height: 1.1;
  max-width: 900px;
}

.gradient-text {
  background-image: linear-gradient(135deg, #ea580c 10%, #f97316 40%, #22d3ee 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.hero-subtitle {
  font-size: 24px;
  color: #86868b;
  margin-top: 20px;
  line-height: 1.4;
  font-weight: 400;
}

.hero-ctas {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
}

.apple-btn {
  padding: 12px 24px;
  border-radius: 980px;
  font-size: 17px;
  font-weight: 400;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.apple-btn.primary {
  background-color: #0071e3;
  color: #fff;
}

.apple-btn.primary:hover {
  background-color: #0077ed;
  transform: scale(1.02);
}

.terminal-cta {
  background: #1d1d1f;
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s;
  border: 1px solid rgba(255,255,255,0.05);
}

.terminal-cta:hover {
  background: #2d2d2f;
}

.scroll-hint {
  margin-top: 80px;
  color: #424245;
  font-size: 14px;
}

.chevron {
  width: 12px;
  height: 12px;
  border-right: 2px solid #424245;
  border-bottom: 2px solid #424245;
  transform: rotate(45deg);
  margin: 10px auto;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {transform: rotate(45deg) translate(0,0);}
  40% {transform: rotate(45deg) translate(5px,5px);}
  60% {transform: rotate(45deg) translate(3px,3px);}
}

.terminal-cta code {
  font-family: 'JetBrains Mono', monospace;
  color: #fff;
  font-size: 15px;
}

.prompt {
  color: var(--koi-cyan);
  font-weight: 700;
}

.copy-hint {
  font-size: 12px;
  color: #86868b;
  margin-left: 10px;
}

.copy-hint.active {
  color: var(--koi-cyan);
}

/* Vision Grid */
.vision-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.vision-card {
  background: #161617;
  border-radius: 28px;
  padding: 40px;
  overflow: hidden;
  position: relative;
  transition: transform 0.3s;
}

.vision-card:hover {
  transform: translateY(-5px);
}

.vision-card.large {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 480px;
  background: linear-gradient(135deg, #1d1d1f 0%, #000 100%);
}

.cap {
  color: #86868b;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 600;
  display: block;
  margin-bottom: 10px;
}

.vision-card h2 {
  font-size: 32px;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.vision-card.large h2 {
  font-size: 48px;
}

.vision-card p {
  font-size: 17px;
  color: #86868b;
  line-height: 1.5;
  margin: 0;
  max-width: 440px;
}

/* Iteration Animation Simulation */
.loop-container {
  position: relative;
  width: 300px;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.center-koi img {
  width: 80px;
  height: 80px;
  filter: drop-shadow(0 0 20px var(--koi-orange));
}

.orbit {
  position: absolute;
  font-size: 14px;
  font-weight: 600;
  color: var(--koi-cyan);
  background: rgba(34, 211, 238, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
}

.orbit:nth-child(1) { top: 0; }
.orbit:nth-child(2) { right: 0; }
.orbit:nth-child(3) { bottom: 0; }
.orbit:nth-child(4) { left: 0; }

/* Audience Section */
.audience-section {
  padding: 100px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-header h2 {
  font-size: 48px;
  margin: 0 0 30px 0;
}

.tab-switcher {
  background: #1d1d1f;
  padding: 4px;
  border-radius: 12px;
  display: inline-flex;
  gap: 4px;
}

.tab-switcher button {
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-switcher button.active {
  background: #3a3a3c;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}

.capability-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}

.capability-columns h3 {
  font-size: 21px;
  margin-bottom: 12px;
}

.capability-columns p {
  color: #86868b;
  line-height: 1.5;
}

/* Works With */
.works-with-section {
  padding: 80px 20px;
  text-align: center;
}

.over-title {
  color: #86868b;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 30px;
}

.logo-cloud {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 60px;
  opacity: 0.8;
  padding: 40px 0;
}

.logo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: transform 0.2s, opacity 0.2s;
  cursor: default;
}

.logo-item:hover {
  transform: translateY(-5px);
  opacity: 1;
}

.logo-item span {
  font-size: 14px;
  font-weight: 500;
  color: #86868b;
}

.logo-item svg {
  color: #f5f5f7;
}

.card-icon, .col-icon {
  margin-bottom: 20px;
}

.card-icon svg {
  filter: drop-shadow(0 0 10px rgba(234, 88, 12, 0.3));
}

.performance .card-icon svg {
  filter: drop-shadow(0 0 10px rgba(234, 88, 12, 0.5));
}

.ecosystems .card-icon svg {
  filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.5));
}

.col-icon svg {
  color: #fff;
  opacity: 0.9;
}

/* Animations */
.apple-footer {
  background: #161617;
  padding: 60px 20px;
  margin-top: 100px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 40px;
}

.footer-meta p {
  color: #86868b;
  margin-top: 15px;
}

.footer-logo {
  width: 40px;
  height: 40px;
}

.footer-links {
  display: flex;
  gap: 80px;
}

.link-group h4 {
  font-size: 12px;
  color: #fff;
  margin-bottom: 15px;
}

.link-group a {
  display: block;
  font-size: 12px;
  color: #86868b;
  text-decoration: none;
  margin-bottom: 10px;
}

.footer-bottom {
  max-width: 1200px;
  margin: 30px auto 0;
  color: #424245;
  font-size: 11px;
}

/* Animations */
.fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .hero-section h1 { font-size: 48px; }
  .vision-grid { grid-template-columns: 1fr; }
  .capability-columns { grid-template-columns: 1fr; }
  .footer-content { flex-direction: column; gap: 40px; }
}
</style>
