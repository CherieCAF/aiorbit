'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, ArrowRight, Wrench, Target, BookOpen,
    Lightbulb, BarChart3, LayoutDashboard, Plus, Globe, Compass,
    Command, CornerDownLeft,
} from 'lucide-react';
import styles from './CommandPalette.module.css';

interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    category: 'navigation' | 'tool' | 'goal' | 'decision' | 'learning' | 'action';
    icon: React.ReactNode;
    href?: string;
    action?: () => void;
}

const NAV_ITEMS: SearchResult[] = [
    { id: 'nav-dashboard', title: 'Dashboard', subtitle: 'Command Center overview', category: 'navigation', icon: <LayoutDashboard size={16} />, href: '/' },
    { id: 'nav-tools', title: 'AI Tools', subtitle: 'Manage your tool registry', category: 'navigation', icon: <Wrench size={16} />, href: '/tools' },
    { id: 'nav-goals', title: 'Goals', subtitle: 'Track your objectives', category: 'navigation', icon: <Target size={16} />, href: '/goals' },
    { id: 'nav-decisions', title: 'Decisions', subtitle: 'Decision journal', category: 'navigation', icon: <BookOpen size={16} />, href: '/decisions' },
    { id: 'nav-learning', title: 'Learning Feed', subtitle: 'Curated resources', category: 'navigation', icon: <Lightbulb size={16} />, href: '/learning' },
    { id: 'nav-analytics', title: 'Analytics', subtitle: 'Charts & insights', category: 'navigation', icon: <BarChart3 size={16} />, href: '/analytics' },
    { id: 'nav-directory', title: 'AI Directory', subtitle: 'Curated list of AI tools', category: 'navigation', icon: <Compass size={16} />, href: '/directory' },
    { id: 'nav-ecosystem', title: 'Ecosystem Map', subtitle: 'Visual tool-goal network', category: 'navigation', icon: <Globe size={16} />, href: '/ecosystem' },
];

const ACTIONS: SearchResult[] = [
    { id: 'act-tool', title: 'Add new AI tool', subtitle: 'Register a tool', category: 'action', icon: <Plus size={16} />, href: '/tools?action=add' },
    { id: 'act-goal', title: 'Create a goal', subtitle: 'Set a new objective', category: 'action', icon: <Plus size={16} />, href: '/goals?action=add' },
    { id: 'act-decision', title: 'Log a decision', subtitle: 'Record a decision', category: 'action', icon: <Plus size={16} />, href: '/decisions?action=add' },
];

function fuzzyMatch(text: string, query: string): boolean {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    // Simple substring match first
    if (lowerText.includes(lowerQuery)) return true;
    // Fuzzy: every character in query appears in text in order
    let qi = 0;
    for (let i = 0; i < lowerText.length && qi < lowerQuery.length; i++) {
        if (lowerText[i] === lowerQuery[qi]) qi++;
    }
    return qi === lowerQuery.length;
}

