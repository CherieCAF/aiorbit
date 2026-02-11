'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Target,
    Trophy,
    Pause,
    Play,
    CheckCircle2,
    Pencil,
    Trash2,
    Link2,
    Calendar,
    ChevronDown,
    ChevronUp,
    Wrench,
    ListChecks,
    X,
    Square,
    CheckSquare,
} from 'lucide-react';
import type { Goal, GoalCategory, Tool, Milestone } from '@/lib/db';
import Modal from '@/components/Modal';
import { useToast } from '@/components/ToastProvider';
import styles from './page.module.css';

const CATEGORIES: { value: GoalCategory; label: string; color: string }[] = [
    { value: 'Career', label: 'Career', color: '#6366f1' },
    { value: 'Learning', label: 'Learning', color: '#3b82f6' },
    { value: 'Project', label: 'Project', color: '#22c55e' },
    { value: 'Financial', label: 'Financial', color: '#f59e0b' },
    { value: 'Health', label: 'Health', color: '#ec4899' },
    { value: 'Other', label: 'Other', color: '#64748b' },
];

interface GoalFormData {
    title: string;
    description: string;
    category: GoalCategory;
    targetDate: string;
    linkedToolIds: string[];
    milestones: Milestone[];
}

const emptyForm: GoalFormData = {
    title: '',
    description: '',
    category: 'Project',
    targetDate: '',
    linkedToolIds: [],
    milestones: [],
};

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [formData, setFormData] = useState<GoalFormData>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const { addToast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            const [goalsRes, toolsRes] = await Promise.all([
                fetch('/api/goals'),
                fetch('/api/tools'),
            ]);
            const goalsData = await goalsRes.json();
            const toolsData = await toolsRes.json();
            if (Array.isArray(goalsData)) setGoals(goalsData);
            if (Array.isArray(toolsData)) setTools(toolsData);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredGoals = goals.filter((g) =>
        filterStatus === 'all' || g.status === filterStatus
    );

    const activeCount = goals.filter((g) => g.status === 'active').length;
    const completedCount = goals.filter((g) => g.status === 'completed').length;

    const openAddModal = () => {
        setEditingGoal(null);
        setFormData(emptyForm);
        setModalOpen(true);
    };

    const openEditModal = (goal: Goal) => {
        setEditingGoal(goal);
        setFormData({
            title: goal.title,
            description: goal.description,
            category: goal.category,
            targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : '',
            linkedToolIds: goal.linkedToolIds,
            milestones: goal.milestones || [],
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title.trim()) return;
        setSaving(true);
        try {
            const milestones = formData.milestones.filter(m => m.title.trim());
            const payload = {
                ...formData,
                milestones,
                targetDate: formData.targetDate ? new Date(formData.targetDate).toISOString() : undefined,
            };
            if (editingGoal) {
                await fetch('/api/goals', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingGoal.id, ...payload }),
                });
            } else {
                await fetch('/api/goals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }
            await fetchData();
            setModalOpen(false);
            addToast(editingGoal ? `${formData.title} updated` : `Goal "${formData.title}" created`);
        } catch (err) {
            console.error('Failed to save goal:', err);
            addToast('Failed to save goal', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this goal?')) return;
        try {
            await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
            await fetchData();
            addToast('Goal deleted');
        } catch (err) {
            console.error('Failed to delete goal:', err);
            addToast('Failed to delete goal', 'error');
        }
    };

    const handleStatusChange = async (goal: Goal, newStatus: 'active' | 'completed' | 'paused') => {
        try {
            await fetch('/api/goals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: goal.id,
                    status: newStatus,
                    progress: newStatus === 'completed' ? 100 : goal.progress,
                }),
            });
            await fetchData();
            const label = newStatus === 'completed' ? '🎉 Goal completed!' : newStatus === 'paused' ? 'Goal paused' : 'Goal resumed';
            addToast(label, newStatus === 'completed' ? 'success' : 'info');
        } catch (err) {
            console.error('Failed to update status:', err);
            addToast('Failed to update goal', 'error');
        }
    };

    const handleProgressChange = async (goal: Goal, progress: number) => {
        try {
            await fetch('/api/goals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: goal.id,
                    progress,
                    status: progress >= 100 ? 'completed' : goal.status,
                }),
            });
            await fetchData();
        } catch (err) {
            console.error('Failed to update progress:', err);
        }
    };

    const toggleToolLink = (toolId: string) => {
        setFormData((prev) => ({
            ...prev,
            linkedToolIds: prev.linkedToolIds.includes(toolId)
                ? prev.linkedToolIds.filter((id) => id !== toolId)
                : [...prev.linkedToolIds, toolId],
        }));
    };

    // Milestone helpers
    const addMilestone = () => {
        const id = `ms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setFormData(prev => ({
            ...prev,
            milestones: [...prev.milestones, { id, title: '', done: false }],
        }));
    };

    const updateMilestoneTitle = (id: string, title: string) => {
        setFormData(prev => ({
            ...prev,
            milestones: prev.milestones.map(m => m.id === id ? { ...m, title } : m),
        }));
    };

    const removeMilestone = (id: string) => {
        setFormData(prev => ({
            ...prev,
            milestones: prev.milestones.filter(m => m.id !== id),
        }));
    };

    const handleMilestoneToggle = async (goal: Goal, milestoneId: string) => {
        const milestones = (goal.milestones || []).map(m =>
            m.id === milestoneId ? { ...m, done: !m.done } : m
        );
        const doneCount = milestones.filter(m => m.done).length;
        const progress = milestones.length > 0 ? Math.round((doneCount / milestones.length) * 100) : goal.progress;
        try {
            await fetch('/api/goals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: goal.id, milestones, progress, status: progress >= 100 ? 'completed' : goal.status }),
            });
            await fetchData();
            if (progress >= 100) addToast('\ud83c\udf89 All milestones complete!', 'success');
        } catch (err) {
            console.error('Failed to toggle milestone:', err);
        }
    };

    const getCategoryColor = (cat: string) =>
        CATEGORIES.find((c) => c.value === cat)?.color || '#64748b';

    const getLinkedTools = (toolIds: string[]) =>
        tools.filter((t) => toolIds.includes(t.id));

    return (
        <div className={styles.goalsPage}>
            {/* Header */}
            <div className="page-header animate-fade-in">
                <h1>Goals</h1>
                <p>
                    {goals.length} goal{goals.length !== 1 ? 's' : ''}
                    {activeCount > 0 && ` · ${activeCount} active`}
                    {completedCount > 0 && ` · ${completedCount} completed`}
                </p>
            </div>

            {/* Toolbar */}
            <div className={`${styles.toolbar} animate-fade-in stagger-1`}>
                <div className={styles.statusFilter}>
                    {['all', 'active', 'completed', 'paused'].map((s) => (
                        <button
                            key={s}
                            className={`${styles.filterBtn} ${filterStatus === s ? styles.filterActive : ''}`}
                            onClick={() => setFilterStatus(s)}
                        >
                            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <Plus size={16} />
                    Set Goal
                </button>
            </div>

            {/* Goals List */}
            {loading ? (
                <div className={styles.loadingList}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={`card ${styles.skeleton}`} />
                    ))}
                </div>
            ) : filteredGoals.length > 0 ? (
                <div className={styles.goalsList}>
                    {filteredGoals.map((goal, i) => {
                        const color = getCategoryColor(goal.category);
                        const linked = getLinkedTools(goal.linkedToolIds);
                        const isExpanded = expandedGoal === goal.id;

                        return (
                            <div
                                key={goal.id}
                                className={`card ${styles.goalCard} animate-fade-in stagger-${Math.min(i + 1, 4)}`}
                            >
                                <div className={styles.goalAccent} style={{ background: color }} />

                                {/* Main row */}
                                <div className={styles.goalMain}>
                                    <button
                                        className={styles.statusBtn}
                                        onClick={() =>
                                            handleStatusChange(
                                                goal,
                                                goal.status === 'completed' ? 'active' : 'completed'
                                            )
                                        }
                                        title={goal.status === 'completed' ? 'Mark as active' : 'Mark as completed'}
                                    >
                                        <CheckCircle2
                                            size={22}
                                            style={{
                                                color: goal.status === 'completed' ? 'var(--color-success)' : 'var(--text-tertiary)',
                                            }}
                                            fill={goal.status === 'completed' ? 'var(--color-success)' : 'none'}
                                        />
                                    </button>

                                    <div className={styles.goalInfo}>
                                        <div className={styles.goalTitleRow}>
                                            <h3
                                                className={styles.goalTitle}
                                                style={{
                                                    textDecoration: goal.status === 'completed' ? 'line-through' : 'none',
                                                    opacity: goal.status === 'completed' ? 0.6 : 1,
                                                }}
                                            >
                                                {goal.title}
                                            </h3>
                                            <span className="badge" style={{ background: `${color}18`, color }}>
                                                {goal.category}
                                            </span>
                                            {goal.status === 'paused' && (
                                                <span className="badge badge-warning">Paused</span>
                                            )}
                                        </div>

                                        {/* Progress bar */}
                                        <div className={styles.progressRow}>
                                            <div className={styles.progressBar}>
                                                <div
                                                    className={styles.progressFill}
                                                    style={{
                                                        width: `${goal.progress}%`,
                                                        background: goal.progress >= 100
                                                            ? 'var(--color-success)'
                                                            : color,
                                                    }}
                                                />
                                            </div>
                                            <span className={styles.progressLabel}>{goal.progress}%</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className={styles.goalActions}>
                                        {linked.length > 0 && (
                                            <span className={styles.linkedCount} title={`${linked.length} linked tool(s)`}>
                                                <Link2 size={14} /> {linked.length}
                                            </span>
                                        )}
                                        {goal.targetDate && (
                                            <span className={styles.targetDate} title="Target date">
                                                <Calendar size={14} />
                                                {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                        <button className={styles.expandBtn} onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}>
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className={styles.goalDetails}>
                                        {goal.description && (
                                            <p className={styles.goalDesc}>{goal.description}</p>
                                        )}

                                        {/* Progress Slider */}
                                        <div className={styles.progressControl}>
                                            <label>Progress</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="5"
                                                value={goal.progress}
                                                onChange={(e) => handleProgressChange(goal, parseInt(e.target.value))}
                                                className={styles.slider}
                                                style={{ accentColor: color }}
                                            />
                                        </div>

                                        {/* Milestones */}
                                        {goal.milestones && goal.milestones.length > 0 && (
                                            <div className={styles.milestonesSection}>
                                                <label><ListChecks size={14} /> Milestones ({goal.milestones.filter(m => m.done).length}/{goal.milestones.length})</label>
                                                <div className={styles.milestoneList}>
                                                    {goal.milestones.map(ms => (
                                                        <button
                                                            key={ms.id}
                                                            className={`${styles.milestoneItem} ${ms.done ? styles.milestoneDone : ''}`}
                                                            onClick={() => handleMilestoneToggle(goal, ms.id)}
                                                        >
                                                            {ms.done ? <CheckSquare size={16} /> : <Square size={16} />}
                                                            <span>{ms.title}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Linked Tools */}
                                        {linked.length > 0 && (
                                            <div className={styles.linkedTools}>
                                                <label><Link2 size={14} /> Linked Tools</label>
                                                <div className={styles.linkedToolsList}>
                                                    {linked.map((tool) => (
                                                        <span key={tool.id} className={styles.linkedToolBadge}>
                                                            <Wrench size={12} /> {tool.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Detail Actions */}
                                        <div className={styles.detailActions}>
                                            <button className="btn btn-ghost" onClick={() => handleStatusChange(goal, goal.status === 'paused' ? 'active' : 'paused')}>
                                                {goal.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
                                                {goal.status === 'paused' ? 'Resume' : 'Pause'}
                                            </button>
                                            <button className="btn btn-ghost" onClick={() => openEditModal(goal)}>
                                                <Pencil size={14} /> Edit
                                            </button>
                                            <button className={`btn btn-ghost ${styles.deleteAction}`} onClick={() => handleDelete(goal.id)}>
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Target size={28} />
                        </div>
                        <h3>{filterStatus !== 'all' ? 'No goals match this filter' : 'No goals set yet'}</h3>
                        <p>
                            {filterStatus !== 'all'
                                ? 'Try viewing all goals.'
                                : 'Set your first goal and link AI tools to track how they help you achieve it.'}
                        </p>
                        {filterStatus === 'all' && (
                            <button className="btn btn-primary" onClick={openAddModal}>
                                <Plus size={16} />
                                Set Your First Goal
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingGoal ? 'Edit Goal' : 'Set a Goal'}
                size="md"
            >
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Goal Title *</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="e.g. Learn to build AI agents, Launch my SaaS..."
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
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as GoalCategory })}
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Target Date</label>
                            <input
                                type="date"
                                className={styles.input}
                                value={formData.targetDate}
                                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Description</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="What does success look like for this goal?"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Milestones in Form */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <ListChecks size={14} /> Milestones
                        </label>
                        <p className={styles.labelHint}>Break this goal into smaller steps</p>
                        <div className={styles.milestoneFormList}>
                            {formData.milestones.map(ms => (
                                <div key={ms.id} className={styles.milestoneFormRow}>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="e.g. Complete first draft..."
                                        value={ms.title}
                                        onChange={(e) => updateMilestoneTitle(ms.id, e.target.value)}
                                    />
                                    <button type="button" className={styles.removeMilestoneBtn} onClick={() => removeMilestone(ms.id)}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" className="btn btn-ghost" onClick={addMilestone}>
                                <Plus size={14} /> Add milestone
                            </button>
                        </div>
                    </div>

                    {/* Link Tools */}
                    {tools.length > 0 && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                <Link2 size={14} /> Link AI Tools
                            </label>
                            <p className={styles.labelHint}>Which tools help you with this goal?</p>
                            <div className={styles.toolPicker}>
                                {tools.map((tool) => {
                                    const isLinked = formData.linkedToolIds.includes(tool.id);
                                    return (
                                        <button
                                            key={tool.id}
                                            type="button"
                                            className={`${styles.toolPickerItem} ${isLinked ? styles.toolPickerActive : ''}`}
                                            onClick={() => toggleToolLink(tool.id)}
                                        >
                                            <Wrench size={14} />
                                            {tool.name}
                                            {isLinked && <CheckCircle2 size={14} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className={styles.formActions}>
                        <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={!formData.title.trim() || saving}
                        >
                            {saving ? 'Saving...' : editingGoal ? 'Save Changes' : 'Set Goal'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
