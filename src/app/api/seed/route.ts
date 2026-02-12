import { NextRequest, NextResponse } from 'next/server';
import {
    experimental_overwriteDb,
    generateId,
    Member,
    Tool,
    Invoice,
    Transaction
} from '@/lib/db';

export async function POST() {
    try {
        const now = new Date();
        const thirtyTwoDaysAgo = new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000).toISOString();
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
        const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Members
        const members: Member[] = [
            { id: generateId(), name: 'Company Admin', email: 'admin@company.com', role: 'admin', department: 'Operations', aiBudget: 1000, joinedAt: sixtyDaysAgo },
            { id: generateId(), name: 'Sarah Chen', email: 'sarah@company.com', role: 'member', department: 'Engineering', aiBudget: 500, joinedAt: sixtyDaysAgo },
            { id: generateId(), name: 'Alex Rivera', email: 'alex@company.com', role: 'member', department: 'Marketing', aiBudget: 400, joinedAt: sixtyDaysAgo },
            { id: generateId(), name: 'Jordan Smyth', email: 'jordan@company.com', role: 'member', department: 'Product', aiBudget: 300, joinedAt: sixtyDaysAgo },
            { id: generateId(), name: 'Taylor Reed', email: 'taylor@company.com', role: 'member', department: 'Design', aiBudget: 200, joinedAt: sixtyDaysAgo },
        ];

        const adminId = members[0].id;
        const sarahId = members[1].id;
        const alexId = members[2].id;
        const jordanId = members[3].id;
        const taylorId = members[4].id;

        // 2. Tools
        const tools: Tool[] = [
            { id: generateId(), name: 'ChatGPT Plus', category: 'Productivity', url: 'https://chat.openai.com', monthlyCost: 20, dataAccess: 'full', status: 'active', purpose: 'General assistance and drafting', ownerId: sarahId, lastCertifiedAt: yesterday, addedAt: sixtyDaysAgo, updatedAt: yesterday },
            { id: generateId(), name: 'Claude Pro', category: 'Writing', url: 'https://claude.ai', monthlyCost: 20, dataAccess: 'full', status: 'active', purpose: 'Complex reasoning and document analysis', ownerId: alexId, lastCertifiedAt: yesterday, addedAt: sixtyDaysAgo, updatedAt: yesterday },
            { id: generateId(), name: 'Cursor', category: 'Code', url: 'https://cursor.sh', monthlyCost: 20, dataAccess: 'full', status: 'active', purpose: 'AI-assisted code editing', ownerId: sarahId, lastCertifiedAt: yesterday, addedAt: sixtyDaysAgo, updatedAt: yesterday },
            { id: generateId(), name: 'Midjourney', category: 'Creative', url: 'https://midjourney.com', monthlyCost: 30, dataAccess: 'limited', status: 'active', purpose: 'Asset generation', ownerId: taylorId, lastCertifiedAt: yesterday, addedAt: sixtyDaysAgo, updatedAt: yesterday },
            { id: generateId(), name: 'Otter.ai', category: 'Communication', url: 'https://otter.ai', monthlyCost: 16, dataAccess: 'full', status: 'active', purpose: 'Meeting transcription', ownerId: jordanId, lastCertifiedAt: thirtyTwoDaysAgo, addedAt: sixtyDaysAgo, updatedAt: thirtyTwoDaysAgo },
            { id: generateId(), name: 'GitHub Copilot', category: 'Code', url: 'https://github.com/features/copilot', monthlyCost: 19, dataAccess: 'full', status: 'active', purpose: 'AI autocomplete', ownerId: sarahId, lastCertifiedAt: yesterday, addedAt: sixtyDaysAgo, updatedAt: yesterday },
            { id: generateId(), name: 'Notion AI', category: 'Productivity', url: 'https://notion.so', monthlyCost: 10, dataAccess: 'limited', status: 'active', purpose: 'Knowledge base assistance', ownerId: adminId, lastCertifiedAt: yesterday, addedAt: sixtyDaysAgo, updatedAt: yesterday },
            { id: generateId(), name: 'Jasper', category: 'Writing', url: 'https://jasper.ai', monthlyCost: 49, dataAccess: 'limited', status: 'paused', purpose: 'Marketing copy generation', ownerId: alexId, lastCertifiedAt: sixtyDaysAgo, addedAt: sixtyDaysAgo, updatedAt: sixtyDaysAgo },
        ];

        // 3. Transactions & Invoices (Matching some)
        const transactions: Transaction[] = [];
        const invoices: Invoice[] = [];

        // Add 2 months of history for a few tools to show MoM trends
        const toolHistory = [
            { tool: tools[0], memberId: sarahId, merchant: 'OpenAI' },
            { tool: tools[1], memberId: alexId, merchant: 'Anthropic' },
            { tool: tools[3], memberId: taylorId, merchant: 'Midjourney' },
        ];

        for (let i = 0; i < 2; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 15).toISOString();
            toolHistory.forEach(({ tool, memberId, merchant }) => {
                const txId = generateId();
                const invId = generateId();

                transactions.push({
                    id: txId,
                    date,
                    amount: tool.monthlyCost,
                    currency: 'USD',
                    merchant,
                    memberId,
                    status: 'matched',
                    matchedInvoiceId: invId
                });

                invoices.push({
                    id: invId,
                    toolId: tool.id,
                    memberId,
                    amount: tool.monthlyCost,
                    currency: 'USD',
                    billingDate: date,
                    status: 'received',
                    transactionId: txId,
                    createdAt: date
                });
            });
        }

        // Add some Unclaimed (Shadow AI)
        transactions.push({
            id: generateId(),
            date: yesterday,
            amount: 149,
            currency: 'USD',
            merchant: 'CAPITAL ON TAP - UNKNOWN AI',
            status: 'unclaimed'
        });

        transactions.push({
            id: generateId(),
            date: now.toISOString(),
            amount: 59,
            currency: 'USD',
            merchant: 'PPLX*PERPLEXITY',
            status: 'unclaimed' // Someone is using Perplexity but hasn't logged it!
        });

        // Add a "Missing" invoice flag
        const missingTxId = generateId();
        transactions.push({
            id: missingTxId,
            date: thirtyTwoDaysAgo,
            amount: 19.99,
            currency: 'USD',
            merchant: 'GITHUB COPILOT',
            memberId: sarahId,
            status: 'unclaimed' // Sarah has the tool but didn't submit the invoice for this month
        });

        const db = {
            tools,
            members,
            invoices,
            transactions,
            goals: [
                { id: generateId(), title: 'Automate Customer Support', description: 'Use LLMs to triage 50% of support tickets', category: 'Project', status: 'active', progress: 35, linkedToolIds: [tools[0].id, tools[1].id], createdAt: sixtyDaysAgo, updatedAt: yesterday },
                { id: generateId(), title: 'Asset Generation Workflow', description: 'Shift 80% of asset creation to Midjourney', category: 'Project', status: 'active', progress: 60, linkedToolIds: [tools[3].id], createdAt: sixtyDaysAgo, updatedAt: yesterday }
            ],
            decisions: [
                { id: generateId(), title: 'Switch from Copy.ai to Claude', context: 'Claude 3.5 Sonnet shows better reasoning for our docs.', options: ['Stick with Copy.ai', 'Claude Pro', 'OpenAI API'], chosenOption: 'Claude Pro', aiToolsUsed: [tools[1].id], outcomeStatus: 'positive', category: 'Technology', createdAt: thirtyTwoDaysAgo, updatedAt: yesterday }
            ],
            learning: [],
            directory: []
        };

        await experimental_overwriteDb(db);

        return NextResponse.json({ message: 'Database seeded successfully', memberCount: members.length, toolCount: tools.length });
    } catch (error) {
        console.error('Seed Error:', error);
        return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
    }
}
