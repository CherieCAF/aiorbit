import fs from 'fs/promises';
import path from 'path';

// ---- Types ----

export interface Tool {
    id: string;
    name: string;
    category: ToolCategory;
    url: string;
    monthlyCost: number;
    dataAccess: 'none' | 'limited' | 'full';
    status: 'active' | 'paused' | 'trial';
    purpose: string;
    ownerId: string;    // ID of the member who owns this account
    lastCertifiedAt?: string; // Last time the owner confirmed usage
    addedAt: string;
    updatedAt: string;
}

export interface Member {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'member';
    department: string;
    avatar?: string;
    aiBudget: number;
    password?: string; // Simulated password (hashed in real world)
    joinedAt: string;
}

export interface Invoice {
    id: string;
    toolId: string;
    memberId: string;
    amount: number;
    currency: string;
    billingDate: string;
    status: 'received' | 'missing' | 'flagged';
    evidenceUrl?: string; // Link to PDF or image
    transactionId?: string; // Link to the raw bank transaction
    extractedData?: any;  // JSON from LLM parser
    createdAt: string;
}

export interface Transaction {
    id: string;
    date: string;
    amount: number;
    currency: string;
    merchant: string;
    memberId?: string; // If card is assigned to a specific user
    status: 'matched' | 'unclaimed' | 'ambiguous';
    matchedInvoiceId?: string;
}

export interface Milestone {
    id: string;
    title: string;
    done: boolean;
}

export interface Goal {
    id: string;
    title: string;
    description: string;
    category: GoalCategory;
    status: 'active' | 'completed' | 'paused';
    progress: number; // 0-100
    linkedToolIds: string[];
    milestones?: Milestone[];
    createdAt: string;
    updatedAt: string;
    targetDate?: string;
}

export interface Decision {
    id: string;
    title: string;
    context: string;
    options: string[];
    chosenOption: string;
    aiToolsUsed: string[];
    outcome?: string;
    outcomeStatus?: 'positive' | 'neutral' | 'negative' | 'pending';
    category: DecisionCategory;
    createdAt: string;
    updatedAt: string;
}

export interface LearningItem {
    id: string;
    title: string;
    description: string;
    url?: string;
    category: string;
    tags: string[];
    isRead: boolean;
    isBookmarked: boolean;
    createdAt: string;
}

export type DirectoryCategory =
    | 'Writing'
    | 'Code'
    | 'Image'
    | 'Video'
    | 'Audio'
    | 'Productivity'
    | 'Research'
    | 'Chatbot'
    | 'Data'
    | 'Marketing'
    | 'Design'
    | 'Other';

export interface PricingTier {
    name: string;       // e.g. "Free", "Pro", "Enterprise"
    price: string;      // e.g. "$0", "$20/mo", "Custom"
    features: string;   // brief feature summary
}

export interface DirectoryTool {
    id: string;
    name: string;
    description: string;
    category: DirectoryCategory;
    url: string;
    logo?: string;
    pricing: PricingTier[];
    rating: number;    // 1-5
    highlight?: string; // e.g. "Best for beginners"
    addedAt: string;
    updatedAt: string;
}

export type ToolCategory =
    | 'Productivity'
    | 'Creative'
    | 'Code'
    | 'Research'
    | 'Communication'
    | 'Analytics'
    | 'Writing'
    | 'Other';

export type GoalCategory =
    | 'Career'
    | 'Learning'
    | 'Project'
    | 'Financial'
    | 'Health'
    | 'Other';

export type DecisionCategory =
    | 'Business'
    | 'Career'
    | 'Technology'
    | 'Financial'
    | 'Personal'
    | 'Other';

// ---- Database ----

