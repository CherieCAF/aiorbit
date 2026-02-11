import { NextResponse } from 'next/server';
import { getLearningItems, createLearningItem, getTools, getGoals } from '@/lib/db';

// Seed content based on common AI tool categories
const SEED_CONTENT = [
    {
        title: 'How to Build an AI-Augmented Workflow',
        description: 'Learn the principles of designing workflows where AI tools complement your strengths rather than replace them. Includes frameworks for evaluating which tasks to delegate to AI.',
        category: 'Productivity',
        tags: ['workflow', 'productivity', 'ai-augmentation'],
        url: 'https://hbr.org/2023/07/how-to-boost-your-productivity-with-generative-ai',
    },
    {
        title: '10 Prompting Techniques That Actually Work',
        description: 'Move beyond basic prompts. Master chain-of-thought, few-shot, and role-based prompting to get dramatically better results from any LLM.',
        category: 'Skills',
        tags: ['prompting', 'llm', 'techniques'],
        url: 'https://www.promptingguide.ai/techniques',
    },
    {
        title: 'Understanding AI Data Privacy',
        description: 'What happens to your data when you use AI tools? A practical guide to understanding data policies, opting out of training, and protecting sensitive information.',
        category: 'Privacy',
        tags: ['privacy', 'data', 'security'],
        url: 'https://www.wired.com/story/how-to-protect-your-data-from-ai/',
    },
    {
        title: 'The Decision Journal Method',
        description: 'Why tracking your decisions is the highest-ROI habit you can build. Learn the framework used by top CEOs and investors to improve decision quality over time.',
        category: 'Decision-Making',
        tags: ['decisions', 'framework', 'leadership'],
        url: 'https://fs.blog/decision-journal/',
    },
    {
        title: 'AI Tool Stacking: Combining Tools for Maximum Impact',
        description: 'Most people use AI tools in isolation. Learn how to create powerful workflows by connecting multiple AI tools together for compounding results.',
        category: 'Productivity',
        tags: ['tool-stacking', 'workflow', 'automation'],
        url: 'https://zapier.com/blog/ai-workflow/',
    },
    {
        title: 'Setting Goals in the Age of AI',
        description: 'Traditional goal-setting frameworks weren\'t designed for an AI-augmented world. Discover how to set goals that account for rapidly changing capabilities.',
        category: 'Goals',
        tags: ['goals', 'planning', 'ai-strategy'],
        url: 'https://hbr.org/2024/02/how-to-set-ai-goals-your-team-will-actually-achieve',
    },
    {
        title: 'How to Evaluate If an AI Tool Is Worth the Cost',
        description: 'A practical ROI framework for AI tools. Calculate the true cost including time investment, learning curve, and opportunity cost of not using alternatives.',
        category: 'Financial',
        tags: ['roi', 'evaluation', 'cost-analysis'],
        url: 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai',
    },
    {
        title: 'Building a Personal Knowledge System with AI',
        description: 'Use AI to capture, organize, and retrieve knowledge more effectively. Transform scattered notes into a powerful personal knowledge base.',
        category: 'Learning',
        tags: ['knowledge-management', 'learning', 'note-taking'],
        url: 'https://fortelabs.com/blog/basboverview/',
    },
];

export async function GET() {
    try {
        let items = await getLearningItems();

        // Auto-seed content if empty
        if (items.length === 0) {
            for (const content of SEED_CONTENT) {
                await createLearningItem({
                    title: content.title,
                    description: content.description,
                    url: content.url,
                    category: content.category,
                    tags: content.tags,
                    isRead: false,
                    isBookmarked: false,
                });
            }
            items = await getLearningItems();
        }

        return NextResponse.json(items);
    } catch (error) {
        console.error('Failed to get learning items:', error);
        return NextResponse.json({ error: 'Failed to fetch learning items' }, { status: 500 });
    }
}
