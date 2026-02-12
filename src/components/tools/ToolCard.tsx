'use client';

import {
    ExternalLink,
    MoreVertical,
    Pencil,
    Trash2,
    Pause,
    Play,
    Shield,
    ShieldAlert,
    ShieldCheck,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Tool } from '@/lib/db';
import styles from './ToolCard.module.css';

const categoryColors: Record<string, string> = {
    Productivity: '#6366f1',
    Creative: '#ec4899',
    Code: '#22c55e',
    Research: '#3b82f6',
    Communication: '#f59e0b',
    Analytics: '#8b5cf6',
    Writing: '#14b8a6',
    Other: '#64748b',
};

const statusLabels: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'badge-success' },
    paused: { label: 'Paused', className: 'badge-warning' },
    trial: { label: 'Trial', className: 'badge-info' },
};

const dataAccessIcons: Record<string, { icon: typeof Shield; label: string; color: string }> = {
    none: { icon: ShieldCheck, label: 'No data access', color: 'var(--color-success)' },
    limited: { icon: Shield, label: 'Limited data access', color: 'var(--color-warning)' },
    full: { icon: ShieldAlert, label: 'Full data access', color: 'var(--color-danger)' },
};

interface ToolCardProps {
    tool: Tool;
    onEdit: (tool: Tool) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (tool: Tool) => void;
    onCertify?: (id: string) => void;
}

export default function ToolCard({ tool, onEdit, onDelete, onToggleStatus, onCertify }: ToolCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const color = categoryColors[tool.category] || categoryColors.Other;
    const status = statusLabels[tool.status] || statusLabels.active;
    const dataAccess = dataAccessIcons[tool.dataAccess] || dataAccessIcons.none;
    const DataIcon = dataAccess.icon;

    const isStale = tool.status === 'active' &&
        (!tool.lastCertifiedAt || new Date(tool.lastCertifiedAt) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className={`card ${styles.toolCard} ${isStale ? styles.stale : ''}`}>
            {/* Category accent bar */}
            <div className={styles.accentBar} style={{ background: color }} />

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.toolIcon} style={{ background: `${color}18`, color }}>
                    {tool.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.headerInfo}>
                    <h3 className={styles.toolName}>{tool.name}</h3>
                    <span className={`badge`} style={{ background: `${color}18`, color }}>
                        {tool.category}
                    </span>
                </div>
                <div className={styles.menu} ref={menuRef}>
                    <button
                        className={styles.menuBtn}
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="More options"
                    >
                        <MoreVertical size={16} />
                    </button>
                    {menuOpen && (
                        <div className={styles.menuDropdown}>
                            <button onClick={() => { onEdit(tool); setMenuOpen(false); }}>
                                <Pencil size={14} /> Edit
                            </button>
                            <button onClick={() => { onToggleStatus(tool); setMenuOpen(false); }}>
                                {tool.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                                {tool.status === 'active' ? 'Pause' : 'Activate'}
                            </button>
                            <button className={styles.deleteBtn} onClick={() => { onDelete(tool.id); setMenuOpen(false); }}>
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Purpose */}
            {tool.purpose && (
                <p className={styles.purpose}>{tool.purpose}</p>
            )}

            {/* Certification Status */}
            {isStale && onCertify && (
                <div className={styles.certificationAlert}>
                    <ShieldAlert size={14} />
                    <span>Recertification required</span>
                    <button
                        className={styles.certifyBtn}
                        onClick={() => onCertify(tool.id)}
                    >
                        Confirm Usage
                    </button>
                </div>
            )}

            {/* Footer */}
            <div className={styles.footer}>
                <div className={styles.footerLeft}>
                    <span className={`badge ${status.className}`}>{status.label}</span>
                    <span className={styles.dataAccess} title={dataAccess.label}>
                        <DataIcon size={14} style={{ color: dataAccess.color }} />
                    </span>
                    {tool.lastCertifiedAt && (
                        <span className={styles.certifiedDate}>
                            Verified {new Date(tool.lastCertifiedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                </div>
                <div className={styles.footerRight}>
                    {tool.monthlyCost > 0 && (
                        <span className={styles.cost}>${tool.monthlyCost}/mo</span>
                    )}
                    {tool.url && (
                        <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.externalLink}
                            title="Open tool"
                        >
                            <ExternalLink size={14} />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
