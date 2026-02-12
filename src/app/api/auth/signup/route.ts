import { NextRequest, NextResponse } from 'next/server';
import { getMemberByEmail, saveMember } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { name, email, password, department } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
        }

        const existing = await getMemberByEmail(email);
        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
        }

        const newMember = await saveMember({
            name,
            email,
            password,
            department: department || 'General',
            role: 'member',
            aiBudget: 100, // Default signup budget
        });

        // Return member without password
        const { password: _, ...safeMember } = newMember;
        return NextResponse.json(safeMember);
    } catch (error) {
        console.error('Signup API Error:', error);
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}
