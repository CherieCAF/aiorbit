import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Export all data
export async function GET() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return new NextResponse(data, {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="aiorbit-export-${new Date().toISOString().split('T')[0]}.json"`,
            },
        });
    } catch {
        return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }
}

// Import data (replace database)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate structure
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        const required = ['tools', 'goals', 'decisions', 'learning'];
        for (const key of required) {
            if (!Array.isArray(body[key])) {
                return NextResponse.json(
                    { error: `Missing or invalid "${key}" array` },
                    { status: 400 }
                );
            }
        }

        await fs.writeFile(DB_PATH, JSON.stringify(body, null, 2));

        return NextResponse.json({
            message: 'Data imported successfully',
            counts: {
                tools: body.tools.length,
                goals: body.goals.length,
                decisions: body.decisions.length,
                learning: body.learning.length,
            },
        });
    } catch {
        return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
    }
}

// Reset database
export async function DELETE() {
    try {
        const emptyDb = { tools: [], goals: [], decisions: [], learning: [] };
        await fs.writeFile(DB_PATH, JSON.stringify(emptyDb, null, 2));
        return NextResponse.json({ message: 'Database reset successfully' });
    } catch {
        return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 });
    }
}
