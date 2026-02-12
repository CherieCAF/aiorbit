import { NextRequest, NextResponse } from 'next/server';
import { getTransactions, saveTransaction } from '@/lib/db';

export async function GET() {
    try {
        const txs = await getTransactions();

        // Seed some raw transactions if empty for demo
        if (txs.length === 0) {
            const seedTxs = [
                { date: new Date().toISOString(), amount: 20, currency: 'USD', merchant: 'Cursor AI', status: 'unclaimed' },
                { date: new Date().toISOString(), amount: 20, currency: 'USD', merchant: 'OpenAI (ChatGPT)', status: 'unclaimed' },
                { date: new Date().toISOString(), amount: 30, currency: 'USD', merchant: 'Midjourney', status: 'unclaimed' },
            ];
            for (const tx of seedTxs) {
                await saveTransaction(tx as any);
            }
            return NextResponse.json(await getTransactions());
        }

        return NextResponse.json(txs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}
