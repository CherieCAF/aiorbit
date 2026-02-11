'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ExternalLink, Plus, Filter, Star, Wrench, Globe, Pencil, Trash2 } from 'lucide-react';
import { DirectoryTool, DirectoryCategory } from '@/lib/db';
import { useToast } from '@/components/ToastProvider';
import styles from './page.module.css';

const CATEGORIES: DirectoryCategory[] = [
    'Chatbot', 'Writing', 'Code', 'Image', 'Video', 'Audio',
    'Productivity', 'Research', 'Data', 'Marketing', 'Design', 'Other'
];

interface DirectoryFormData {
    name: string;
    description: string;
    category: DirectoryCategory;
    url: string;
    pricing: { name: string; price: string; features: string }[];
    rating: number;
    highlight: string;
}

const emptyForm: DirectoryFormData = {
    name: '',
    description: '',
    category: 'Other',
    url: '',
    pricing: [{ name: 'Free', price: '$0', features: '' }],
    rating: 5,
    highlight: '',
};

export default function DirectoryPage() {
    const [tools, setTools] = useState<DirectoryTool[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<DirectoryCategory | 'All'>('All');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTool, setEditingTool] = useState<DirectoryTool | null>(null);
    const [formData, setFormData] = useState<DirectoryFormData>(emptyForm);
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    const fetchDirectory = useCallback(async () => {
        try {
            const res = await fetch('/api/directory');
            const data = await res.json();
            if (Array.isArray(data)) setTools(data);
        } catch (error) {
            addToast('Failed to load directory', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchDirectory();
    }, [fetchDirectory]);

    const addToRegistry = async (dirTool: DirectoryTool) => {
        try {
            const res = await fetch('/api/tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: dirTool.name,
                    url: dirTool.url,
                    category: 'Other', // Mapping dir category to registry category might be complex, default to Other
                    purpose: dirTool.description,
                    monthlyCost: 0, // Unknown
                    status: 'trial',
                    dataAccess: 'none'
                }),
            });
            if (res.ok) {
                addToast(`${dirTool.name} added to your AI Tool Registry!`, 'success');
            } else {
                throw new Error();
            }
        } catch (error) {
            addToast('Failed to add tool to registry', 'error');
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/directory', {
                method: editingTool ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingTool ? { ...formData, id: editingTool.id } : formData),
            });
            if (res.ok) {
                addToast(editingTool ? 'Tool updated' : 'Tool added to directory', 'success');
                setModalOpen(false);
                fetchDirectory();
            } else {
                throw new Error();
            }
        } catch (err) {
            addToast('Failed to save tool', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete ${name} from directory?`)) return;
        try {
            const res = await fetch(`/api/directory?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                addToast('Tool removed from directory');
                fetchDirectory();
            }
        } catch (error) {
            addToast('Failed to delete tool', 'error');
        }
    };

    const openEditModal = (tool: DirectoryTool) => {
        setEditingTool(tool);
        setFormData({
            name: tool.name,
            description: tool.description,
            category: tool.category,
            url: tool.url,
            pricing: tool.pricing,
            rating: tool.rating,
            highlight: tool.highlight || '',
        });
        setModalOpen(true);
    };

    const openAddModal = () => {
        setEditingTool(null);
        setFormData(emptyForm);
        setModalOpen(true);
    };

    const addPriceTier = () => {
        setFormData(prev => ({
            ...prev,
            pricing: [...prev.pricing, { name: '', price: '', features: '' }]
        }));
    };

    const updatePriceTier = (index: number, field: string, value: string) => {
        const newPricing = [...formData.pricing];
        newPricing[index] = { ...newPricing[index], [field]: value };
        setFormData({ ...formData, pricing: newPricing });
    };

    const removePriceTier = (index: number) => {
        if (formData.pricing.length <= 1) return;
        const newPricing = formData.pricing.filter((_, i) => i !== index);
        setFormData({ ...formData, pricing: newPricing });
    };

    const filteredTools = tools.filter(tool => {
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className={styles.directoryPage}>
            <header className={styles.header}>
                <div className="page-header animate-fade-in">
                    <h1>AI Tools Directory</h1>
                    <p>Discover the best AI tools and services curated by the community.</p>
                </div>

                <div className={`${styles.searchActions} animate-fade-in stagger-1`}>
                    <div className={styles.searchWrapper}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search tools, capabilities..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <Plus size={18} /> Add New Tool
                    </button>
                </div>

                <div className={`${styles.filterBar} animate-fade-in stagger-1`}>
                    <button
                        className={`${styles.filterChip} ${activeCategory === 'All' ? styles.filterActive : ''}`}
                        onClick={() => setActiveCategory('All')}
                    >
                        All Tools
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`${styles.filterChip} ${activeCategory === cat ? styles.filterActive : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className={styles.grid}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={styles.skeletonCard} />
                    ))}
                </div>
            ) : filteredTools.length === 0 ? (
                <div className="empty-state animate-fade-in">
                    <Globe size={48} />
                    <h3>No tools found</h3>
                    <p>Try adjusting your search or filters to find what you&apos;re looking for.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredTools.map((tool, idx) => (
                        <div key={tool.id} className={`${styles.card} card animate-fade-in`} style={{ animationDelay: `${idx * 0.05}s` }}>
                            <div className={styles.cardTop}>
                                <span className={styles.categoryBadge} style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}>
                                    {tool.category}
                                </span>
                                <div className={styles.rating}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} fill={i < tool.rating ? 'currentColor' : 'none'} strokeWidth={2} />
                                    ))}
                                </div>
                            </div>

                            <h3 className={styles.name}>{tool.name}</h3>
                            {tool.highlight && <span className={styles.highlight}>{tool.highlight}</span>}
                            <p className={styles.description}>{tool.description}</p>

                            <div className={styles.pricing}>
                                <span className={styles.pricingHeader}>Pricing tiers</span>
                                <div className={styles.pricingList}>
                                    {tool.pricing.map((tier, i) => (
                                        <div key={i} className={styles.pricingItem}>
                                            <span className={styles.tierName}>{tier.name}</span>
                                            <span className={tier.price.includes('Free') || tier.price === '$0' ? 'badge badge-success' : styles.tierPrice}>
                                                {tier.price}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                <a href={tool.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                                    <ExternalLink size={16} /> Visit Site
                                </a>
                                <button className="btn btn-primary" onClick={() => addToRegistry(tool)}>
                                    <Plus size={16} /> Add to My Registry
                                </button>
                                <div className={styles.adminActions}>
                                    <button className="btn btn-ghost" onClick={() => openEditModal(tool)} title="Edit">
                                        <Pencil size={15} />
                                    </button>
                                    <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(tool.id, tool.name)} title="Delete">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>{editingTool ? 'Edit Directory Tool' : 'Add New Tool to Directory'}</h2>
                            <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className={styles.form}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Tool Name</label>
                                        <input
                                            className={styles.input}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. OpenAI ChatGPT"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Category</label>
                                        <select
                                            className={styles.select}
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value as DirectoryCategory })}
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>URL</label>
                                    <input
                                        className={styles.input}
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Description</label>
                                    <textarea
                                        className={styles.textarea}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        placeholder="Briefly describe what this tool does..."
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Highlight (Optional)</label>
                                        <input
                                            className={styles.input}
                                            value={formData.highlight}
                                            onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
                                            placeholder="e.g. Best for writers"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Rating (1-5)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="5"
                                            className={styles.input}
                                            value={formData.rating}
                                            onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Pricing Tiers</label>
                                    <div className={styles.pricingFormList}>
                                        {formData.pricing.map((tier, i) => (
                                            <div key={i} className={styles.pricingFormRow}>
                                                <input
                                                    className={styles.input}
                                                    style={{ flex: 2 }}
                                                    value={tier.name}
                                                    onChange={(e) => updatePriceTier(i, 'name', e.target.value)}
                                                    placeholder="Tier (e.g. Pro)"
                                                />
                                                <input
                                                    className={styles.input}
                                                    style={{ flex: 1 }}
                                                    value={tier.price}
                                                    onChange={(e) => updatePriceTier(i, 'price', e.target.value)}
                                                    placeholder="Price"
                                                />
                                                <button className="btn btn-ghost" onClick={() => removePriceTier(i)}>&times;</button>
                                            </div>
                                        ))}
                                        <button className="btn btn-ghost btn-sm" onClick={addPriceTier}>
                                            + Add Pricing Tier
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !formData.name}>
                                {saving ? 'Saving...' : editingTool ? 'Save Changes' : 'Add to Directory'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
