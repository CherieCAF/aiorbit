import { NextRequest, NextResponse } from 'next/server';
import { saveMember, generateId } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { email, role, department, aiBudget } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const inviteCode = generateId().slice(0, 8).toUpperCase();

        const invitedMember = await saveMember({
            name: 'Pending Invite',
            email,
            role: role || 'member',
            department: department || 'General',
            aiBudget: aiBudget || 100,
            status: 'invited',
            inviteCode,
        });

        return NextResponse.json({
            message: 'Invite generated successfully',
            inviteCode,
            member: invitedMember
        });
    } catch (error) {
        console.error('Invite API Error:', error);
        return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }
}
