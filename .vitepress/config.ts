import { defineConfig } from 'vitepress'

export default defineConfig({
    title: "OpenKoi",
    description: "The AI Agent that Iterates to Perfection.",
    head: [
        ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
        ['meta', { name: 'theme-color', content: '#ea580c' }]
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
