'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Users, Mail, Receipt, AlertTriangle, CheckCircle2,
    Plus, DollarSign, Building2, BarChart3, UploadCloud,
    Search, UserPlus, Database
} from 'lucide-react';
import { Member, Invoice, Tool } from '@/lib/db';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/components/AuthProvider';
import SegmentedControl from '@/components/SegmentedControl';
import styles from './page.module.css';

export default function TeamPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'members' | 'ledger'>('members');
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
    const [inviteDept, setInviteDept] = useState('Engineering');
    const [inviteBudget, setInviteBudget] = useState(100);
    const [lastInviteCode, setLastInviteCode] = useState<string | null>(null);
    const { addToast } = useToast();
    const { user } = useAuth();

    // Stats
    const totalSpend = invoices.reduce((acc, inv) => acc + inv.amount, 0);
    const missingInvoices = members.length > 0 ? members.length : 0; // Simplified for demo

    const fetchData = useCallback(async () => {
        try {
            const [mRes, iRes, tRes, txRes] = await Promise.all([
                fetch('/api/members'),
                fetch('/api/invoices'),
                fetch('/api/tools'),
                fetch('/api/transactions'),
            ]);

            const mData = await mRes.json();
            const iData = await iRes.json();
            const tData = await tRes.json();
            const txData = await txRes.json();

            if (Array.isArray(mData)) setMembers(mData);
            if (Array.isArray(iData)) setInvoices(iData);
            if (Array.isArray(tData)) setTools(tData);
            if (Array.isArray(txData)) setTransactions(txData);

        } catch (error) {
            addToast('Failed to load team data', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const runMailroomDemo = async (toolName: string) => {
        try {
            addToast('Mailroom parsing invoice...', 'info');
            const res = await fetch('/api/mailroom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rawText: `Your ${toolName} subscription invoice for Feb 2026 is attached. Amount: $20.00`,
                    memberEmail: user?.email || 'admin@company.com'
                }),
            });
            const data = await res.json();
            if (res.ok) {
                addToast(`Mailroom: Automatically logged ${toolName} invoice!`, 'success');
                fetchData(); // Refresh UI
            }
        } catch (error) {
            addToast('Mailroom failed', 'error');
        }
    };

    const handleUpdateMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;

        try {
            const res = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingMember),
            });

            if (res.ok) {
                addToast('Member updated successfully', 'success');
                setIsEditModalOpen(false);
                setEditingMember(null);
                fetchData();
            } else {
                throw new Error();
            }
        } catch (error) {
            addToast('Failed to update member', 'error');
        }
    };

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: inviteEmail,
                    role: inviteRole,
                    department: inviteDept,
                    aiBudget: inviteBudget
                })
            });
            if (res.ok) {
                const data = await res.json();
                setLastInviteCode(data.inviteCode);
                addToast(`Invite generated for ${inviteEmail}`, 'success');
                // Don't close immediately, show the code
                setInviteEmail('');
                fetchData();
            } else {
                throw new Error();
            }
        } catch {
            addToast('Failed to generate invite', 'error');
        }
    };

    return (
        <div className={styles.teamPage}>
            <header className="page-header animate-fade-in">
                <h1>Team Governance</h1>
                <p>Monitor AI adoption, spending, and compliance across your organization.</p>
            </header>

            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} card animate-fade-in stagger-1`}>
                    <div className={styles.statLabel}>Total AI Spend (Month)</div>
                    <div className={styles.statValue}>${totalSpend.toLocaleString()}</div>
                    <div className="trend trend-up">
                        <BarChart3 size={14} /> +12% from last month
                    </div>
                </div>
                <div className={`${styles.statCard} card animate-fade-in stagger-2`}>
                    <div className={styles.statLabel}>Provisioned Members</div>
                    <div className={styles.statValue}>{members.length}</div>
                    <div className={styles.statLabel}>Active Seats</div>
                </div>
                <div className={`${styles.statCard} card animate-fade-in stagger-3`}>
                    <div className={styles.statLabel}>Compliance Gaps</div>
                    <div className={styles.statValue} style={{ color: '#ef4444' }}>{missingInvoices}</div>
                    <div className={styles.statLabel}>Missing Invoices</div>
                </div>
            </div>

            <section className={styles.guideSection}>
                <div className={styles.guideHeader}>
                    <Building2 size={20} />
                    <h3 style={{ margin: 0 }}>Governance Workflow Guide</h3>
                </div>
                <div className={styles.guide}>
                    <div className={styles.guideStep}>
                        <div className={styles.stepNumber}>1</div>
                        <div className={styles.stepText}>
                            <h4>Provision Team</h4>
                            <p>Add department heads and budget owners to the directory.</p>
                        </div>
                        <div className={styles.stepStatus}><CheckCircle2 size={16} /></div>
                    </div>
                    <div className={styles.guideStep}>
                        <div className={styles.stepNumber}>2</div>
                        <div className={styles.stepText}>
                            <h4>Set AI Budgets</h4>
                            <p>Assign monthly spend limits to manage company-wide burn rate.</p>
                        </div>
                        <div className={styles.stepStatus}><CheckCircle2 size={16} /></div>
                    </div>
                    <div className={styles.guideStep}>
                        <div className={styles.stepNumber}>3</div>
                        <div className={styles.stepText}>
                            <h4>Setup Mailroom</h4>
                            <p>Ask team to forward billing emails to your mailroom address.</p>
                        </div>
                    </div>
                    <div className={styles.guideStep}>
                        <div className={styles.stepNumber}>4</div>
                        <div className={styles.stepText}>
                            <h4>Sync & Match</h4>
                            <p>Link bank charges to receipts in the Ledger tab.</p>
                        </div>
                    </div>
                    <div className={styles.guideStep}>
                        <div className={styles.stepNumber}>5</div>
                        <div className={styles.stepText}>
                            <h4>Member Self-Registry</h4>
                            <p>Team members register tools and confirm usage every 30 days.</p>
                        </div>
                    </div>
                </div>
            </section>

            <main className="animate-fade-in stagger-4">
                <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'center' }}>
                    <SegmentedControl
                        options={[
                            { id: 'members', label: 'Member Directory', icon: <Users size={16} /> },
                            { id: 'ledger', label: 'Company Ledger', icon: <Receipt size={16} /> },
                        ]}
                        activeId={activeTab}
                        onChange={(id) => setActiveTab(id as 'members' | 'ledger')}
                    />
                </div>

                {activeTab === 'members' ? (
                    <>
                        <div className={styles.sectionHeader}>
                            <h2>Team Status</h2>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <input
                                    type="file"
                                    id="csvUpload"
                                    accept=".csv"
                                    style={{ display: 'none' }}
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        addToast('Parsing CSV...', 'info');
                                        const reader = new FileReader();
                                        reader.onload = async (event) => {
                                            try {
                                                const text = event.target?.result as string;
                                                const lines = text.split('\n').filter(l => l.trim());
                                                // Skip header if it exists
                                                const startIdx = lines[0].toLowerCase().includes('name') ? 1 : 0;

                                                const membersToImport = lines.slice(startIdx).map(line => {
                                                    const [name, email, department, role, budget] = line.split(',').map(s => s.trim());
                                                    return {
                                                        name: name || 'New Member',
                                                        email: email || '',
                                                        department: department || 'Engineering',
                                                        role: (role?.toLowerCase() === 'admin' ? 'admin' : 'member') as 'admin' | 'member',
                                                        aiBudget: parseInt(budget) || 200,
                                                    };
                                                }).filter(m => m.email);

                                                if (membersToImport.length === 0) {
                                                    addToast('No valid members found in CSV', 'error');
                                                    return;
                                                }

                                                addToast(`Importing ${membersToImport.length} members...`, 'info');
                                                const res = await fetch('/api/members', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify(membersToImport),
                                                });

                                                if (res.ok) {
                                                    addToast(`Successfully imported ${membersToImport.length} members!`, 'success');
                                                    fetchData();
                                                } else {
                                                    throw new Error('Import failed');
                                                }
                                            } catch (err) {
                                                addToast('Failed to import CSV. Check format: Name,Email,Dept,Role,Budget', 'error');
                                            }
                                        };
                                        reader.readAsText(file);
                                    }}
                                />
                                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                                    <button
                                        className="button button-ghost"
                                        onClick={async () => {
                                            if (confirm('This will RESET your database and add demo data. Continue?')) {
                                                const res = await fetch('/api/seed', { method: 'POST' });
                                                if (res.ok) window.location.reload();
                                            }
                                        }}
                                    >
                                        <Database size={16} /> Seed Demo Data
                                    </button>
                                    <button className="button button-primary" onClick={() => document.getElementById('csv-import')?.click()}>
                                        <UploadCloud size={16} /> Import Team (.csv)
                                    </button>
                                </div>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setIsInviteModalOpen(true)}
                                >
                                    <Mail size={16} style={{ marginRight: '6px' }} /> Invite Member
                                </button>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setIsInviteModalOpen(true)}
                                >
                                    <UserPlus size={16} style={{ marginRight: '6px' }} /> Add Member
                                </button>
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Member</th>
                                        <th>Department</th>
                                        <th>Role</th>
                                        <th>AI Budget</th>
                                        <th>Compliance</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map(member => (
                                        <tr key={member.id}>
                                            <td>
                                                <div className={styles.memberInfo}>
                                                    <div className={styles.avatar}>
                                                        {member.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <div className={styles.name}>{member.name}</div>
                                                        <div className={styles.email}>{member.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{member.department}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    <span className={`badge ${member.role === 'admin' ? 'badge-primary' : 'badge-info'}`}>
                                                        {member.role}
                                                    </span>
                                                    {member.status === 'invited' && (
                                                        <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontSize: '9px' }}>
                                                            INVITED
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={styles.budgetRow}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                                    <span>${member.aiBudget}</span>
                                                    <span style={{ color: 'var(--text-tertiary)' }}>80%</span>
                                                </div>
                                                <div className={styles.budgetTrack}>
                                                    <div className={styles.budgetFill} style={{ width: '80%' }}></div>
                                                </div>
                                            </td>
                                            <td>
                                                {invoices.some(i => i.memberId === member.id && i.status === 'received') ? (
                                                    <span className={`${styles.statusBadge} ${styles.statusGood}`}>
                                                        <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> Fully Compliant
                                                    </span>
                                                ) : (
                                                    <span className={`${styles.statusBadge} ${styles.statusWarning}`}>
                                                        <AlertTriangle size={12} style={{ marginRight: '4px' }} /> Missing Invoice
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => {
                                                        setEditingMember(member);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                >
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.sectionHeader}>
                            <h2>Financial Ledger (Capital on Tap)</h2>
                            <div className="badge badge-warning">3 Unclaimed Transactions</div>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Merchant</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Associated Invoice</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(tx => {
                                        const matchedInvoice = invoices.find(i => i.transactionId === tx.id);
                                        return (
                                            <tr key={tx.id}>
                                                <td>{new Date(tx.date).toLocaleDateString()}</td>
                                                <td>
                                                    <div className={styles.name}>{tx.merchant}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>ID: {tx.id.substring(0, 8)}</div>
                                                </td>
                                                <td style={{ fontWeight: 700 }}>{tx.currency} {tx.amount.toFixed(2)}</td>
                                                <td>
                                                    {tx.status === 'matched' ? (
                                                        <span className={`${styles.statusBadge} ${styles.statusGood}`}>
                                                            Matched
                                                        </span>
                                                    ) : (
                                                        <span className={`${styles.statusBadge} ${styles.statusWarning}`}>
                                                            Unclaimed
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {matchedInvoice ? (
                                                        <div className={styles.memberInfo}>
                                                            <Receipt size={14} color="var(--accent-primary)" />
                                                            <span style={{ fontSize: '12px' }}>
                                                                {members.find(m => m.id === matchedInvoice.memberId)?.name}'s Receipt
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Awaiting PDF...</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button className="btn btn-ghost btn-sm">Manual Match</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Mailroom Simulation Area */}
                <section className={styles.mailroomSection}>
                    <div className={styles.mailroomHeader}>
                        <div className={styles.mailroomIcon}>
                            <UploadCloud size={24} />
                        </div>
                        <h3>Mailroom Automation</h3>
                        <p style={{ maxWidth: '500px', margin: '0 auto', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Employees forward invoices to your mailroom. Our AI automatically extracts billing details.
                            <strong> Try the simulator below:</strong>
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                        <button className="btn btn-secondary" onClick={() => runMailroomDemo('Cursor')}>
                            Simulate Cursor Invoice
                        </button>
                        <button className="btn btn-secondary" onClick={() => runMailroomDemo('OpenAI')}>
                            Simulate ChatGPT Invoice
                        </button>
                        <button className="btn btn-secondary" onClick={() => runMailroomDemo('Midjourney')}>
                            Simulate Midjourney Invoice
                        </button>
                    </div>
                </section>

                {/* Edit Member Modal */}
                {isEditModalOpen && editingMember && (
                    <div className={styles.modalOverlay}>
                        <div className={`card ${styles.modalCard} animate-scale-in`}>
                            <div className={styles.modalHeader}>
                                <h3>Manage Member</h3>
                                <button className={styles.closeBtn} onClick={() => setIsEditModalOpen(false)}>×</button>
                            </div>
                            <form onSubmit={handleUpdateMember} className={styles.editForm}>
                                <div className={styles.formGroup}>
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={editingMember.name}
                                        onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                                        className={styles.input}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={editingMember.email}
                                        disabled
                                        className={styles.input}
                                    />
                                    <span className={styles.inputHint}>Email cannot be changed after registration.</span>
                                </div>
                                <div className={styles.row}>
                                    <div className={styles.formGroup}>
                                        <label>Department</label>
                                        <select
                                            value={editingMember.department}
                                            onChange={(e) => setEditingMember({ ...editingMember, department: e.target.value })}
                                            className={styles.input}
                                        >
                                            <option value="Engineering">Engineering</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="Product">Product</option>
                                            <option value="Operations">Operations</option>
                                            <option value="Design">Design</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Role</label>
                                        <select
                                            value={editingMember.role}
                                            onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value as 'admin' | 'member' })}
                                            className={styles.input}
                                        >
                                            <option value="member">Team Member</option>
                                            <option value="admin">Governance Lead (Admin)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>AI Budget (Monthly)</label>
                                    <div className={styles.budgetInputWrapper}>
                                        <span className={styles.currencyPrefix}>$</span>
                                        <input
                                            type="number"
                                            value={editingMember.aiBudget}
                                            onChange={(e) => setEditingMember({ ...editingMember, aiBudget: parseInt(e.target.value) || 0 })}
                                            className={styles.input}
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <span className={styles.inputHint}>Total spending limit across all AI tools.</span>
                                </div>
                                <div className={styles.modalActions}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Invite Member Modal */}
                {isInviteModalOpen && (
                    <div className={styles.modalOverlay}>
                        <div className={`card ${styles.modalCard} animate-scale-in`}>
                            <div className={styles.modalHeader}>
                                <h3>Invite Team Member</h3>
                                <button className={styles.closeBtn} onClick={() => {
                                    setIsInviteModalOpen(false);
                                    setLastInviteCode(null);
                                }}>×</button>
                            </div>

                            {lastInviteCode ? (
                                <div className={styles.successState}>
                                    <div className={styles.successIcon}>
                                        <CheckCircle2 size={48} />
                                    </div>
                                    <h4>Invite Code Generated!</h4>
                                    <p>Share this unique link with the new member to complete their onboarding.</p>

                                    <div className={styles.inviteLinkBox}>
                                        <code>{window.location.origin}/onboarding?code={lastInviteCode}</code>
                                        <button
                                            className="btn btn-sm btn-ghost"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/onboarding?code=${lastInviteCode}`);
                                                addToast('Link copied to clipboard', 'info');
                                            }}
                                        >
                                            Copy Link
                                        </button>
                                    </div>

                                    <button
                                        className="btn btn-primary w-full"
                                        style={{ marginTop: 'var(--space-lg)' }}
                                        onClick={() => {
                                            setIsInviteModalOpen(false);
                                            setLastInviteCode(null);
                                        }}
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleInviteMember} className={styles.editForm}>
                                    <div className={styles.formGroup}>
                                        <label>Work Email</label>
                                        <input
                                            type="email"
                                            placeholder="colleague@company.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className={styles.input}
                                            required
                                        />
                                    </div>
                                    <div className={styles.row}>
                                        <div className={styles.formGroup}>
                                            <label>Department</label>
                                            <select
                                                value={inviteDept}
                                                onChange={(e) => setInviteDept(e.target.value)}
                                                className={styles.input}
                                            >
                                                <option value="Engineering">Engineering</option>
                                                <option value="Marketing">Marketing</option>
                                                <option value="Product">Product</option>
                                                <option value="Operations">Operations</option>
                                                <option value="Design">Design</option>
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Role</label>
                                            <select
                                                value={inviteRole}
                                                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                                                className={styles.input}
                                            >
                                                <option value="member">Team Member</option>
                                                <option value="admin">Governance Lead (Admin)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Initial AI Budget</label>
                                        <div className={styles.budgetInputWrapper}>
                                            <span className={styles.currencyPrefix}>$</span>
                                            <input
                                                type="number"
                                                value={inviteBudget}
                                                onChange={(e) => setInviteBudget(parseInt(e.target.value) || 0)}
                                                className={styles.input}
                                                min="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.modalActions}>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setIsInviteModalOpen(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            Generate Invite Code
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
