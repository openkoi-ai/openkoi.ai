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
</script>

<template>
  <div class="homepage-root">
    <header class="custom-header">
      <a href="/" class="logo-container">
        <img src="/logo.png" alt="OpenKoi Logo" />
        <span>OpenKoi</span>
      </a>
      <nav>
        <a href="#features">Features</a>
        <a href="/guide/introduction">Docs</a>
        <a href="https://github.com/openkoi/openkoi" target="_blank">GitHub</a>
      </nav>
    </header>

    <main class="custom-main">
      <section class="hero">
        <h1>The AI Agent that <span>Iterates to Perfection.</span></h1>
        <p>A standalone, CLI-first platform written in Rust. It plans, executes, evaluates, and refines until the job is
          done.</p>

        <div class="cta-group">
          <a href="/guide/introduction" class="btn btn-primary">Get Started</a>
          <div class="install-cmd" @click="copyInstall">
            <code>cargo install openkoi</code>
            <svg v-if="!copied" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
      </section>

      <section id="features" class="features">
        <div class="feature-card">
          <h3>Self-Iteration Engine</h3>
          <p>OpenKoi doesn't just guess. It iterates. It evaluates its own output against rubrics and refines until
            quality thresholds are met.</p>
          <div class="compat-badge">Tai Chi Flow</div>
        </div>
        <div class="feature-card">
          <h3>Rust Powered</h3>
          <p>Zero runtime dependencies. &lt; 10ms startup. Single static binary. Built for performance and reliability on
              your machine.</p>
        </div>
        <div class="feature-card">
          <h3>OpenClaw Compatible</h3>
          <p>Fully compatible with the OpenClaw Skill system and MCP tools. Build once, run anywhere agents exist.</p>
          <div class="compat-badge">OpenClaw Ready</div>
        </div>
      </section>

      <section id="docs" class="docs-preview">
        <div class="docs-grid">
          <aside class="docs-nav">
            <ul>
              <li><a href="/guide/introduction" class="active">Introduction</a></li>
              <li><a href="/guide/installation">Installation</a></li>
              <li><a href="/guide/skill-system">Skill System</a></li>
              <li><a href="/guide/mcp-integration">MCP Integration</a></li>
            </ul>
          </aside>
          <article class="docs-content">
            <div id="intro">
              <h2>The Engine of Certainty</h2>
              <p>OpenKoi is a high-performance, self-iterating AI agent system. Unlike traditional agents that "fire and
                forget," OpenKoi follows a rigorous <strong>Plan-Execute-Evaluate-Refine</strong> cycle.</p>
              <p>Built with <strong>Rust</strong> for maximum speed (&lt; 10ms startup) and safety, it acts as a local
                  orchestrator that manages your tasks with a level of precision previously reserved for human developers.
              </p>
              <p>The core philosophy is inspired by <strong>Tai Chi</strong>: the fluid balance between the creative,
                probabilistic intelligence of LLMs and the rigid, deterministic execution of system-level code.</p>
            </div>
          </article>
        </div>
      </section>
    </main>

    <footer class="custom-footer">
      <div class="footer-links">
        <a href="https://github.com/openkoi/openkoi">GitHub</a>
        <a href="/guide/introduction">Documentation</a>
        <a href="/llm.txt">llm.txt</a>
      </div>
      <div class="copyright">
        &copy; 2026 OpenKoi Project. Released under the Apache License 2.0.
      </div>
    </footer>
  </div>
</template>

<style scoped>
.homepage-root {
    background-color: #0c0c0c;
    color: #f8fafc;
    min-height: 100vh;
    width: 100%;
    margin: 0;
    padding: 0;
    --primary: #ea580c;
    --secondary: #22d3ee;
    --text-dim: #94a3b8;
    --border-color: #27272a;
    --card-bg: #18181b;
}

.custom-header {
    padding: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

.logo-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-decoration: none;
    color: inherit;
}

.logo-container img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    background-color: #000;
}

.logo-container span {
    font-weight: 700;
    font-size: 1.5rem;
    letter-spacing: -0.025em;
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

nav {
    display: flex;
    gap: 2rem;
}

nav a {
    text-decoration: none;
    color: var(--text-dim);
    font-weight: 500;
    transition: color 0.2s;
}

nav a:hover {
    color: #f8fafc;
}

.custom-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.hero {
    text-align: center;
    padding: 6rem 0;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.hero h1 {
    font-size: 4.5rem;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 1.5rem;
    letter-spacing: -0.05em;
}

.hero h1 span {
    display: block;
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.hero p {
    font-size: 1.25rem;
    color: var(--text-dim);
    max-width: 600px;
    margin-bottom: 3rem;
}

.cta-group {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
}

.btn-primary {
    background: #f8fafc;
    color: #0c0c0c;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -10px rgba(255, 255, 255, 0.3);
}

.install-cmd {
    font-family: 'JetBrains Mono', monospace;
    background: var(--card-bg);
    padding: 0.75rem 1.25rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
}

.install-cmd:hover {
    border-color: var(--primary);
}

.install-cmd code {
    color: var(--secondary);
}

.features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 4rem;
}

.feature-card {
    background: var(--card-bg);
    padding: 2rem;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    transition: transform 0.2s, border-color 0.2s;
}

.feature-card:hover {
    transform: translateY(-4px);
    border-color: var(--secondary);
}

.feature-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
}

.feature-card p {
    margin: 0;
    color: var(--text-dim);
    line-height: 1.6;
}

.compat-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(34, 211, 238, 0.1);
    color: var(--secondary);
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-top: 1rem;
}

.docs-preview {
    margin-top: 8rem;
    padding: 4rem 2rem;
    background: rgba(24, 24, 27, 0.5);
    border-radius: 24px;
}

.docs-grid {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 4rem;
}

.docs-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.docs-nav li {
    margin-bottom: 1rem;
}

.docs-nav a {
    text-decoration: none;
    color: var(--text-dim);
    transition: color 0.1s;
}

.docs-nav a.active,
.docs-nav a:hover {
    color: var(--primary);
}

.docs-content h2 {
    font-size: 2rem;
    margin-top: 0;
}

.custom-footer {
    padding: 4rem 2rem;
    border-top: 1px solid var(--border-color);
    margin-top: 8rem;
    text-align: center;
}

.footer-links {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-links a {
    color: var(--text-dim);
    text-decoration: none;
}

.copyright {
    font-size: 0.875rem;
    color: var(--text-dim);
}

@media (max-width: 768px) {
    .hero h1 {
        font-size: 3rem;
    }

    .docs-grid {
        grid-template-columns: 1fr;
    }
}
</style>
