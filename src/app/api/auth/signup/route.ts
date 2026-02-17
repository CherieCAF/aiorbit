import { NextRequest, NextResponse } from 'next/server';
import { getMemberByEmail, saveMember } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { name, email, password, department, role, inviteCode } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
        }

        const { getMembers, saveMember, getMemberByEmail } = await import('@/lib/db');
        const members = await getMembers();

        let memberToSave;

        if (inviteCode) {
            const invited = members.find(m => m.inviteCode === inviteCode);
            if (!invited) {
                return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
            }
            memberToSave = {
                ...invited,
                name,
                password,
                status: 'active' as const,
                inviteCode: undefined // Clear code after use
            };
        } else {
            const existing = await getMemberByEmail(email);
            if (existing) {
                return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
            }
            memberToSave = {
                name,
                email,
                password,
                department: department || 'General',
                role: (role === 'admin' ? 'admin' : 'member') as 'admin' | 'member',
                aiBudget: role === 'admin' ? 500 : 100,
                status: 'active' as const,
            };
        }

        const newMember = await saveMember(memberToSave);

        // Return member without password
        const { password: _, ...safeMember } = newMember;
        return NextResponse.json(safeMember);
    } catch (error) {
        console.error('Signup API Error:', error);
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}