interface Database {
    tools: Tool[];
    goals: Goal[];
    decisions: Decision[];
    learning: LearningItem[];
    directory: DirectoryTool[];
    members: Member[];
    invoices: Invoice[];
    transactions: Transaction[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const DEFAULT_DB: Database = {
    tools: [],
    goals: [],
    decisions: [],
    learning: [],
    directory: [],
    members: [],
    invoices: [],
    transactions: [],
};

async function ensureDbExists(): Promise<void> {
    try {
        await fs.access(DB_PATH);
    } catch {
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        await fs.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
    }
}

async function readDb(): Promise<Database> {
    await ensureDbExists();
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

async function writeDb(db: Database): Promise<void> {
    await ensureDbExists();
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

/** @internal DO NOT USE in production. Only for seeding/testing. */
export async function experimental_overwriteDb(db: any): Promise<void> {
    await writeDb(db);
}

// ---- UUID Helper ----

export function generateId(): string {
    return crypto.randomUUID();
}

// ---- Tool Operations ----

export async function getTools(): Promise<Tool[]> {
    const db = await readDb();
    return db.tools;
}

export async function getTool(id: string): Promise<Tool | undefined> {
    const db = await readDb();
    return db.tools.find((t) => t.id === id);
}

export async function createTool(tool: Omit<Tool, 'id' | 'addedAt' | 'updatedAt'>): Promise<Tool> {
    const db = await readDb();
    const now = new Date().toISOString();
    const newTool: Tool = {
        ...tool,
        id: generateId(),
        lastCertifiedAt: now,
        addedAt: now,
        updatedAt: now,
    };
    db.tools.push(newTool);
    await writeDb(db);
    return newTool;
}

export async function updateTool(id: string, updates: Partial<Omit<Tool, 'id' | 'addedAt'>>): Promise<Tool | null> {
    const db = await readDb();
    const index = db.tools.findIndex((t) => t.id === id);
    if (index === -1) return null;
    db.tools[index] = {
        ...db.tools[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    await writeDb(db);
    return db.tools[index];
}
export async function deleteTool(id: string): Promise<boolean> {
    const db = await readDb();
    const index = db.tools.findIndex((t) => t.id === id);
    if (index === -1) return false;
    db.tools.splice(index, 1);
    await writeDb(db);
    return true;
}

export async function certifyTool(id: string): Promise<Tool | null> {
    const db = await readDb();
    const index = db.tools.findIndex((t) => t.id === id);
    if (index === -1) return null;
    db.tools[index] = {
        ...db.tools[index],
        lastCertifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    await writeDb(db);
    return db.tools[index];
}

// ---- Goal Operations ----

export async function getGoals(): Promise<Goal[]> {
    const db = await readDb();
    return db.goals;
}

export async function createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const db = await readDb();
    const now = new Date().toISOString();
    const newGoal: Goal = {
        ...goal,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
    };
    db.goals.push(newGoal);
    await writeDb(db);
    return newGoal;
}

export async function updateGoal(id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>): Promise<Goal | null> {
    const db = await readDb();
    const index = db.goals.findIndex((g) => g.id === id);
    if (index === -1) return null;
    db.goals[index] = {
        ...db.goals[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    await writeDb(db);
    return db.goals[index];
}

export async function deleteGoal(id: string): Promise<boolean> {
    const db = await readDb();
    const index = db.goals.findIndex((g) => g.id === id);
    if (index === -1) return false;
    db.goals.splice(index, 1);
    await writeDb(db);
    return true;
}

// ---- Decision Operations ----

export async function getDecisions(): Promise<Decision[]> {
    const db = await readDb();
    return db.decisions;
}

export async function createDecision(decision: Omit<Decision, 'id' | 'createdAt' | 'updatedAt'>): Promise<Decision> {
    const db = await readDb();
    const now = new Date().toISOString();
    const newDecision: Decision = {
        ...decision,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
    };
    db.decisions.push(newDecision);
    await writeDb(db);
    return newDecision;
}

export async function updateDecision(id: string, updates: Partial<Omit<Decision, 'id' | 'createdAt'>>): Promise<Decision | null> {
    const db = await readDb();
    const index = db.decisions.findIndex((d) => d.id === id);
    if (index === -1) return null;
    db.decisions[index] = {
        ...db.decisions[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    await writeDb(db);
    return db.decisions[index];
}

export async function deleteDecision(id: string): Promise<boolean> {
    const db = await readDb();
    const index = db.decisions.findIndex((d) => d.id === id);
    if (index === -1) return false;
    db.decisions.splice(index, 1);
    await writeDb(db);
    return true;
}

// ---- Learning Operations ----

export async function getLearningItems(): Promise<LearningItem[]> {
    const db = await readDb();
    return db.learning;
}

export async function createLearningItem(item: Omit<LearningItem, 'id' | 'createdAt'>): Promise<LearningItem> {
    const db = await readDb();
    const newItem: LearningItem = {
        ...item,
        id: generateId(),
        createdAt: new Date().toISOString(),
    };
    db.learning.push(newItem);
    await writeDb(db);
    return newItem;
}

// ---- Directory Operations ----

export async function getDirectoryTools(): Promise<DirectoryTool[]> {
    const db = await readDb();
    return db.directory || [];
}

export async function saveDirectoryTool(tool: Omit<DirectoryTool, 'id' | 'addedAt' | 'updatedAt'> & { id?: string }): Promise<DirectoryTool> {
    const db = await readDb();
    const now = new Date().toISOString();

    if (tool.id) {
        const index = db.directory.findIndex((t) => t.id === tool.id);
        if (index !== -1) {
            const updated = {
                ...db.directory[index],
                ...tool,
                updatedAt: now,
            } as DirectoryTool;
            db.directory[index] = updated;
            await writeDb(db);
            return updated;
        }
    }

    const newTool: DirectoryTool = {
        ...tool,
        id: generateId(),
        addedAt: now,
        updatedAt: now,
    } as DirectoryTool;

    db.directory = [...(db.directory || []), newTool];
    await writeDb(db);
    return newTool;
}

export async function deleteDirectoryTool(id: string): Promise<void> {
    const db = await readDb();
    db.directory = (db.directory || []).filter((t) => t.id !== id);
    await writeDb(db);
}

export async function seedDirectory(tools: DirectoryTool[]): Promise<void> {
    const db = await readDb();
    // Only seed if empty or if we want to force refresh (for now just if empty)
    if (!db.directory || db.directory.length === 0) {
        db.directory = tools;
        await writeDb(db);
    }
}

// ---- Member Operations ----

export async function getMembers(): Promise<Member[]> {
    const db = await readDb();
    return db.members || [];
}

export async function getMemberByEmail(email: string): Promise<Member | undefined> {
    const db = await readDb();
    return (db.members || []).find(m => m.email.toLowerCase() === email.toLowerCase());
}

export async function saveMember(member: Omit<Member, 'id' | 'joinedAt'> & { id?: string }): Promise<Member> {
    const db = await readDb();
    const now = new Date().toISOString();

    if (member.id) {
        const index = db.members.findIndex((m) => m.id === member.id);
        if (index !== -1) {
            const updated = { ...db.members[index], ...member } as Member;
            db.members[index] = updated;
            await writeDb(db);
            return updated;
        }
    }

    const newMember: Member = {
        ...member,
        id: generateId(),
        joinedAt: now,
    };
    db.members = [...(db.members || []), newMember];
    await writeDb(db);
    return newMember;
}

export async function bulkSaveMembers(newMembers: Omit<Member, 'id' | 'joinedAt'>[]): Promise<Member[]> {
    const db = await readDb();
    const now = new Date().toISOString();

    const membersToSave: Member[] = newMembers.map(m => ({
        ...m,
        id: generateId(),
        joinedAt: now
    }));

    db.members = [...(db.members || []), ...membersToSave];
    await writeDb(db);
    return membersToSave;
}

// ---- Invoice Operations ----

export async function getInvoices(): Promise<Invoice[]> {
    const db = await readDb();
    return db.invoices || [];
}

export async function logInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> {
    const db = await readDb();
    const newInvoice: Invoice = {
        ...invoice,
        id: generateId(),
        createdAt: new Date().toISOString(),
    };
    db.invoices = [...(db.invoices || []), newInvoice];
    await writeDb(db);
    return newInvoice;
}

// ---- Seed Admin ----
export async function ensureAdmin(): Promise<Member> {
    const members = await getMembers();
    if (members.length === 0) {
        return await saveMember({
            name: 'Company Admin',
            email: 'admin@company.com',
            role: 'admin',
            department: 'Operations',
            aiBudget: 500,
        });
    }
    return members[0];
}

// ---- Transaction Operations ----

export async function getTransactions(): Promise<Transaction[]> {
    const db = await readDb();
    return db.transactions || [];
}

export async function saveTransaction(tx: Omit<Transaction, 'id'> & { id?: string }): Promise<Transaction> {
    const db = await readDb();
    if (tx.id) {
        const index = db.transactions.findIndex(t => t.id === tx.id);
        if (index !== -1) {
            db.transactions[index] = { ...db.transactions[index], ...tx } as Transaction;
            await writeDb(db);
            return db.transactions[index];
        }
    }
    const newTx: Transaction = { ...tx, id: generateId() } as Transaction;
    db.transactions = [...(db.transactions || []), newTx];
    await writeDb(db);
    return newTx;
}

// ---- Oversight & Startup Metrics ----

export async function getGovernanceMetrics() {
    const db = await readDb();
    const members = db.members || [];
    const tools = db.tools || [];
    const transactions = db.transactions || [];
    const invoices = db.invoices || [];

    // Monthly Burn (Commitment)
    const monthlyBurn = tools.reduce((acc, t) => acc + (t.status !== 'paused' ? t.monthlyCost : 0), 0);

    // Month-over-Month Trend
    const now = new Date();
    const currentMonthSpend = invoices.filter(i => {
        const d = new Date(i.billingDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((acc, i) => acc + i.amount, 0);

    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthSpend = invoices.filter(i => {
        const d = new Date(i.billingDate);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    }).reduce((acc, i) => acc + i.amount, 0);

    const burnTrend = lastMonthSpend > 0 ? Math.round(((currentMonthSpend - lastMonthSpend) / lastMonthSpend) * 100) : 0;

    // Compliance Score (% of transactions with matched invoices)
    const matchedCount = transactions.filter(tx => tx.status === 'matched').length;
    const governanceScore = transactions.length > 0 ? Math.round((matchedCount / transactions.length) * 100) : 100;

    // Shadow AI (Unclaimed bank charges)
    const shadowAiCount = transactions.filter(tx => tx.status === 'unclaimed').length;

    // Efficiency (Spend per seat)
    const spendPerSeat = members.length > 0 ? Math.round(monthlyBurn / members.length) : 0;

    return {
        monthlyBurn,
        burnTrend,
        governanceScore,
        shadowAiCount,
        spendPerSeat,
        totalMembers: members.length,
        totalTools: tools.length
    };
}

export async function getOversightFeed() {
    const db = await readDb();
    const alerts: any[] = [];

    // Check for high-value unclaimed transactions
    (db.transactions || []).filter(tx => tx.status === 'unclaimed' && tx.amount > 50).forEach(tx => {
        alerts.push({
            id: `alert-${tx.id}`,
            title: `High-value Shadow AI: ${tx.merchant}`,
            type: 'alert',
            meta: `Amount: ${tx.currency} ${tx.amount} · Needs owner`,
            date: tx.date,
            severity: 'high'
        });
    });

    // Check for budget overruns
    (db.members || []).forEach(m => {
        const mInvoices = (db.invoices || []).filter(i => i.memberId === m.id);
        const total = mInvoices.reduce((acc, i) => acc + i.amount, 0);
        if (total > m.aiBudget) {
            alerts.push({
                id: `budget-${m.id}`,
                title: `Budget Overrun: ${m.name}`,
                type: 'budget',
                meta: `Spent ${total} / Budget ${m.aiBudget}`,
                date: new Date().toISOString(),
                severity: 'medium'
            });
        }
    });

    // Check for tools needing recertification (> 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    (db.tools || []).forEach(t => {
        if (t.status === 'active' && (!t.lastCertifiedAt || new Date(t.lastCertifiedAt) < thirtyDaysAgo)) {
            alerts.push({
                id: `certify-${t.id}`,
                title: `Recertification Required: ${t.name}`,
                type: 'alert',
                meta: `Usage not confirmed in 30 days. Contact owner.`,
                date: t.lastCertifiedAt || t.addedAt,
                severity: 'medium'
            });
        }
    });

    return alerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getSpendingInsights() {
    const db = await readDb();
    const members = db.members || [];
    const tools = db.tools || [];
    const invoices = db.invoices || [];

    // By Tool (Top 5)
    const byTool = tools.map(t => {
        const toolInvoices = invoices.filter(i => i.toolId === t.id);
        const actualSpend = toolInvoices.reduce((acc, i) => acc + i.amount, 0);
        return {
            id: t.id,
            name: t.name,
            spend: Math.round(actualSpend),
            commitment: t.status !== 'paused' ? t.monthlyCost : 0,
            category: t.category
        };
    }).sort((a, b) => b.spend - a.spend).slice(0, 5);

    // By Member (Top 5)
    const byMember = members.map(m => {
        const memberInvoices = invoices.filter(i => i.memberId === m.id);
        const total = memberInvoices.reduce((acc, i) => acc + i.amount, 0);
        return {
            id: m.id,
            name: m.name,
            spend: Math.round(total),
            budget: m.aiBudget,
            department: m.department
        };
    }).sort((a, b) => b.spend - a.spend).slice(0, 5);

    return { byTool, byMember };
}

