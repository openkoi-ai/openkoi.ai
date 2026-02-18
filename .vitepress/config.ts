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
            { text: 'Features', link: '/#features' },
            { text: 'Docs', link: '/guide/introduction' },
            { text: 'GitHub', link: 'https://github.com/openkoi/openkoi' }
        ],
        sidebar: [
            {
                text: 'Guide',
                items: [
                    { text: 'Introduction', link: '/guide/introduction' },
                    { text: 'Installation', link: '/guide/installation' },
                    { text: 'Skill System', link: '/guide/skill-system' },
                    { text: 'MCP Integration', link: '/guide/mcp-integration' }
                ]
            }
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/openkoi/openkoi' }
        ],
        footer: {
            message: 'Released under the Apache License 2.0.',
            copyright: 'Copyright © 2026-present OpenKoi Project'
        }
    }
})
