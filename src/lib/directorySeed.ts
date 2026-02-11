import { DirectoryTool } from './db';

const now = new Date().toISOString();

export const seedTools: DirectoryTool[] = [
    {
        id: 'dir-openai-chatgpt',
        name: 'ChatGPT',
        description: 'OpenAI\'s powerful conversational AI based on GPT-4. Great for writing, coding, and logical reasoning.',
        category: 'Chatbot',
        url: 'https://chat.openai.com',
        rating: 5,
        highlight: 'Industry Standard',
        pricing: [
            { name: 'Free', price: '$0', features: 'Access to GPT-3.5' },
            { name: 'Plus', price: '$20/mo', features: 'Access to GPT-4, DALL-E, Browsing' },
            { name: 'Team', price: '$25/mo per user', features: 'Admin console, shared workspace' }
        ],
        addedAt: now,
        updatedAt: now
    },
    {
        id: 'dir-anthropic-claude',
        name: 'Claude',
        description: 'Anthropic\'s AI assistant known for its helpfulness, honesty, and safety. Excellent for long-form reading and logical analysis.',
        category: 'Chatbot',
        url: 'https://claude.ai',
        rating: 5,
        highlight: 'Best for long documents',
        pricing: [
            { name: 'Free', price: '$0', features: 'Access to Claude 3 Sonnet' },
            { name: 'Pro', price: '$20/mo', features: '5x more usage, priority access' },
            { name: 'Team', price: '$25/mo per user', features: 'Higher usage limits, admin tools' }
        ],
        addedAt: now,
        updatedAt: now
    },
    {
        id: 'dir-midjourney',
        name: 'Midjourney',
        description: 'Leading AI image generator known for artistic quality and creative versatility. Operates primarily through Discord.',
        category: 'Image',
        url: 'https://midjourney.com',
        rating: 5,
        highlight: 'Top Tier Art',
        pricing: [
            { name: 'Basic', price: '$10/mo', features: '3.3 hr/mo fast GPU time' },
            { name: 'Standard', price: '$30/mo', features: '15 hr/mo fast GPU time' },
            { name: 'Pro', price: '$60/mo', features: '30 hr/mo fast GPU time, stealth mode' }
        ],
        addedAt: now,
        updatedAt: now
    },
    {
        id: 'dir-perplexity',
        name: 'Perplexity',
        description: 'An AI-powered search engine that provides real-time web results with citations.',
        category: 'Research',
        url: 'https://perplexity.ai',
        rating: 5,
        highlight: 'Real-time search',
        pricing: [
            { name: 'Free', price: '$0', features: 'Unlimited basic searches' },
            { name: 'Pro', price: '$20/mo', features: 'GPT-4/Claude 3 access, file uploads' }
        ],
        addedAt: now,
        updatedAt: now
    },
    {
        id: 'dir-cursor',
        name: 'Cursor',
        description: 'The AI-native code editor built on VS Code. Integrates LLMs directly into the coding workflow.',
        category: 'Code',
        url: 'https://cursor.com',
        rating: 5,
        highlight: 'Best for Developers',
        pricing: [
            { name: 'Free', price: '$0', features: '2k completions/mo' },
            { name: 'Pro', price: '$20/mo', features: 'Unlimited completions, 500 fast requests' }
        ],
        addedAt: now,
        updatedAt: now
    },
    {
        id: 'dir-canva',
        name: 'Canva Magic Studio',
        description: 'Popular design platform with integrated AI features for image creation, background removal, and layout suggestions.',
        category: 'Design',
        url: 'https://canva.com',
        rating: 4,
        highlight: 'All-in-one design',
        pricing: [
            { name: 'Free', price: '$0', features: 'Basic AI tools' },
            { name: 'Pro', price: '$12.99/mo', features: 'Full Magic Studio access' }
        ],
        addedAt: now,
        updatedAt: now
    },
    {
        id: 'dir-runway',
        name: 'Runway Gen-2',
        description: 'Advanced AI video generation and editing platform.',
        category: 'Video',
        url: 'https://runwayml.com',
        rating: 5,
        highlight: 'Pro Video Gen',
        pricing: [
            { name: 'Basic', price: '$0', features: '125 credits' },
            { name: 'Standard', price: '$15/mo', features: '625 credits/mo, remove watermark' },
            { name: 'Pro', price: '$35/mo', features: '2250 credits/mo, higher res' }
        ],
        addedAt: now,
        updatedAt: now
    },
    {
        id: 'dir-notion',
        name: 'Notion AI',
        description: 'AI assistant embedded in Notion to help write, summarize, and organize notes.',
        category: 'Productivity',
        url: 'https://notion.so',
        rating: 4,
        highlight: 'Workflow integration',
        pricing: [
            { name: 'AI Add-on', price: '$10/mo', features: 'Unlimited AI responses' }
        ],
        addedAt: now,
        updatedAt: now
    },
    {
        id: 'dir-elevenlabs',
        name: 'ElevenLabs',
        description: 'Leading AI voice generator and text-to-speech platform with highly realistic voices.',
        category: 'Audio',
        url: 'https://elevenlabs.io',
        rating: 5,
        highlight: 'Best Text-to-Speech',
        pricing: [
            { name: 'Free', price: '$0', features: '10,000 characters/mo' },
            { name: 'Starter', price: '$5/mo', features: '30,000 characters, voice cloning' },
            { name: 'Creator', price: '$22/mo', features: '100,000 characters' }
        ],
        addedAt: now,
        updatedAt: now
    }
];
