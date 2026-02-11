import { NextRequest, NextResponse } from 'next/server';
import { getDecisions, createDecision, updateDecision, deleteDecision, type DecisionCategory } from '@/lib/db';

export async function GET() {
    try {
        const decisions = await getDecisions();
        return NextResponse.json(decisions);
    } catch (error) {
        console.error('Failed to get decisions:', error);
        return NextResponse.json({ error: 'Failed to fetch decisions' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, context, options, chosenOption, aiToolsUsed, outcome, outcomeStatus, category } = body;

        if (!title || !category) {
            return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
        }

        const decision = await createDecision({
            title,
            context: context || '',
            options: options || [],
            chosenOption: chosenOption || '',
            aiToolsUsed: aiToolsUsed || [],
            outcome: outcome || undefined,
            outcomeStatus: outcomeStatus || 'pending',
            category: category as DecisionCategory,
        });

        return NextResponse.json(decision, { status: 201 });
    } catch (error) {
        console.error('Failed to create decision:', error);
        return NextResponse.json({ error: 'Failed to create decision' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Decision ID is required' }, { status: 400 });
        }

        const decision = await updateDecision(id, updates);
        if (!decision) {
            return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
        }

        return NextResponse.json(decision);
    } catch (error) {
        console.error('Failed to update decision:', error);
        return NextResponse.json({ error: 'Failed to update decision' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Decision ID is required' }, { status: 400 });
        }

        const success = await deleteDecision(id);
        if (!success) {
            return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete decision:', error);
        return NextResponse.json({ error: 'Failed to delete decision' }, { status: 500 });
    }
}
