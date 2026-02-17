import { NextRequest, NextResponse } from 'next/server';
import { getTools, createTool, updateTool, deleteTool, ensureAdmin, type ToolCategory } from '@/lib/db';

export async function GET() {
    try {
        const tools = await getTools();
        return NextResponse.json(tools);
    } catch (error) {
        console.error('Failed to get tools:', error);
        return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const toolsToCreate = Array.isArray(body) ? body : [body];

        const admin = await ensureAdmin();
        const results = [];

        for (const item of toolsToCreate) {
            const { name, category, url, monthlyCost, dataAccess, status, purpose, ownerId, billingEmail, paymentSuffix } = item;

            if (!name || !category) {
                continue; // Skip invalid entries in bulk
            }

            const finalOwnerId = ownerId || admin.id;

            const tool = await createTool({
                name,
                category: category as ToolCategory,
                url: url || '',
                monthlyCost: monthlyCost || 0,
                dataAccess: dataAccess || 'none',
                status: status || 'active',
                purpose: purpose || 'Added via API',
                ownerId: finalOwnerId,
                billingEmail: billingEmail || '',
                paymentSuffix: paymentSuffix || ''
            });
            results.push(tool);
        }

        return NextResponse.json(Array.isArray(body) ? results : results[0], {
            status: results.length > 0 ? 201 : 400
        });
    } catch (error) {
        console.error('Failed to create tool:', error);
        return NextResponse.json({ error: 'Failed to create tool' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
        }

        const tool = await updateTool(id, updates);
        if (!tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }

        return NextResponse.json(tool);
    } catch (error) {
        console.error('Failed to update tool:', error);
        return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
        }

        const success = await deleteTool(id);
        if (!success) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete tool:', error);
        return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 });
    }
}
