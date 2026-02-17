import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/db';

export async function GET() {
    try {
        const settings = await getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const updated = await updateSettings(body);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
