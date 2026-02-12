import { NextRequest, NextResponse } from 'next/server';
import { getGovernanceMetrics, getOversightFeed, getSpendingInsights } from '@/lib/db';

export async function GET() {
    try {
        const metrics = await getGovernanceMetrics();
        const feed = await getOversightFeed();
        const insights = await getSpendingInsights();

        return NextResponse.json({
            metrics,
            feed,
            spendingInsights: insights
        });
    } catch (error) {
        console.error('Oversight API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch oversight data' }, { status: 500 });
    }
}
