import { NextRequest, NextResponse } from 'next/server';
import { getMemberByEmail } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const member = await getMemberByEmail(email);

        if (!member) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // Simulating password check (in V1 we just check if it exists or matches if set)
        // In a real app, use bcrypt.compare
        if (member.password && member.password !== password) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // Return member without password for security
        const { password: _, ...safeMember } = member;
        return NextResponse.json(safeMember);
    } catch (error) {
        console.error('Login API Error:', error);
        return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
    }
}