const CATEGORY_LABELS: Record<string, string> = {
    navigation: 'Pages',
    action: 'Quick Actions',
    tool: 'Tools',
    goal: 'Goals',
    decision: 'Decisions',
    learning: 'Learning',
};

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [dynamicResults, setDynamicResults] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Fetch data for searching
    const fetchSearchData = useCallback(async () => {
        try {
            const [toolsRes, goalsRes, decisionsRes, learningRes] = await Promise.all([
                fetch('/api/tools').then((r) => r.json()),
                fetch('/api/goals').then((r) => r.json()),
                fetch('/api/decisions').then((r) => r.json()),
                fetch('/api/learning').then((r) => r.json()),
            ]);

            const results: SearchResult[] = [];

            if (Array.isArray(toolsRes)) {
                toolsRes.forEach((t: { id: string; name: string; category: string }) => {
                    results.push({
                        id: `tool-${t.id}`,
                        title: t.name,
                        subtitle: t.category,
                        category: 'tool',
                        icon: <Wrench size={16} />,
                        href: '/tools',
                    });
                });
            }

            if (Array.isArray(goalsRes)) {
                goalsRes.forEach((g: { id: string; title: string; category: string; status: string }) => {
                    results.push({
                        id: `goal-${g.id}`,
                        title: g.title,
                        subtitle: `${g.category} · ${g.status}`,
                        category: 'goal',
                        icon: <Target size={16} />,
                        href: '/goals',
                    });
                });
            }

            if (Array.isArray(decisionsRes)) {
                decisionsRes.forEach((d: { id: string; title: string; category: string }) => {
                    results.push({
                        id: `dec-${d.id}`,
                        title: d.title,
                        subtitle: d.category,
                        category: 'decision',
                        icon: <BookOpen size={16} />,
                        href: '/decisions',
                    });
                });
            }

            if (Array.isArray(learningRes)) {
                learningRes.forEach((l: { id: string; title: string; category: string }) => {
                    results.push({
                        id: `learn-${l.id}`,
                        title: l.title,
                        subtitle: l.category,
                        category: 'learning',
                        icon: <Lightbulb size={16} />,
                        href: '/learning',
                    });
                });
            }

            setDynamicResults(results);
        } catch {
            // Silently fail
        }
    }, []);

    // Global keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input and fetch data when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            fetchSearchData();
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, fetchSearchData]);

    // Filter results
    const allResults = [...NAV_ITEMS, ...ACTIONS, ...dynamicResults];
    const filtered = query.length === 0
        ? [...NAV_ITEMS, ...ACTIONS]
        : allResults.filter((r) =>
            fuzzyMatch(r.title, query) ||
            (r.subtitle && fuzzyMatch(r.subtitle, query))
        );

    // Group by category
    const grouped = filtered.reduce<Record<string, SearchResult[]>>((acc, r) => {
        if (!acc[r.category]) acc[r.category] = [];
        acc[r.category].push(r);
        return acc;
    }, {});

    const flatFiltered = Object.values(grouped).flat();

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selected = flatFiltered[selectedIndex];
            if (selected) executeResult(selected);
        }
    };

    // Scroll selected into view
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    // Reset index on query change
    useEffect(() => { setSelectedIndex(0); }, [query]);

    const executeResult = (result: SearchResult) => {
        setIsOpen(false);
        if (result.action) {
            result.action();
        } else if (result.href) {
            router.push(result.href);
        }
    };

    if (!isOpen) return null;

    let flatIndex = 0;

    return (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
            <div className={styles.palette} onClick={(e) => e.stopPropagation()}>
                {/* Search Input */}
                <div className={styles.inputWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.input}
                        placeholder="Search tools, goals, decisions, or type a command..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <kbd className={styles.kbd}>esc</kbd>
                </div>

                {/* Results */}
                <div className={styles.results} ref={listRef}>
                    {flatFiltered.length === 0 ? (
                        <div className={styles.empty}>
                            <Search size={20} />
                            <p>No results for &ldquo;{query}&rdquo;</p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([category, results]) => (
                            <div key={category} className={styles.group}>
                                <div className={styles.groupLabel}>
                                    {CATEGORY_LABELS[category] || category}
                                </div>
                                {results.map((result) => {
                                    const currentIndex = flatIndex++;
                                    return (
                                        <button
                                            key={result.id}
                                            data-index={currentIndex}
                                            className={`${styles.resultItem} ${currentIndex === selectedIndex ? styles.selected : ''}`}
                                            onClick={() => executeResult(result)}
                                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                                        >
                                            <div className={styles.resultIcon}>{result.icon}</div>
                                            <div className={styles.resultText}>
                                                <span className={styles.resultTitle}>{result.title}</span>
                                                {result.subtitle && (
                                                    <span className={styles.resultSubtitle}>{result.subtitle}</span>
                                                )}
                                            </div>
                                            <ArrowRight size={14} className={styles.resultArrow} />
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <span className={styles.footerHint}>
                        <CornerDownLeft size={12} /> to select
                    </span>
                    <span className={styles.footerHint}>
                        <span className={styles.footerArrows}>↑↓</span> to navigate
                    </span>
                    <span className={styles.footerHint}>
                        <Command size={12} />K to toggle
                    </span>
                </div>
            </div>
        </div>
    );
}
