import { NextRequest, NextResponse } from 'next/server';
import { logInvoice, getTools, getMembers, getTransactions, saveTransaction } from '@/lib/db';

/**
 * MAILROOM API
 * This endpoint simulates receiving a forwarded email or an uploaded PDF.
 * It "parses" the content to identify the tool, user, and amount.
 * In a production environment, this would call an LLM (OpenAI/Anthropic) 
 * to extract structured JSON from raw email text or PDF bytes.
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { rawText, memberEmail, fileName } = body;

        // --- SIMULATED LLM PARSING ENGINE ---
        // In reality, we would send 'rawText' to Claude/GPT-4o
        let toolName = "";
        let amount = 0;
        let currency = "USD";

        const text = (rawText || fileName || "").toLowerCase();

        if (text.includes("cursor")) {
            toolName = "Cursor";
            amount = 20;
        } else if (text.includes("openai") || text.includes("chatgpt")) {
            toolName = "ChatGPT";
            amount = 20;
        } else if (text.includes("midjourney")) {
            toolName = "Midjourney";
            amount = 30;
        } else if (text.includes("claude") || text.includes("anthropic")) {
            toolName = "Claude";
            amount = 20;
        } else {
            // Fallback for demo
            toolName = "Unknown Tool";
            amount = 0;
        }

        // --- MATCHING ---
        const [tools, members, transactions] = await Promise.all([
            getTools(),
            getMembers(),
            getTransactions()
        ]);

        const targetTool = tools.find(t => t.name.toLowerCase().includes(toolName.toLowerCase()));
        const targetMember = members.find(m => m.email === memberEmail) || members[0];

        if (!targetTool) {
            return NextResponse.json({ error: `Tool "${toolName}" not found in registry.` }, { status: 404 });
        }

        // --- RECONCILIATION ENGINE ---
        // Find unclaimed transactions with same amount and merchant
        const match = transactions.find(tx =>
            tx.status === 'unclaimed' &&
            Math.abs(tx.amount - amount) < 0.01 &&
            tx.merchant.toLowerCase().includes(toolName.toLowerCase())
        );

        const invoice = await logInvoice({
            toolId: targetTool.id,
            memberId: targetMember.id,
            amount: amount,
            currency: currency,
            billingDate: new Date().toISOString(),
            status: amount > 0 ? 'received' : 'flagged',
            evidenceUrl: fileName ? `/uploads/${fileName}` : undefined,
            transactionId: match?.id,
            extractedData: {
                confidence: 0.95,
                source: fileName ? "PDF" : "Email",
                rawMatch: toolName,
                matchedWithBank: !!match
            }
        });

        // Update transaction status if matched
        if (match) {
            await saveTransaction({
                ...match,
                status: 'matched',
                matchedInvoiceId: invoice.id
            });
        }

        return NextResponse.json({
            message: match ? "Invoice matched to bank transaction automatically" : "Invoice logged (Awaiting bank sync)",
            invoice,
            reconciled: !!match
        });

    } catch (error) {
        console.error("Mailroom Error:", error);
        return NextResponse.json({ error: 'Mailroom failed to process content' }, { status: 500 });
    }
}
