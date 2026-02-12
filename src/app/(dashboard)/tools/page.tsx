'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    Filter,
    LayoutGrid,
    List,
    Wrench,
} from 'lucide-react';
import type { Tool, ToolCategory } from '@/lib/db';
import ToolCard from '@/components/tools/ToolCard';
import Modal from '@/components/Modal';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/components/AuthProvider';
import styles from './page.module.css';

const CATEGORIES: ToolCategory[] = [
    'Productivity', 'Creative', 'Code', 'Research',
    'Communication', 'Analytics', 'Writing', 'Other',
];

const DATA_ACCESS_OPTIONS = [
    { value: 'none', label: 'No data access' },
    { value: 'limited', label: 'Limited access' },
    { value: 'full', label: 'Full access' },
];

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'trial', label: 'Trial' },
];

interface ToolFormData {
    name: string;
    category: ToolCategory;
    url: string;
    monthlyCost: number;
    dataAccess: 'none' | 'limited' | 'full';
    status: 'active' | 'paused' | 'trial';
    purpose: string;
}

const emptyForm: ToolFormData = {
    name: '',
    category: 'Productivity',
    url: '',
    monthlyCost: 0,
    dataAccess: 'none',
    status: 'active',
    purpose: '',
};

// Smart data access inference from known tools
const TOOL_DATA_ACCESS: Record<string, 'none' | 'limited' | 'full'> = {
    // Full access — these tools process, store, or learn from your data
    'chatgpt': 'full', 'openai': 'full', 'claude': 'full', 'gemini': 'full',
    'perplexity': 'full', 'copilot': 'full', 'github copilot': 'full',
    'cursor': 'full', 'replit': 'full', 'notion ai': 'full', 'notion': 'full',
    'grammarly': 'full', 'otter': 'full', 'otter.ai': 'full',
    'jasper': 'full', 'copy.ai': 'full', 'writesonic': 'full',
    'zapier': 'full', 'make': 'full', 'pipedream': 'full',
    'reclaim': 'full', 'reclaim.ai': 'full', 'linear': 'full',
    'elicit': 'full', 'notebooklm': 'full', 'notebook lm': 'full',
    'google bard': 'full', 'meta ai': 'full', 'grok': 'full',
    'codeium': 'full', 'tabnine': 'full', 'amazon q': 'full',
    // Limited access — process data but don't store or train on it
    'midjourney': 'limited', 'dall-e': 'limited', 'stable diffusion': 'limited',
    'canva': 'limited', 'canva ai': 'limited', 'figma': 'limited', 'figma ai': 'limited',
    'elevenlabs': 'limited', 'descript': 'limited', 'runway': 'limited',
    'synthesia': 'limited', 'loom': 'limited', 'loom ai': 'limited',
    'v0': 'limited', 'vercel v0': 'limited', 'bolt': 'limited',
    'suno': 'limited', 'udio': 'limited',
    'tableau': 'limited', 'power bi': 'limited',
    // No access — local or privacy-first tools
    'ollama': 'none', 'lm studio': 'none', 'jan': 'none',
    'whisper': 'none', 'stable diffusion local': 'none',
};

function inferDataAccess(name: string): 'none' | 'limited' | 'full' | null {
    const lower = name.toLowerCase().trim();
    if (TOOL_DATA_ACCESS[lower]) return TOOL_DATA_ACCESS[lower];
    // Partial match
    for (const [key, value] of Object.entries(TOOL_DATA_ACCESS)) {
        if (lower.includes(key) || key.includes(lower)) return value;
    }
    return null;
}

