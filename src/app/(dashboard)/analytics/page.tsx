'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
    XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import {
    TrendingUp, DollarSign, AlertTriangle, CheckCircle,
    Info, Lightbulb, Zap, Target, Wrench, ArrowRight,
    ShieldAlert, Shield, ShieldCheck, BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import type { Tool, Goal, Decision } from '@/lib/db';
import { generateInsights, TOOL_GOAL_MAP, type Insight } from '@/lib/insights';
import SegmentedControl from '@/components/SegmentedControl';
import styles from './page.module.css';

const CATEGORY_COLORS: Record<string, string> = {
    Productivity: '#6366f1', Creative: '#ec4899', Code: '#22c55e',
    Research: '#3b82f6', Communication: '#f59e0b', Analytics: '#8b5cf6',
    Writing: '#14b8a6', Other: '#64748b',
};

const OUTCOME_COLORS = {
    positive: '#22c55e', neutral: '#f59e0b', negative: '#ef4444', pending: '#64748b',
};

const INSIGHT_ICONS = {
    info: Info, warning: AlertTriangle, success: CheckCircle, tip: Lightbulb,
};

const INSIGHT_COLORS = {
    info: '#3b82f6', warning: '#f59e0b', success: '#22c55e', tip: '#8b5cf6',
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className={styles.tooltip}>
            {label && <p className={styles.tooltipLabel}>{label}</p>}
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color }}>
                    {entry.name}: {typeof entry.value === 'number' && entry.name.includes('$') ? `$${entry.value}` : entry.value}
                </p>
            ))}
        </div>
    );
};

// Tool-specific risk reduction tips
function getRiskTips(toolName: string): string[] {
    const lower = toolName.toLowerCase();
    if (lower.includes('chatgpt') || lower.includes('openai')) {
        return ['Disable chat history in Settings → Data controls', 'Use API instead of web UI for sensitive queries', 'Opt out of model training at privacy.openai.com'];
    }
    if (lower.includes('claude') || lower.includes('anthropic')) {
        return ['Claude doesn\'t train on conversations by default', 'Use the API for stronger data guarantees', 'Delete conversations when no longer needed'];
    }
    if (lower.includes('gemini') || lower.includes('bard')) {
        return ['Turn off Gemini Apps Activity in myactivity.google.com', 'Use API via Google AI Studio for no-training policy', 'Review Google AI data use policies'];
    }
    if (lower.includes('copilot') || lower.includes('github')) {
        return ['Disable Suggestions matching public code in settings', 'Enable Copilot in Business for no-retention policy', 'Review which repos have Copilot enabled'];
    }
    if (lower.includes('cursor')) {
        return ['Enable Privacy Mode in Cursor settings', 'Uses OpenAI/Anthropic APIs — check upstream policies', 'Avoid pasting secrets in chat or autocomplete'];
    }
    if (lower.includes('notion')) {
        return ['Notion AI data isn\'t used for training by default', 'Review workspace-level AI settings as admin', 'Be cautious with sensitive data in shared workspaces'];
    }
    if (lower.includes('grammarly')) {
        return ['Grammarly doesn\'t use content for training', 'Text is processed in transit — avoid highly sensitive docs', 'Use Grammarly Business for SOC 2 / enterprise controls'];
    }
    if (lower.includes('zapier') || lower.includes('make') || lower.includes('pipedream')) {
        return ['Audit which apps have access to your data', 'Use the minimum required permissions for each integration', 'Review connected accounts quarterly'];
    }
    if (lower.includes('perplexity')) {
        return ['Queries may be used for product improvement', 'Use Perplexity Pro for enterprise-grade privacy', 'Avoid pasting proprietary data into searches'];
    }
    if (lower.includes('otter')) {
        return ['Review recording storage and sharing settings', 'Delete old transcripts you no longer need', 'Disable auto-join for meetings with sensitive content'];
    }
    // Generic tips for unknown full-access tools
    return ['Check privacy settings in the tool\'s dashboard', 'Look for an opt-out toggle for model training', 'Review what data is shared and for how long'];
}

