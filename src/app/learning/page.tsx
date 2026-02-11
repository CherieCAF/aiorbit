'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Lightbulb,
    Bookmark,
    BookmarkCheck,
    Check,
    ExternalLink,
    Tag,
    Filter,
} from 'lucide-react';
import type { LearningItem } from '@/lib/db';
import styles from './page.module.css';

export default function LearningPage() {
    const [items, setItems] = useState<LearningItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

    const fetchItems = useCallback(async () => {
        try {
            const res = await fetch('/api/learning');
            const data = await res.json();
            if (Array.isArray(data)) setItems(data);
        } catch (err) {
            console.error('Failed to fetch learning items:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const categories = [...new Set(items.map((i) => i.category))];

    const filteredItems = items.filter((item) => {
        const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
        const matchesBookmark = !showBookmarkedOnly || item.isBookmarked;
        return matchesCategory && matchesBookmark;
    });

    const unreadCount = items.filter((i) => !i.isRead).length;
    const bookmarkedCount = items.filter((i) => i.isBookmarked).length;

    const toggleRead = (item: LearningItem) => {
        setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, isRead: !i.isRead } : i))
        );
    };

    const toggleBookmark = (item: LearningItem) => {
        setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, isBookmarked: !i.isBookmarked } : i))
        );
    };

    const categoryColors: Record<string, string> = {
        Productivity: '#6366f1',
        Skills: '#22c55e',
        Privacy: '#ef4444',
        'Decision-Making': '#f59e0b',
        Goals: '#3b82f6',
        Financial: '#8b5cf6',
        Learning: '#14b8a6',
    };

    const getColor = (cat: string) => categoryColors[cat] || '#64748b';

    return (
        <div className={styles.learningPage}>
            {/* Header */}
            <div className="page-header animate-fade-in">
                <h1>Learning Feed</h1>
                <p>
                    {items.length} item{items.length !== 1 ? 's' : ''}
                    {unreadCount > 0 && ` · ${unreadCount} unread`}
                    {bookmarkedCount > 0 && ` · ${bookmarkedCount} bookmarked`}
                </p>
            </div>

            {/* Toolbar */}
            <div className={`${styles.toolbar} animate-fade-in stagger-1`}>
                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <Filter size={16} />
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Topics</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        className={`${styles.bookmarkFilter} ${showBookmarkedOnly ? styles.bookmarkFilterActive : ''}`}
                        onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
                    >
                        <BookmarkCheck size={16} />
                        Bookmarked
                    </button>
                </div>
            </div>

            {/* Feed */}
            {loading ? (
                <div className={styles.loadingList}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`card ${styles.skeleton}`} />
                    ))}
                </div>
            ) : filteredItems.length > 0 ? (
                <div className={styles.feed}>
                    {filteredItems.map((item, i) => {
                        const color = getColor(item.category);
                        return (
                            <div
                                key={item.id}
                                className={`card ${styles.feedCard} ${item.isRead ? styles.readCard : ''} animate-fade-in stagger-${Math.min(i + 1, 4)}`}
                            >
                                <div className={styles.cardAccent} style={{ background: color }} />
                                <div className={styles.cardContent}>
                                    <div className={styles.cardHeader}>
                                        <span className="badge" style={{ background: `${color}18`, color }}>
                                            {item.category}
                                        </span>
                                        <div className={styles.cardActions}>
                                            <button
                                                className={`${styles.actionBtn} ${item.isRead ? styles.readBtn : ''}`}
                                                onClick={() => toggleRead(item)}
                                                title={item.isRead ? 'Mark as unread' : 'Mark as read'}
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${item.isBookmarked ? styles.bookmarkedBtn : ''}`}
                                                onClick={() => toggleBookmark(item)}
                                                title={item.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                                            >
                                                {item.isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className={styles.cardTitle}>{item.title}</h3>
                                    <p className={styles.cardDesc}>{item.description}</p>

                                    <div className={styles.cardFooter}>
                                        <div className={styles.tags}>
                                            {item.tags.slice(0, 3).map((tag) => (
                                                <span key={tag} className={styles.tag}>
                                                    <Tag size={10} /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                        {item.url && (
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.readMore}>
                                                Read more <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Lightbulb size={28} />
                        </div>
                        <h3>No items match your filters</h3>
                        <p>Try adjusting your category or bookmark filter.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
