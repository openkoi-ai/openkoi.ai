import { defineConfig } from 'vitepress'

export default defineConfig({
    title: "OpenKoi",
    description: "Stop babysitting your AI. OpenKoi iterates until the code is right.",
    head: [
        ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
        ['meta', { name: 'theme-color', content: '#ea580c' }],
        // Open Graph
        ['meta', { property: 'og:type', content: 'website' }],
        ['meta', { property: 'og:title', content: 'OpenKoi — Stop babysitting your AI.' }],
        ['meta', { property: 'og:description', content: 'AI coding tools generate drafts and stop. OpenKoi reviews its own work — iterating until quality thresholds are met. Single Rust binary, local-first, any model.' }],
        ['meta', { property: 'og:image', content: 'https://openkoi.ai/images/og-image.png' }],
        ['meta', { property: 'og:image:width', content: '1200' }],
        ['meta', { property: 'og:image:height', content: '630' }],
        ['meta', { property: 'og:url', content: 'https://openkoi.ai' }],
        ['meta', { property: 'og:site_name', content: 'OpenKoi' }],
        // Twitter Card
        ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
        ['meta', { name: 'twitter:title', content: 'OpenKoi — Stop babysitting your AI.' }],
        ['meta', { name: 'twitter:description', content: 'AI coding tools generate drafts and stop. OpenKoi reviews its own work — iterating until quality thresholds are met.' }],
        ['meta', { name: 'twitter:image', content: 'https://openkoi.ai/images/og-image.png' }]
    ],
    themeConfig: {
        logo: '/logo.png',
        nav: [
            { text: 'Vision', link: '/#vision' },
            { text: 'Capabilities', link: '/#capabilities' },
            { text: 'Docs', link: '/guide/introduction' },
            { text: 'GitHub', link: 'https://github.com/openkoi-ai/openkoi' }
        ],
        sidebar: [
            {
                text: 'Getting Started',
                items: [
                    { text: 'Introduction', link: '/guide/introduction' },
                    { text: 'Installation', link: '/guide/installation' },
                    { text: 'CLI Reference', link: '/guide/cli-reference' },
                    { text: 'Configuration', link: '/guide/configuration' }
                ]
            },
            {
                text: 'Core Engine',
                items: [
                    { text: 'Architecture', link: '/guide/architecture' },
                    { text: 'Iteration Engine', link: '/guide/iteration-engine' },
                    { text: 'Evaluator System', link: '/guide/evaluator-system' },
                    { text: 'Providers', link: '/guide/providers' }
                ]
            },
            {
                text: 'Intelligence',
                items: [
                    { text: 'Memory & Learning', link: '/guide/memory-learning' },
                    { text: 'Pattern Mining', link: '/guide/pattern-mining' },
                    { text: 'Soul System', link: '/guide/soul-system' },
                    { text: 'Skill System', link: '/guide/skill-system' }
                ]
            },
            {
                text: 'Extensibility',
                items: [
                    { text: 'Plugins (MCP, WASM, Rhai)', link: '/guide/plugins' },
                    { text: 'Integrations', link: '/guide/integrations' },
                    { text: 'MCP Integration', link: '/guide/mcp-integration' }
                ]
            },
            {
                text: 'Operations',
                items: [
                    { text: 'Security', link: '/guide/security' },
                    { text: 'Dashboard & Daemon', link: '/guide/dashboard' }
                ]
            }
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/openkoi-ai/openkoi' }
        ],
        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2026-present OpenKoi Project'
        }
    }
})