export default function AnalyticsPage() {
    const [tools, setTools] = useState<Tool[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'spend' | 'compliance' | 'performance'>('spend');

    const fetchData = useCallback(async () => {
        try {
            const [t, g, d] = await Promise.all([
                fetch('/api/tools').then((r) => r.json()),
                fetch('/api/goals').then((r) => r.json()),
                fetch('/api/decisions').then((r) => r.json()),
            ]);
            if (Array.isArray(t)) setTools(t);
            if (Array.isArray(g)) setGoals(g);
            if (Array.isArray(d)) setDecisions(d);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className={styles.analyticsPage}>
                <div className="page-header animate-fade-in">
                    <h1>Analytics</h1>
                    <p>Loading your data...</p>
                </div>
                <div className={styles.loadingGrid}>
                    {[1, 2, 3, 4].map((i) => <div key={i} className={`card ${styles.skeleton}`} />)}
                </div>
            </div>
        );
    }

    // Compute data
    const insights = generateInsights(tools, goals, decisions);
    const totalSpend = tools.reduce((s, t) => s + (t.status !== 'paused' ? t.monthlyCost : 0), 0);
    const activeTools = tools.filter((t) => t.status === 'active');
    const activeGoals = goals.filter((g) => g.status === 'active');
    const completedGoals = goals.filter((g) => g.status === 'completed');

    // Category breakdown for pie chart
    const categoryData = Object.entries(
        tools.reduce<Record<string, number>>((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || '#64748b' }));

    // Spending by category for bar chart
    const spendingData = Object.entries(
        tools.reduce<Record<string, number>>((acc, t) => {
            if (t.monthlyCost > 0) {
                acc[t.category] = (acc[t.category] || 0) + t.monthlyCost;
            }
            return acc;
        }, {})
    ).map(([name, spend]) => ({ name, spend: Math.round(spend * 100) / 100 }))
        .sort((a, b) => b.spend - a.spend);

    // Goal progress data
    const goalProgressData = goals.map((g) => ({
        name: g.title.length > 20 ? g.title.slice(0, 20) + '...' : g.title,
        progress: g.progress,
        color: g.status === 'completed' ? '#22c55e' : g.status === 'paused' ? '#f59e0b' : '#6366f1',
    }));

    // Decision outcomes
    const outcomeData = Object.entries(
        decisions.reduce<Record<string, number>>((acc, d) => {
            const status = d.outcomeStatus || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: OUTCOME_COLORS[name as keyof typeof OUTCOME_COLORS] || '#64748b',
    }));

    // Data access risk breakdown
    const dataAccessData = [
        { name: 'No Access', value: tools.filter(t => t.dataAccess === 'none').length, color: '#22c55e', icon: ShieldCheck },
        { name: 'Limited', value: tools.filter(t => t.dataAccess === 'limited').length, color: '#f59e0b', icon: Shield },
        { name: 'Full Access', value: tools.filter(t => t.dataAccess === 'full').length, color: '#ef4444', icon: ShieldAlert },
    ].filter(d => d.value > 0);

    // Tool-Goal recommendations relevant to user's goals
    const relevantRecommendations = TOOL_GOAL_MAP.filter((rec) =>
        activeGoals.some((g) => g.category === rec.goalCategory)
    ).slice(0, 6);

    // Top stats
    const stats = [
        { label: 'Total Spend', value: `$${totalSpend.toFixed(0)}/mo`, icon: DollarSign, color: '#8b5cf6' },
        { label: 'Active Tools', value: String(activeTools.length), icon: Wrench, color: '#6366f1' },
        { label: 'Goal Completion', value: goals.length > 0 ? `${Math.round((completedGoals.length / goals.length) * 100)}%` : '0%', icon: Target, color: '#22c55e' },
        { label: 'Insights', value: String(insights.length), icon: Zap, color: '#f59e0b' },
    ];

    return (
        <div className={styles.analyticsPage}>
            {/* Header */}
            <div className="page-header animate-fade-in">
                <h1>Analytics</h1>
                <p>Deep dive into your AI ecosystem</p>
            </div>

            {/* Navigation Tabs */}
            <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'center' }}>
                <SegmentedControl
                    options={[
                        { id: 'spend', label: 'Financials', icon: <DollarSign size={16} /> },
                        { id: 'compliance', label: 'Compliance & Risk', icon: <Shield size={16} /> },
                        { id: 'performance', label: 'Performance (ROI)', icon: <Target size={16} /> },
                    ]}
                    activeId={activeTab}
                    onChange={(id) => setActiveTab(id as any)}
                />
            </div>

            {activeTab === 'spend' && (
                <>
                    {/* Stats Row */}
                    <div className={`${styles.statsRow} animate-fade-in stagger-1`}>
                        {stats.map((stat) => (
                            <div key={stat.label} className={`card ${styles.statCard}`}>
                                <div className={styles.statIcon} style={{ background: `${stat.color}18`, color: stat.color }}>
                                    <stat.icon size={20} />
                                </div>
                                <div className={styles.statValue}>{stat.value}</div>
                                <div className={styles.statLabel}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Financial Charts Grid */}
                    <div className={`${styles.chartsGrid} animate-fade-in stagger-2`}>
                        {spendingData.length > 0 && (
                            <div className={`card ${styles.chartCard}`}>
                                <h3 className={styles.chartTitle}><DollarSign size={18} /> Spending by Category</h3>
                                <div className={styles.chartContainer}>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={spendingData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                                            <YAxis type="category" dataKey="name" tick={{ fill: '#e2e8f0', fontSize: 12 }} width={90} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="spend" name="$ Spend" radius={[0, 6, 6, 0]}>
                                                {spendingData.map((d, i) => (
                                                    <Cell key={i} fill={CATEGORY_COLORS[d.name] || '#64748b'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {categoryData.length > 0 && (
                            <div className={`card ${styles.chartCard}`}>
                                <h3 className={styles.chartTitle}><BarChart3 size={18} /> Tools by Category</h3>
                                <div className={styles.chartContainer}>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                                                paddingAngle={3} dataKey="value" stroke="none">
                                                {categoryData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className={styles.chartLegend}>
                                        {categoryData.map((d) => (
                                            <div key={d.name} className={styles.legendItem}>
                                                <div className={styles.legendDot} style={{ background: d.color }} />
                                                <span>{d.name}</span>
                                                <span className={styles.legendValue}>{d.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'compliance' && (
                <div className="animate-fade-in">
                    {/* Data Privacy & Risk Guidance */}
                    <div className={`card ${styles.privacyCard}`}>
                        <h3 className={styles.chartTitle}><Shield size={18} /> Data Privacy &amp; Risk Guidance</h3>

                        {/* Access Level Breakdown */}
                        {dataAccessData.length > 0 && (
                            <div className={styles.privacyGrid}>
                                {dataAccessData.map((d) => (
                                    <div key={d.name} className={styles.privacyItem}>
                                        <d.icon size={24} style={{ color: d.color }} />
                                        <div className={styles.privacyValue}>{d.value}</div>
                                        <div className={styles.privacyLabel}>{d.name}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Full Access Tools — Specific Guidance */}
                        {tools.filter(t => t.dataAccess === 'full').length > 0 && (
                            <div className={styles.riskSection}>
                                <h4 className={styles.riskTitle}>
                                    <ShieldAlert size={16} style={{ color: '#ef4444' }} />
                                    Full Access Tools — How to Lower Risk
                                </h4>
                                <div className={styles.riskToolList}>
                                    {tools.filter(t => t.dataAccess === 'full').map((tool) => (
                                        <div key={tool.id} className={styles.riskToolItem}>
                                            <span className={styles.riskToolName}>{tool.name}</span>
                                            <span className={styles.riskToolTips}>
                                                {getRiskTips(tool.name).map((tip, i) => (
                                                    <span key={i} className={styles.riskTip}>{tip}</span>
                                                ))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* General Best Practices */}
                        <div className={styles.riskSection}>
                            <h4 className={styles.riskTitle}>
                                <ShieldCheck size={16} style={{ color: '#22c55e' }} />
                                General Best Practices
                            </h4>
                            <div className={styles.tipsList}>
                                <div className={styles.tipItem}>
                                    <span className={styles.tipBullet}>1</span>
                                    <div>
                                        <strong>Opt out of training</strong>
                                        <p>Most AI tools let you disable model training on your data. Check settings → privacy in each tool.</p>
                                    </div>
                                </div>
                                <div className={styles.tipItem}>
                                    <span className={styles.tipBullet}>2</span>
                                    <div>
                                        <strong>Use API access when possible</strong>
                                        <p>API usage typically has stronger privacy guarantees than web chat interfaces — data isn&apos;t stored for training.</p>
                                    </div>
                                </div>
                                <div className={styles.tipItem}>
                                    <span className={styles.tipBullet}>3</span>
                                    <div>
                                        <strong>Avoid sharing sensitive data</strong>
                                        <p>Don&apos;t paste passwords, API keys, financial records, or personal identifiers into AI tools with full access.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'performance' && (
                <div className="animate-fade-in">
                    {/* Charts Grid - Goal Progress */}
                    <div className={styles.chartsGrid}>
                        {goalProgressData.length > 0 && (
                            <div className={`card ${styles.chartCard}`}>
                                <h3 className={styles.chartTitle}><Target size={18} /> Goal Progress</h3>
                                <div className={styles.chartContainer}>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={goalProgressData} margin={{ left: 10, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="progress" name="Progress" radius={[6, 6, 0, 0]}>
                                                {goalProgressData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {outcomeData.length > 0 && (
                            <div className={`card ${styles.chartCard}`}>
                                <h3 className={styles.chartTitle}><TrendingUp size={18} /> Decision Outcomes</h3>
                                <div className={styles.chartContainer}>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                                                paddingAngle={3} dataKey="value" stroke="none">
                                                {outcomeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className={styles.chartLegend}>
                                        {outcomeData.map((d) => (
                                            <div key={d.name} className={styles.legendItem}>
                                                <div className={styles.legendDot} style={{ background: d.color }} />
                                                <span>{d.name}</span>
                                                <span className={styles.legendValue}>{d.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Smart Insights */}
                    <div className="section-header" style={{ marginTop: 'var(--space-xl)' }}>
                        <h2><Zap size={20} /> Smart Insights</h2>
                        <span className="badge badge-primary">{insights.length} insight{insights.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className={styles.insightsGrid}>
                        {insights.map((insight) => {
                            const Icon = INSIGHT_ICONS[insight.type];
                            const color = INSIGHT_COLORS[insight.type];
                            return (
                                <div key={insight.id} className={`glass-card ${styles.insightCard}`}>
                                    <div className={styles.insightIcon} style={{ background: `${color}18`, color }}>
                                        <Icon size={18} />
                                    </div>
                                    <div className={styles.insightContent}>
                                        <h4>{insight.title}</h4>
                                        <p>{insight.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

        </div>
    );
}
