import { NextRequest, NextResponse } from 'next/server';
import { getDirectoryTools, saveDirectoryTool, deleteDirectoryTool, seedDirectory } from '@/lib/db';
import { seedTools } from '@/lib/directorySeed';

export async function GET() {
    try {
        const tools = await getDirectoryTools();
        // If empty, seed it
        if (tools.length === 0) {
            await seedDirectory(seedTools);
            return NextResponse.json(seedTools);
        }
        return NextResponse.json(tools);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch directory' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const tool = await saveDirectoryTool(body);
        return NextResponse.json(tool);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save directory tool' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    // Shared with POST as saveDirectoryTool handles both create and update
    return POST(request);
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
        await deleteDirectoryTool(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete directory tool' }, { status: 500 });
    }
}
