'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    BookOpen,
    Pencil,
    Trash2,
    CheckCircle,
    Circle,
    AlertCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    Wrench,
    ArrowRightLeft,
} from 'lucide-react';
import type { Decision, DecisionCategory, Tool } from '@/lib/db';
import Modal from '@/components/Modal';
import { useToast } from '@/components/ToastProvider';
import styles from './page.module.css';

const CATEGORIES: { value: DecisionCategory; label: string; color: string }[] = [
    { value: 'Business', label: 'Business', color: '#6366f1' },
    { value: 'Career', label: 'Career', color: '#3b82f6' },
    { value: 'Technology', label: 'Technology', color: '#22c55e' },
    { value: 'Financial', label: 'Financial', color: '#f59e0b' },
    { value: 'Personal', label: 'Personal', color: '#ec4899' },
    { value: 'Other', label: 'Other', color: '#64748b' },
];

const OUTCOME_STATUSES = [
    { value: 'pending', label: 'Pending', icon: Clock, color: 'var(--text-tertiary)' },
    { value: 'positive', label: 'Positive', icon: CheckCircle, color: 'var(--color-success)' },
    { value: 'neutral', label: 'Neutral', icon: Circle, color: 'var(--color-warning)' },
    { value: 'negative', label: 'Negative', icon: AlertCircle, color: 'var(--color-danger)' },
];

interface DecisionFormData {
    title: string;
    context: string;
    options: string[];
    chosenOption: string;
    aiToolsUsed: string[];
    outcome: string;
    outcomeStatus: 'positive' | 'neutral' | 'negative' | 'pending';
    category: DecisionCategory;
}

const emptyForm: DecisionFormData = {
    title: '',
    context: '',
    options: ['', ''],
    chosenOption: '',
    aiToolsUsed: [],
    outcome: '',
    outcomeStatus: 'pending',
    category: 'Business',
};

