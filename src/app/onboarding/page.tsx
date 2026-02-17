'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck,
    Tool, ExternalLink, CreditCard, Mail, Search,
    Lock, User, Sparkles
} from 'lucide-react';
import { Member, DirectoryTool } from '@/lib/db';
import { useToast } from '@/components/ToastProvider';
import styles from './page.module.css';

function OnboardingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { addToast } = useToast();
    const inviteCode = searchParams.get('code');

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [member, setMember] = useState<Member | null>(null);
    const [directoryTools, setDirectoryTools] = useState<DirectoryTool[]>([]);
    const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
    const [billingInfo, setBillingInfo] = useState<Record<string, { billingEmail: string; paymentSuffix: string }>>({});

    // Step 1 Form
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        async function init() {
            if (!inviteCode) {
                addToast('Invalid or missing invite code', 'error');
                router.push('/signup');
                return;
            }

            try {
                const [mRes, dRes] = await Promise.all([
                    fetch('/api/members'),
                    fetch('/api/directory')
                ]);
                const members: Member[] = await mRes.json();
                const directory: DirectoryTool[] = await dRes.json();

                const found = members.find(m => m.inviteCode === inviteCode);
                if (!found) {
                    addToast('Invite code not found', 'error');
                    router.push('/signup');
                    return;
                }

                setMember(found);
                setName(found.name === 'Pending Invite' ? '' : found.name);
                setDirectoryTools(directory);
            } catch (err) {
                addToast('Failed to load onboarding data', 'error');
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [inviteCode, router, addToast]);

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            addToast('Passwords do not match', 'error');
            return;
        }
        setStep(2);
    };

    const handleToolsSubmit = () => {
        if (selectedToolIds.length === 0) {
            addToast('Please select at least one tool to continue', 'info');
            return;
        }
        // Initialize billing info for selected tools
        const initialInfo: typeof billingInfo = {};
        selectedToolIds.forEach(id => {
            initialInfo[id] = {
                billingEmail: member?.email || '',
                paymentSuffix: ''
            };
        });
        setBillingInfo(initialInfo);
        setStep(3);
    };

    const handleComplete = async () => {
        if (!member) return;

        try {
            setLoading(true);
            // 1. Finalize Member Signup
            const signupRes = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email: member.email,
                    password,
                    inviteCode
                })
            });

            if (!signupRes.ok) throw new Error('Signup failed');
            const newMember = await signupRes.json();

            // 2. Create Selected Tools with Billing Info
            const toolsToCreate = selectedToolIds.map(id => {
                const dTool = directoryTools.find(dt => dt.id === id);
                return {
                    name: dTool?.name || 'Unknown Tool',
                    category: dTool?.category || 'Other',
                    url: dTool?.url || '',
                    monthlyCost: dTool?.monthlyCost || 0,
                    dataAccess: 'limited' as const,
                    status: 'active' as const,
                    purpose: 'Onboarded via wizard',
                    ownerId: newMember.id,
                    billingEmail: billingInfo[id]?.billingEmail,
                    paymentSuffix: billingInfo[id]?.paymentSuffix
                };
            });

            await fetch('/api/tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(toolsToCreate)
            });

            addToast('Onboarding complete! Welcome to AIOrbit.', 'success');
            router.push('/dashboard');
        } catch (err) {
            addToast('Failed to complete onboarding', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && step === 1) {
        return (
            <div className={styles.loading}>
                <Sparkles className="animate-pulse" />
                <p>Preparing your workspace...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.progressHeader}>
                <div className={styles.logo}>AI<b>ORBIT</b></div>
                <div className={styles.steps}>
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`${styles.stepIndicator} ${step >= s ? styles.active : ''}`}>
                            {step > s ? <CheckCircle2 size={16} /> : s}
                            <span>{s === 1 ? 'Account' : s === 2 ? 'Stack' : 'Sync'}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.cardWrapper}>
                {step === 1 && (
                    <div className="card animate-scale-in">
                        <header className={styles.cardHeader}>
                            <div className={styles.iconCircle}><User /></div>
                            <h2>Finalize Your Profile</h2>
                            <p>You've been invited to join <b>AIOrbit</b>. Let's get your account ready.</p>
                        </header>
                        <form onSubmit={handleAccountSubmit} className={styles.form}>
                            <div className={styles.group}>
                                <label>Full Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" />
                            </div>
                            <div className={styles.group}>
                                <label>Email Address</label>
                                <input type="email" value={member?.email} disabled />
                            </div>
                            <div className={styles.row}>
                                <div className={styles.group}>
                                    <label>Password</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
                                </div>
                                <div className={styles.group}>
                                    <label>Confirm Password</label>
                                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-full">
                                Next: Select Your Tools <ArrowRight size={18} />
                            </button>
                        </form>
                    </div>
                )}

                {step === 2 && (
                    <div className="card animate-scale-in">
                        <header className={styles.cardHeader}>
                            <div className={styles.iconCircle}><Sparkles /></div>
                            <h2>What's in your stack?</h2>
                            <p>Select the AI tools you currently use to help us automate governance.</p>
                        </header>

                        <div className={styles.toolSearch}>
                            <Search size={18} />
                            <input type="text" placeholder="Search AI Directory..." />
                        </div>

                        <div className={styles.toolList}>
                            {directoryTools.map(t => (
                                <div
                                    key={t.id}
                                    className={`${styles.toolItem} ${selectedToolIds.includes(t.id) ? styles.selected : ''}`}
                                    onClick={() => {
                                        setSelectedToolIds(prev =>
                                            prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                                        );
                                    }}
                                >
                                    <div className={styles.toolCheck}>
                                        <div className={styles.checkInner}></div>
                                    </div>
                                    <div className={styles.toolInfo}>
                                        <span className={styles.toolName}>{t.name}</span>
                                        <span className={styles.toolCat}>{t.category}</span>
                                    </div>
                                    <span className={styles.toolPrice}>${t.monthlyCost}/mo</span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.actions}>
                            <button className="btn btn-ghost" onClick={() => setStep(1)}><ArrowLeft size={18} /> Back</button>
                            <button className="btn btn-primary" onClick={handleToolsSubmit}>
                                Next: Governance Sync <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="card animate-scale-in">
                        <header className={styles.cardHeader}>
                            <div className={styles.iconCircle}><ShieldCheck /></div>
                            <h2>Governance Sync</h2>
                            <p>Help our AI Mailroom identify your subscriptions to automate invoice collection.</p>
                        </header>

                        <div className={styles.syncList}>
                            {selectedToolIds.map(id => {
                                const t = directoryTools.find(dt => dt.id === id);
                                return (
                                    <div key={id} className={styles.syncItem}>
                                        <div className={styles.syncToolHead}>
                                            <strong>{t?.name}</strong>
                                            <span className="badge badge-info">{t?.category}</span>
                                        </div>
                                        <div className={styles.syncRow}>
                                            <div className={styles.syncGroup}>
                                                <label><Mail size={12} /> Billing Email</label>
                                                <input
                                                    type="email"
                                                    value={billingInfo[id]?.billingEmail}
                                                    onChange={e => setBillingInfo({
                                                        ...billingInfo,
                                                        [id]: { ...billingInfo[id], billingEmail: e.target.value }
                                                    })}
                                                    placeholder="Which email receives invoices?"
                                                />
                                            </div>
                                            <div className={styles.syncGroup}>
                                                <label><CreditCard size={12} /> Payment Suffix</label>
                                                <input
                                                    type="text"
                                                    maxLength={4}
                                                    placeholder="Last 4 (e.g. 1234)"
                                                    value={billingInfo[id]?.paymentSuffix}
                                                    onChange={e => setBillingInfo({
                                                        ...billingInfo,
                                                        [id]: { ...billingInfo[id], paymentSuffix: e.target.value }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={styles.actions}>
                            <button className="btn btn-ghost" onClick={() => setStep(2)}><ArrowLeft size={18} /> Back</button>
                            <button className="btn btn-primary" onClick={handleComplete} disabled={loading}>
                                {loading ? 'Finalizing...' : 'Complete Registration'} <CheckCircle2 size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OnboardingContent />
        </Suspense>
    );
}
