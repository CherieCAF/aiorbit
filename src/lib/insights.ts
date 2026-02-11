import type { Tool, Goal, Decision } from './db';

export interface Insight {
    id: string;
    type: 'info' | 'warning' | 'success' | 'tip';
    title: string;
    description: string;
    category: 'spending' | 'tools' | 'goals' | 'decisions' | 'recommendation';
}

export interface ToolRecommendation {
    goalCategory: string;
    toolCategory: string;
    description: string;
    examples: string[];
}

// Tool-Goal mapping: which tool categories are best for which goal categories
export const TOOL_GOAL_MAP: ToolRecommendation[] = [
    {
        goalCategory: 'Career',
        toolCategory: 'Communication',
        description: 'Communication AI tools help craft professional messages, prepare for interviews, and build your personal brand.',
        examples: ['ChatGPT for cover letters', 'Grammarly for professional writing', 'Otter.ai for meeting notes'],
    },
    {
        goalCategory: 'Career',
        toolCategory: 'Analytics',
        description: 'Analytics tools help you track industry trends, analyze job markets, and make data-driven career decisions.',
        examples: ['LinkedIn AI features', 'Crystal for personality insights', 'Tableau for portfolio dashboards'],
    },
    {
        goalCategory: 'Learning',
        toolCategory: 'Research',
        description: 'Research AI tools accelerate learning by summarizing papers, explaining concepts, and finding relevant resources.',
        examples: ['Perplexity for research', 'Elicit for academic papers', 'NotebookLM for study notes'],
    },
    {
        goalCategory: 'Learning',
        toolCategory: 'Code',
        description: 'Code AI tools are essential for learning programming — they explain code, suggest fixes, and teach best practices.',
        examples: ['GitHub Copilot for coding', 'Cursor for AI-first development', 'Replit AI for quick experiments'],
    },
    {
        goalCategory: 'Project',
        toolCategory: 'Productivity',
        description: 'Productivity AI tools help manage tasks, automate workflows, and keep projects on track with less manual effort.',
        examples: ['Notion AI for project docs', 'Zapier for automation', 'Linear for issue tracking'],
    },
    {
        goalCategory: 'Project',
        toolCategory: 'Code',
        description: 'Code AI tools dramatically speed up project development — from scaffolding to debugging to deployment.',
        examples: ['Cursor for full-stack dev', 'v0 by Vercel for UI', 'Claude for architecture planning'],
    },
    {
        goalCategory: 'Project',
        toolCategory: 'Creative',
        description: 'Creative AI tools generate assets, designs, and content that bring your project to life without a full design team.',
        examples: ['Midjourney for visuals', 'Canva AI for design', 'ElevenLabs for voice'],
    },
    {
        goalCategory: 'Financial',
        toolCategory: 'Analytics',
        description: 'Analytics AI tools help track spending, forecast budgets, and identify cost optimization opportunities.',
        examples: ['ChatGPT for financial analysis', 'Columns for data viz', 'Mint AI for budgeting'],
    },
    {
        goalCategory: 'Health',
        toolCategory: 'Productivity',
        description: 'Productivity AI tools can help build healthy habits, manage schedules for work-life balance, and reduce cognitive load.',
        examples: ['Reclaim.ai for schedule optimization', 'Headspace AI for mindfulness', 'Whoop for health tracking'],
    },
];

