import { NextRequest, NextResponse } from 'next/server';
import { certifyTool } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { id } = await req.json();
        if (!id) {
            return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
        }

        const updated = await certifyTool(id);
        if (!updated) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Certify API Error:', error);
        return NextResponse.json({ error: 'Failed to certify tool' }, { status: 500 });
    }
}
