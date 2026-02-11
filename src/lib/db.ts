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
    addedAt: string;
    updatedAt: string;
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
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const DEFAULT_DB: Database = {
    tools: [],
    goals: [],
    decisions: [],
    learning: [],
    directory: [],
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