export default function DecisionsPage() {
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
    const [formData, setFormData] = useState<DecisionFormData>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const { addToast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            const [decisionsRes, toolsRes] = await Promise.all([
                fetch('/api/decisions'),
                fetch('/api/tools'),
            ]);
            const decisionsData = await decisionsRes.json();
            const toolsData = await toolsRes.json();
            if (Array.isArray(decisionsData)) setDecisions(decisionsData);
            if (Array.isArray(toolsData)) setTools(toolsData);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredDecisions = decisions
        .filter((d) => filterCategory === 'all' || d.category === filterCategory)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const openAddModal = () => {
        setEditingDecision(null);
        setFormData(emptyForm);
        setModalOpen(true);
    };

    const openEditModal = (decision: Decision) => {
        setEditingDecision(decision);
        setFormData({
            title: decision.title,
            context: decision.context,
            options: decision.options.length > 0 ? decision.options : ['', ''],
            chosenOption: decision.chosenOption,
            aiToolsUsed: decision.aiToolsUsed,
            outcome: decision.outcome || '',
            outcomeStatus: decision.outcomeStatus || 'pending',
            category: decision.category,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title.trim()) return;
        setSaving(true);
        try {
            const payload = {
                ...formData,
                options: formData.options.filter((o) => o.trim()),
            };
            if (editingDecision) {
                await fetch('/api/decisions', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingDecision.id, ...payload }),
                });
            } else {
                await fetch('/api/decisions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }
            await fetchData();
            setModalOpen(false);
            addToast(editingDecision ? `Decision updated` : `Decision logged`);
        } catch (err) {
            console.error('Failed to save decision:', err);
            addToast('Failed to save decision', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this decision entry?')) return;
        try {
            await fetch(`/api/decisions?id=${id}`, { method: 'DELETE' });
            await fetchData();
            addToast('Decision removed');
        } catch (err) {
            console.error('Failed to delete decision:', err);
            addToast('Failed to delete decision', 'error');
        }
    };

    const handleOutcomeUpdate = async (decision: Decision, outcomeStatus: string) => {
        try {
            await fetch('/api/decisions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: decision.id, outcomeStatus }),
            });
            await fetchData();
            addToast(`Outcome marked as ${outcomeStatus}`);
        } catch (err) {
            console.error('Failed to update outcome:', err);
            addToast('Failed to update outcome', 'error');
        }
    };

    const addOption = () => {
        setFormData({ ...formData, options: [...formData.options, ''] });
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const removeOption = (index: number) => {
        if (formData.options.length <= 2) return;
        const newOptions = formData.options.filter((_, i) => i !== index);
        setFormData({ ...formData, options: newOptions });
    };

    const toggleToolUsed = (toolId: string) => {
        setFormData((prev) => ({
            ...prev,
            aiToolsUsed: prev.aiToolsUsed.includes(toolId)
                ? prev.aiToolsUsed.filter((id) => id !== toolId)
                : [...prev.aiToolsUsed, toolId],
        }));
    };

    const getCategoryColor = (cat: string) =>
        CATEGORIES.find((c) => c.value === cat)?.color || '#64748b';

    const getOutcomeInfo = (status: string) =>
        OUTCOME_STATUSES.find((s) => s.value === status) || OUTCOME_STATUSES[0];

    const getToolName = (id: string) => tools.find((t) => t.id === id)?.name || 'Unknown';

    return (
        <div className={styles.decisionsPage}>
            {/* Header */}
            <div className="page-header animate-fade-in">
                <h1>Decision Journal</h1>
                <p>{decisions.length} decision{decisions.length !== 1 ? 's' : ''} logged</p>
            </div>

            {/* Toolbar */}
            <div className={`${styles.toolbar} animate-fade-in stagger-1`}>
                <div className={styles.categoryFilter}>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Categories</option>
                        {CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <Plus size={16} />
                    Log Decision
                </button>
            </div>

            {/* Timeline */}
            {loading ? (
                <div className={styles.loadingList}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={`card ${styles.skeleton}`} />
                    ))}
                </div>
            ) : filteredDecisions.length > 0 ? (
                <div className={styles.timeline}>
                    {filteredDecisions.map((decision, i) => {
                        const color = getCategoryColor(decision.category);
                        const outcome = getOutcomeInfo(decision.outcomeStatus || 'pending');
                        const OutcomeIcon = outcome.icon;
                        const isExpanded = expandedId === decision.id;
                        const usedTools = decision.aiToolsUsed.map(getToolName).filter((n) => n !== 'Unknown');

                        return (
                            <div key={decision.id} className={`${styles.timelineItem} animate-fade-in stagger-${Math.min(i + 1, 4)}`}>
                                <div className={styles.timelineDot} style={{ background: color }} />
                                <div className={`card ${styles.decisionCard}`}>
                                    <div className={styles.decisionMain}>
                                        <div className={styles.decisionInfo}>
                                            <div className={styles.decisionTitleRow}>
                                                <h3 className={styles.decisionTitle}>{decision.title}</h3>
                                                <span className="badge" style={{ background: `${color}18`, color }}>
                                                    {decision.category}
                                                </span>
                                                <span className={styles.outcomeBadge} style={{ color: outcome.color }}>
                                                    <OutcomeIcon size={14} />
                                                    {outcome.label}
                                                </span>
                                            </div>
                                            <div className={styles.decisionMeta}>
                                                <span>{new Date(decision.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                {usedTools.length > 0 && (
                                                    <span className={styles.toolsUsed}>
                                                        <Wrench size={12} /> {usedTools.join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button className={styles.expandBtn} onClick={() => setExpandedId(isExpanded ? null : decision.id)}>
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className={styles.decisionDetails}>
                                            {decision.context && (
                                                <div className={styles.detailSection}>
                                                    <label>Context</label>
                                                    <p>{decision.context}</p>
                                                </div>
                                            )}

                                            {decision.options.length > 0 && (
                                                <div className={styles.detailSection}>
                                                    <label><ArrowRightLeft size={14} /> Options Considered</label>
                                                    <div className={styles.optionsList}>
                                                        {decision.options.map((opt, j) => (
                                                            <div
                                                                key={j}
                                                                className={`${styles.optionItem} ${opt === decision.chosenOption ? styles.chosenOption : ''}`}
                                                            >
                                                                {opt === decision.chosenOption && <CheckCircle size={14} />}
                                                                {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {decision.outcome && (
                                                <div className={styles.detailSection}>
                                                    <label>Outcome</label>
                                                    <p>{decision.outcome}</p>
                                                </div>
                                            )}

                                            {/* Outcome Status Buttons */}
                                            <div className={styles.detailSection}>
                                                <label>How did it go?</label>
                                                <div className={styles.outcomeButtons}>
                                                    {OUTCOME_STATUSES.map((s) => (
                                                        <button
                                                            key={s.value}
                                                            className={`${styles.outcomeBtn} ${decision.outcomeStatus === s.value ? styles.outcomeActive : ''}`}
                                                            style={{ '--btn-color': s.color } as React.CSSProperties}
                                                            onClick={() => handleOutcomeUpdate(decision, s.value)}
                                                        >
                                                            <s.icon size={14} /> {s.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className={styles.detailActions}>
                                                <button className="btn btn-ghost" onClick={() => openEditModal(decision)}>
                                                    <Pencil size={14} /> Edit
                                                </button>
                                                <button className={`btn btn-ghost ${styles.deleteAction}`} onClick={() => handleDelete(decision.id)}>
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">
                            <BookOpen size={28} />
                        </div>
                        <h3>{filterCategory !== 'all' ? 'No decisions in this category' : 'No decisions logged yet'}</h3>
                        <p>
                            {filterCategory !== 'all'
                                ? 'Try viewing all categories.'
                                : 'Log your first decision to start building your decision history. Track what works, what doesn\'t, and which AI tools help the most.'}
                        </p>
                        {filterCategory === 'all' && (
                            <button className="btn btn-primary" onClick={openAddModal}>
                                <Plus size={16} />
                                Log Your First Decision
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingDecision ? 'Edit Decision' : 'Log a Decision'}
                size="lg"
            >
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Decision Title *</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="e.g. Chose Next.js over Vite for the project..."
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            autoFocus
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category *</label>
                            <select
                                className={styles.select}
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as DecisionCategory })}
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Outcome Status</label>
                            <select
                                className={styles.select}
                                value={formData.outcomeStatus}
                                onChange={(e) => setFormData({ ...formData, outcomeStatus: e.target.value as DecisionFormData['outcomeStatus'] })}
                            >
                                {OUTCOME_STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Context</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="What was the situation? What factors were at play?"
                            rows={3}
                            value={formData.context}
                            onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                        />
                    </div>

                    {/* Options */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}><ArrowRightLeft size={14} /> Options Considered</label>
                        <div className={styles.optionsForm}>
                            {formData.options.map((opt, i) => (
                                <div key={i} className={styles.optionInputRow}>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder={`Option ${i + 1}`}
                                        value={opt}
                                        onChange={(e) => updateOption(i, e.target.value)}
                                    />
                                    {formData.options.length > 2 && (
                                        <button className={styles.removeOptionBtn} onClick={() => removeOption(i)}>×</button>
                                    )}
                                </div>
                            ))}
                            <button className="btn btn-ghost" onClick={addOption}>
                                <Plus size={14} /> Add option
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>What did you choose?</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="The option you went with"
                            value={formData.chosenOption}
                            onChange={(e) => setFormData({ ...formData, chosenOption: e.target.value })}
                        />
                    </div>

                    {/* AI Tools Used */}
                    {tools.length > 0 && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}><Wrench size={14} /> AI Tools Used</label>
                            <div className={styles.toolPicker}>
                                {tools.map((tool) => {
                                    const isUsed = formData.aiToolsUsed.includes(tool.id);
                                    return (
                                        <button
                                            key={tool.id}
                                            type="button"
                                            className={`${styles.toolPickerItem} ${isUsed ? styles.toolPickerActive : ''}`}
                                            onClick={() => toggleToolUsed(tool.id)}
                                        >
                                            <Wrench size={14} /> {tool.name}
                                            {isUsed && <CheckCircle size={14} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Outcome / Notes</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="How did this decision turn out? (You can update this later)"
                            rows={2}
                            value={formData.outcome}
                            onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={!formData.title.trim() || saving}
                        >
                            {saving ? 'Saving...' : editingDecision ? 'Save Changes' : 'Log Decision'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
