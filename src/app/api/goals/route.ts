import { NextRequest, NextResponse } from 'next/server';
import { getGoals, createGoal, updateGoal, deleteGoal, type GoalCategory } from '@/lib/db';

export async function GET() {
    try {
        const goals = await getGoals();
        return NextResponse.json(goals);
    } catch (error) {
        console.error('Failed to get goals:', error);
        return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, category, status, progress, linkedToolIds, targetDate } = body;

        if (!title || !category) {
            return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
        }

        const goal = await createGoal({
            title,
            description: description || '',
            category: category as GoalCategory,
            status: status || 'active',
            progress: progress || 0,
            linkedToolIds: linkedToolIds || [],
            targetDate: targetDate || undefined,
        });

        return NextResponse.json(goal, { status: 201 });
    } catch (error) {
        console.error('Failed to create goal:', error);
        return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
        }

        const goal = await updateGoal(id, updates);
        if (!goal) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        return NextResponse.json(goal);
    } catch (error) {
        console.error('Failed to update goal:', error);
        return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
        }

        const success = await deleteGoal(id);
        if (!success) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete goal:', error);
        return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }
}