export default function ToolsPage() {
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTool, setEditingTool] = useState<Tool | null>(null);
    const [formData, setFormData] = useState<ToolFormData>(emptyForm);
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();
    const { user } = useAuth();

    const fetchTools = useCallback(async () => {
        try {
            const res = await fetch('/api/tools');
            const data = await res.json();
            setTools(data);
        } catch (err) {
            console.error('Failed to fetch tools:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-refresh: initial + 30s interval + window focus
    useEffect(() => {
        fetchTools();
        const interval = setInterval(fetchTools, 30000);
        const onFocus = () => fetchTools();
        window.addEventListener('focus', onFocus);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, [fetchTools]);

    // Filters
    const filteredTools = tools.filter((tool) => {
        const matchesSearch =
            tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.purpose.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || tool.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Modal handlers
    const openAddModal = () => {
        setEditingTool(null);
        setFormData(emptyForm);
        setModalOpen(true);
    };

    const openEditModal = (tool: Tool) => {
        setEditingTool(tool);
        setFormData({
            name: tool.name,
            category: tool.category,
            url: tool.url,
            monthlyCost: tool.monthlyCost,
            dataAccess: tool.dataAccess,
            status: tool.status,
            purpose: tool.purpose,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;
        setSaving(true);
        try {
            if (editingTool) {
                await fetch('/api/tools', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingTool.id, ...formData }),
                });
            } else {
                await fetch('/api/tools', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, ownerId: user?.id }),
                });
            }
            await fetchTools();
            setModalOpen(false);
            addToast(editingTool ? `${formData.name} updated` : `${formData.name} added to your registry`);
        } catch (err) {
            console.error('Failed to save tool:', err);
            addToast('Failed to save tool', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this tool from your registry?')) return;
        try {
            await fetch(`/api/tools?id=${id}`, { method: 'DELETE' });
            await fetchTools();
            addToast('Tool removed from registry');
        } catch (err) {
            console.error('Failed to delete tool:', err);
            addToast('Failed to remove tool', 'error');
        }
    };

    const handleToggleStatus = async (tool: Tool) => {
        const newStatus = tool.status === 'active' ? 'paused' : 'active';
        try {
            await fetch('/api/tools', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: tool.id, status: newStatus }),
            });
            await fetchTools();
            addToast(`${tool.name} ${newStatus === 'active' ? 'activated' : 'paused'}`);
        } catch (err) {
            console.error('Failed to toggle status:', err);
            addToast('Failed to update tool status', 'error');
        }
    };

    const handleCertify = async (id: string) => {
        try {
            await fetch('/api/tools/certify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            await fetchTools();
            addToast('Tool usage confirmed');
        } catch (err) {
            console.error('Failed to certify tool:', err);
            addToast('Failed to confirm usage', 'error');
        }
    };

    // Stats
    const totalSpend = tools.reduce((sum, t) => sum + (t.status !== 'paused' ? t.monthlyCost : 0), 0);
    const activeCount = tools.filter((t) => t.status === 'active').length;

    return (
        <div className={styles.toolsPage}>
            {/* Header */}
            <div className="page-header animate-fade-in">
                <h1>AI Tool Registry</h1>
                <p>
                    {tools.length} tool{tools.length !== 1 ? 's' : ''} registered
                    {totalSpend > 0 && ` · $${totalSpend.toFixed(2)}/mo`}
                    {activeCount > 0 && ` · ${activeCount} active`}
                </p>
            </div>

            {/* Toolbar */}
            <div className={`${styles.toolbar} animate-fade-in stagger-1`}>
                <div className={styles.searchBar}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.toolbarActions}>
                    <div className={styles.filterGroup}>
                        <Filter size={16} />
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Categories</option>
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`}
                            onClick={() => setViewMode('grid')}
                            aria-label="Grid view"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`}
                            onClick={() => setViewMode('list')}
                            aria-label="List view"
                        >
                            <List size={16} />
                        </button>
                    </div>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <Plus size={16} />
                        Add Tool
                    </button>
                </div>
            </div>

            {/* Tool Grid / List */}
            {loading ? (
                <div className={styles.loadingGrid}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className={`card ${styles.skeleton}`} />
                    ))}
                </div>
            ) : filteredTools.length > 0 ? (
                <div className={viewMode === 'grid' ? styles.toolGrid : styles.toolList}>
                    {filteredTools.map((tool, i) => (
                        <div key={tool.id} className={`animate-fade-in stagger-${Math.min(i + 1, 4)}`}>
                            <ToolCard
                                tool={tool}
                                onEdit={openEditModal}
                                onDelete={handleDelete}
                                onToggleStatus={handleToggleStatus}
                                onCertify={handleCertify}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Wrench size={28} />
                        </div>
                        <h3>{searchQuery || filterCategory !== 'all' ? 'No tools match your filters' : 'No AI tools registered yet'}</h3>
                        <p>
                            {searchQuery || filterCategory !== 'all'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Add your first AI tool to start building your personal AI ecosystem map.'}
                        </p>
                        {!searchQuery && filterCategory === 'all' && (
                            <button className="btn btn-primary" onClick={openAddModal}>
                                <Plus size={16} />
                                Add Your First Tool
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingTool ? 'Edit AI Tool' : 'Add AI Tool'}
                size="md"
            >
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Tool Name *</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="e.g. ChatGPT, Cursor, Midjourney..."
                            value={formData.name}
                            onChange={(e) => {
                                const name = e.target.value;
                                const updates: Partial<ToolFormData> = { name };
                                // Auto-detect data access for new tools
                                if (!editingTool) {
                                    const inferred = inferDataAccess(name);
                                    if (inferred) updates.dataAccess = inferred;
                                }
                                setFormData({ ...formData, ...updates });
                            }}
                            autoFocus
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category *</label>
                            <select
                                className={styles.select}
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as ToolCategory })}
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Status</label>
                            <select
                                className={styles.select}
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'paused' | 'trial' })}
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Monthly Cost ($)</label>
                            <input
                                type="number"
                                className={styles.input}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                value={formData.monthlyCost || ''}
                                onChange={(e) => setFormData({ ...formData, monthlyCost: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Data Access
                                {!editingTool && inferDataAccess(formData.name) && (
                                    <span className={styles.autoDetected}>✦ auto-detected</span>
                                )}
                            </label>
                            <select
                                className={styles.select}
                                value={formData.dataAccess}
                                onChange={(e) => setFormData({ ...formData, dataAccess: e.target.value as 'none' | 'limited' | 'full' })}
                            >
                                {DATA_ACCESS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>URL</label>
                        <input
                            type="url"
                            className={styles.input}
                            placeholder="https://..."
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Purpose</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="What do you use this tool for?"
                            rows={3}
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={!formData.name.trim() || saving}
                        >
                            {saving ? 'Saving...' : editingTool ? 'Save Changes' : 'Add Tool'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