export function generateInsights(tools: Tool[], goals: Goal[], decisions: Decision[]): Insight[] {
    const insights: Insight[] = [];

    // ---- Spending insights ----
    const activeTools = tools.filter((t) => t.status === 'active');
    const totalSpend = tools.reduce((sum, t) => sum + (t.status !== 'paused' ? t.monthlyCost : 0), 0);
    const freeTools = tools.filter((t) => t.monthlyCost === 0);
    const paidTools = tools.filter((t) => t.monthlyCost > 0);

    if (totalSpend > 100) {
        insights.push({
            id: 'high-spend',
            type: 'warning',
            title: `You're spending $${totalSpend.toFixed(0)}/mo on AI tools`,
            description: 'Consider auditing tools you use less frequently. Pausing unused subscriptions could save money.',
            category: 'spending',
        });
    }

    if (paidTools.length > 0 && freeTools.length === 0) {
        insights.push({
            id: 'no-free-tools',
            type: 'tip',
            title: 'All your tools are paid',
            description: 'Many AI tools offer free tiers. Consider free alternatives for tools you use lightly.',
            category: 'spending',
        });
    }

    // ---- Tool overlap detection ----
    const categoryCount: Record<string, Tool[]> = {};
    tools.forEach((t) => {
        if (!categoryCount[t.category]) categoryCount[t.category] = [];
        categoryCount[t.category].push(t);
    });

    Object.entries(categoryCount).forEach(([category, catTools]) => {
        if (catTools.length >= 3) {
            insights.push({
                id: `overlap-${category}`,
                type: 'warning',
                title: `${catTools.length} tools in ${category}`,
                description: `You have ${catTools.map((t) => t.name).join(', ')} — consider if all are needed or if some overlap.`,
                category: 'tools',
            });
        }
    });

    // ---- Tool status insights ----
    const pausedTools = tools.filter((t) => t.status === 'paused');
    if (pausedTools.length > 0) {
        const pausedSpend = pausedTools.reduce((s, t) => s + t.monthlyCost, 0);
        insights.push({
            id: 'paused-tools',
            type: 'info',
            title: `${pausedTools.length} paused tool${pausedTools.length > 1 ? 's' : ''}`,
            description: pausedSpend > 0
                ? `You're saving $${pausedSpend.toFixed(0)}/mo by pausing ${pausedTools.map((t) => t.name).join(', ')}.`
                : `${pausedTools.map((t) => t.name).join(', ')} ${pausedTools.length === 1 ? 'is' : 'are'} paused. Reactivate or remove if no longer needed.`,
            category: 'tools',
        });
    }

    const trialTools = tools.filter((t) => t.status === 'trial');
    if (trialTools.length > 0) {
        insights.push({
            id: 'trial-tools',
            type: 'tip',
            title: `${trialTools.length} tool${trialTools.length > 1 ? 's' : ''} on trial`,
            description: `Evaluate ${trialTools.map((t) => t.name).join(', ')} before the trial ends to avoid unexpected charges.`,
            category: 'tools',
        });
    }

    // ---- Goal insights ----
    const activeGoals = goals.filter((g) => g.status === 'active');
    const stuckGoals = activeGoals.filter((g) => g.progress > 0 && g.progress < 50);
    const unlinkedGoals = activeGoals.filter((g) => g.linkedToolIds.length === 0);

    if (stuckGoals.length > 0) {
        insights.push({
            id: 'stuck-goals',
            type: 'warning',
            title: `${stuckGoals.length} goal${stuckGoals.length > 1 ? 's' : ''} under 50% progress`,
            description: `"${stuckGoals[0].title}"${stuckGoals.length > 1 ? ` and ${stuckGoals.length - 1} more` : ''} may need attention. Consider breaking them into smaller steps.`,
            category: 'goals',
        });
    }

    if (unlinkedGoals.length > 0) {
        insights.push({
            id: 'unlinked-goals',
            type: 'tip',
            title: `${unlinkedGoals.length} goal${unlinkedGoals.length > 1 ? 's' : ''} without linked tools`,
            description: 'Link AI tools to your goals to track which tools drive the most value for each objective.',
            category: 'goals',
        });
    }

    const completedGoals = goals.filter((g) => g.status === 'completed');
    if (completedGoals.length > 0) {
        insights.push({
            id: 'completed-goals',
            type: 'success',
            title: `${completedGoals.length} goal${completedGoals.length > 1 ? 's' : ''} completed!`,
            description: 'Great progress. Set new goals to keep your momentum going.',
            category: 'goals',
        });
    }

    // ---- Decision insights ----
    const positiveDecisions = decisions.filter((d) => d.outcomeStatus === 'positive');
    const negativeDecisions = decisions.filter((d) => d.outcomeStatus === 'negative');
    const pendingDecisions = decisions.filter((d) => d.outcomeStatus === 'pending');

    if (pendingDecisions.length >= 3) {
        insights.push({
            id: 'pending-decisions',
            type: 'tip',
            title: `${pendingDecisions.length} decisions awaiting outcome review`,
            description: 'Revisit past decisions and update their outcomes. This helps you learn what works.',
            category: 'decisions',
        });
    }

    if (positiveDecisions.length > 0 && decisions.length >= 3) {
        // Find which tools correlate with positive decisions
        const toolUsageCounts: Record<string, number> = {};
        positiveDecisions.forEach((d) => {
            d.aiToolsUsed.forEach((toolId) => {
                toolUsageCounts[toolId] = (toolUsageCounts[toolId] || 0) + 1;
            });
        });

        const topToolId = Object.entries(toolUsageCounts).sort((a, b) => b[1] - a[1])[0];
        if (topToolId) {
            const topTool = tools.find((t) => t.id === topToolId[0]);
            if (topTool) {
                insights.push({
                    id: 'best-decision-tool',
                    type: 'success',
                    title: `${topTool.name} correlates with your best decisions`,
                    description: `${topToolId[1]} of your positive-outcome decisions involved ${topTool.name}. It may be your most valuable tool.`,
                    category: 'decisions',
                });
            }
        }
    }

    if (negativeDecisions.length >= 2) {
        insights.push({
            id: 'negative-pattern',
            type: 'warning',
            title: `${negativeDecisions.length} decisions had negative outcomes`,
            description: 'Review these decisions to identify patterns. Were they rushed? Missing data? Wrong category?',
            category: 'decisions',
        });
    }

    // ---- Tool-Goal recommendations ----
    activeGoals.forEach((goal) => {
        const recommendations = TOOL_GOAL_MAP.filter((m) => m.goalCategory === goal.category);
        const linkedCats: string[] = [];
        goal.linkedToolIds.forEach((id) => {
            const t = tools.find((tool) => tool.id === id);
            if (t) linkedCats.push(t.category);
        });
        const linkedCategories = new Set(linkedCats);

        recommendations.forEach((rec) => {
            const hasToolInCategory = tools.some((t) => t.category === rec.toolCategory);
            if (!hasToolInCategory && !linkedCategories.has(rec.toolCategory)) {
                insights.push({
                    id: `rec-${goal.id}-${rec.toolCategory}`,
                    type: 'tip',
                    title: `Consider a ${rec.toolCategory} tool for "${goal.title}"`,
                    description: `${rec.description} Try: ${rec.examples[0]}.`,
                    category: 'recommendation',
                });
            }
        });
    });

    // If no insights generated, add a welcome one
    if (insights.length === 0) {
        insights.push({
            id: 'welcome',
            type: 'info',
            title: 'Add more data to unlock insights',
            description: 'Register tools, set goals, and log decisions — AIOrbit will analyze patterns and surface recommendations.',
            category: 'tools',
        });
    }

    return insights;
}
