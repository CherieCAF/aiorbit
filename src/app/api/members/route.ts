import { NextRequest, NextResponse } from 'next/server';
import { getMembers, saveMember, ensureAdmin, bulkSaveMembers } from '@/lib/db';

export async function GET() {
    try {
        await ensureAdmin(); // Ensure at least one admin exists
        const members = await getMembers();
        return NextResponse.json(members);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (Array.isArray(body)) {
            const members = await bulkSaveMembers(body);
            return NextResponse.json({
                count: members.length,
                message: `Successfully imported ${members.length} members`
            });
        }

        const member = await saveMember(body);
        return NextResponse.json(member);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save member(s)' }, { status: 500 });
    }
}
