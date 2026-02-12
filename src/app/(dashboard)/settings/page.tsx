'use client';

import { useState, useRef } from 'react';
import {
    Settings,
    Download,
    Upload,
    Trash2,
    Database,
    Info,
    AlertTriangle,
    CheckCircle,
    Wrench,
    Target,
    BookOpen,
    Lightbulb,
    Mail,
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import styles from './page.module.css';

export default function SettingsPage() {
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [mailroomAlias, setMailroomAlias] = useState('billing@yourcompany.aiorbit.com');
    const [extractionMode, setExtractionMode] = useState<'balanced' | 'strict'>('balanced');
    const [autoSync, setAutoSync] = useState(true);
    const [dbStats, setDbStats] = useState<{ tools: number; goals: number; decisions: number; learning: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    // Fetch DB stats on load
    useState(() => {
        Promise.all([
            fetch('/api/tools').then(r => r.json()),
            fetch('/api/goals').then(r => r.json()),
            fetch('/api/decisions').then(r => r.json()),
            fetch('/api/learning').then(r => r.json()),
        ]).then(([t, g, d, l]) => {
            setDbStats({
                tools: Array.isArray(t) ? t.length : 0,
                goals: Array.isArray(g) ? g.length : 0,
                decisions: Array.isArray(d) ? d.length : 0,
                learning: Array.isArray(l) ? l.length : 0,
            });
        }).catch(() => { });
    });

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch('/api/data');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `aiorbit-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast('Data exported successfully');
        } catch {
            addToast('Failed to export data', 'error');
        } finally {
            setExporting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            const res = await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Import failed');
            }
            const result = await res.json();
            setDbStats(result.counts);
            addToast(`Imported ${result.counts.tools} tools, ${result.counts.goals} goals, ${result.counts.decisions} decisions`);
        } catch (err) {
            addToast(`Import failed: ${err instanceof Error ? err.message : 'Invalid file'}`, 'error');
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleReset = async () => {
        setResetting(true);
        try {
            await fetch('/api/data', { method: 'DELETE' });
            setDbStats({ tools: 0, goals: 0, decisions: 0, learning: 0 });
            setShowResetConfirm(false);
            addToast('All data has been reset', 'info');
        } catch {
            addToast('Failed to reset data', 'error');
        } finally {
            setResetting(false);
        }
    };

    const total = dbStats ? dbStats.tools + dbStats.goals + dbStats.decisions + dbStats.learning : 0;

    return (
        <div className={styles.settingsPage}>
            <div className="page-header animate-fade-in">
                <h1>Settings</h1>
                <p>Manage your data and preferences</p>
            </div>

            {/* Database Overview */}
            <div className={`card ${styles.section} animate-fade-in stagger-1`}>
                <h3 className={styles.sectionTitle}>
                    <Database size={18} /> Database Overview
                </h3>
                {dbStats ? (
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <Wrench size={18} style={{ color: '#6366f1' }} />
                            <div className={styles.statValue}>{dbStats.tools}</div>
                            <div className={styles.statLabel}>Tools</div>
                        </div>
                        <div className={styles.statItem}>
                            <Target size={18} style={{ color: '#22c55e' }} />
                            <div className={styles.statValue}>{dbStats.goals}</div>
                            <div className={styles.statLabel}>Goals</div>
                        </div>
                        <div className={styles.statItem}>
                            <BookOpen size={18} style={{ color: '#f59e0b' }} />
                            <div className={styles.statValue}>{dbStats.decisions}</div>
                            <div className={styles.statLabel}>Decisions</div>
                        </div>
                        <div className={styles.statItem}>
                            <Lightbulb size={18} style={{ color: '#8b5cf6' }} />
                            <div className={styles.statValue}>{dbStats.learning}</div>
                            <div className={styles.statLabel}>Learning</div>
                        </div>
                    </div>
                ) : (
                    <p className={styles.loadingText}>Loading...</p>
                )}
                <p className={styles.totalText}>{total} total records stored locally in <code>data/db.json</code></p>
            </div>

            {/* Export */}
            <div className={`card ${styles.section} animate-fade-in stagger-2`}>
                <h3 className={styles.sectionTitle}>
                    <Download size={18} /> Export Data
                </h3>
                <p className={styles.sectionDesc}>
                    Download a full backup of your data as a JSON file. This includes all tools, goals, decisions, and learning items.
                </p>
                <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
                    <Download size={16} />
                    {exporting ? 'Exporting...' : 'Export All Data'}
                </button>
            </div>

            {/* Mailroom Configuration */}
            <div className={`card ${styles.section} animate-fade-in stagger-3`}>
                <h3 className={styles.sectionTitle}>
                    <Upload size={18} /> Mailroom Configuration
                </h3>
                <p className={styles.sectionDesc}>
                    Configure your AI Mailroom to automatically extract and log invoices from your team's billing emails.
                </p>

                <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>Virtual Forwarding Alias</label>
                    <div className={styles.inputWrapper}>
                        <Mail size={16} className={styles.inputIcon} />
                        <input
                            type="text"
                            className={styles.textField}
                            value={mailroomAlias}
                            onChange={(e) => setMailroomAlias(e.target.value)}
                            placeholder="e.g. billing@company.aiorbit.com"
                        />
                    </div>
                    <span className={styles.inputHint}>Ask your team to forward billing emails to this address.</span>
                </div>

                <div className={styles.settingsGrid}>
                    <div className={styles.settingRow}>
                        <div>
                            <div className={styles.settingLabel}>Extraction Mode</div>
                            <div className={styles.settingSublabel}>Balanced (fast & smart) vs Strict (high-confidence only)</div>
                        </div>
                        <div className={styles.toggleGroup}>
                            <button
                                className={`${styles.toggleBtn} ${extractionMode === 'balanced' ? styles.toggleActive : ''}`}
                                onClick={() => setExtractionMode('balanced')}
                            >
                                Balanced
                            </button>
                            <button
                                className={`${styles.toggleBtn} ${extractionMode === 'strict' ? styles.toggleActive : ''}`}
                                onClick={() => setExtractionMode('strict')}
                            >
                                Strict
                            </button>
                        </div>
                    </div>

                    <div className={styles.settingRow}>
                        <div>
                            <div className={styles.settingLabel}>Auto-Sync Bank Charges</div>
                            <div className={styles.settingSublabel}>Automatically match invoices to bank transactions upon ingestion</div>
                        </div>
                        <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={autoSync}
                            onChange={(e) => setAutoSync(e.target.checked)}
                        />
                    </div>
                </div>

                <div style={{ marginTop: 'var(--space-lg)' }}>
                    <button className="btn btn-primary" onClick={() => addToast('Mailroom settings saved', 'success')}>
                        Save Configuration
                    </button>
                </div>
            </div>

            {/* Import */}
            <div className={`card ${styles.section} animate-fade-in stagger-3`}>
                <h3 className={styles.sectionTitle}>
                    <Upload size={18} /> Import Data
                </h3>
                <p className={styles.sectionDesc}>
                    Restore your data from a previously exported JSON file. This will <strong>replace</strong> all existing data.
                </p>
                <div className={styles.importWarning}>
                    <AlertTriangle size={16} />
                    <span>Importing will overwrite your current data. Export a backup first!</span>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className={styles.fileInput}
                    id="import-file"
                />
                <label htmlFor="import-file" className={`btn btn-secondary ${styles.fileLabel}`}>
                    <Upload size={16} />
                    {importing ? 'Importing...' : 'Choose File to Import'}
                </label>
            </div>

            {/* Danger Zone */}
            <div className={`card ${styles.section} ${styles.dangerSection} animate-fade-in stagger-4`}>
                <h3 className={styles.sectionTitle} style={{ color: '#ef4444' }}>
                    <Trash2 size={18} /> Danger Zone
                </h3>
                <p className={styles.sectionDesc}>
                    Permanently delete all your data. This action cannot be undone.
                </p>
                {!showResetConfirm ? (
                    <button className={`btn ${styles.dangerBtn}`} onClick={() => setShowResetConfirm(true)}>
                        <Trash2 size={16} />
                        Reset All Data
                    </button>
                ) : (
                    <div className={styles.confirmReset}>
                        <p className={styles.confirmText}>
                            <AlertTriangle size={16} />
                            Are you sure? This will permanently delete <strong>{total} records</strong>.
                        </p>
                        <div className={styles.confirmActions}>
                            <button className="btn btn-secondary" onClick={() => setShowResetConfirm(false)}>
                                Cancel
                            </button>
                            <button className={`btn ${styles.dangerBtn}`} onClick={handleReset} disabled={resetting}>
                                <Trash2 size={16} />
                                {resetting ? 'Resetting...' : 'Yes, Delete Everything'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* App Info */}
            <div className={`glass-card ${styles.appInfo} animate-fade-in stagger-4`}>
                <div className={styles.appInfoIcon}>
                    <CheckCircle size={20} />
                </div>
                <div>
                    <h4>AIOrbit v1.0</h4>
                    <p>Your Personal AI Command Center. Data is stored locally — it never leaves your machine.</p>
                </div>
            </div>
        </div>
    );
}
