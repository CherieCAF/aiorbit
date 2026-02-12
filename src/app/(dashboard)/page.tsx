'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  Target,
  BookOpen,
  Lightbulb,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Plus,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import type { Tool, Goal, Decision } from '@/lib/db';
import { generateInsights, type Insight } from '@/lib/insights';
import { useAuth } from '@/components/AuthProvider';
import styles from './page.module.css';

const quickActions = [
  { label: 'Add AI Tool', icon: Plus, href: '/tools', color: '#6366f1' },
  { label: 'Set a Goal', icon: Target, href: '/goals', color: '#22c55e' },
  { label: 'Log Decision', icon: BookOpen, href: '/decisions', color: '#f59e0b' },
  { label: 'Explore Learning', icon: Lightbulb, href: '/learning', color: '#8b5cf6' },
];

const INSIGHT_ICONS = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  tip: Lightbulb,
};

const INSIGHT_COLORS = {
  info: '#3b82f6',
  warning: '#f59e0b',
  success: '#22c55e',
  tip: '#8b5cf6',
};

// Unify all entities into a single timeline
interface ActivityItem {
  id: string;
  title: string;
  type: 'tool' | 'goal' | 'decision';
  meta: string;
  date: string;
  icon: typeof Wrench;
  color: string;
  href: string;
}

function buildActivityFeed(tools: Tool[], goals: Goal[], decisions: Decision[]): ActivityItem[] {
  const items: ActivityItem[] = [];

  tools.forEach((t) => {
    items.push({
      id: `tool-${t.id}`,
      title: t.name,
      type: 'tool',
      meta: `${t.category} · ${t.status}${t.monthlyCost > 0 ? ` · $${t.monthlyCost}/mo` : ''}`,
      date: t.updatedAt || t.addedAt,
      icon: Wrench,
      color: '#6366f1',
      href: '/tools',
    });
  });

  goals.forEach((g) => {
    items.push({
      id: `goal-${g.id}`,
      title: g.title,
      type: 'goal',
      meta: `${g.category} · ${g.progress}% · ${g.status}`,
      date: g.updatedAt || g.createdAt,
      icon: Target,
      color: '#22c55e',
      href: '/goals',
    });
  });

  decisions.forEach((d) => {
    items.push({
      id: `dec-${d.id}`,
      title: d.title,
      type: 'decision',
      meta: `${d.category} · ${d.outcomeStatus || 'pending'}`,
      date: d.updatedAt || d.createdAt,
      icon: BookOpen,
      color: '#f59e0b',
      href: '/decisions',
    });
  });

  // Sort newest first
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items.slice(0, 8);
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function Dashboard() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [oversight, setOversight] = useState<any>(null);
  const [pulseTab, setPulseTab] = useState<'tool' | 'member'>('tool');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAll = useCallback(async () => {
    try {
      const [t, g, d, o] = await Promise.all([
        fetch('/api/tools').then((r) => r.json()),
        fetch('/api/goals').then((r) => r.json()),
        fetch('/api/decisions').then((r) => r.json()),
        fetch('/api/oversight').then((r) => r.json()),
      ]);
      if (Array.isArray(t)) setTools(t);
      if (Array.isArray(g)) setGoals(g);
      if (Array.isArray(d)) setDecisions(d);
      if (o && o.metrics) setOversight(o);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh every 30s + refetch on window focus
  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    const onFocus = () => fetchAll();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchAll]);

  const activeTools = tools.filter((t) => t.status === 'active');
  const activeGoals = goals.filter((g) => g.status === 'active');

  // Smart insights from insights engine
  const smartInsights = generateInsights(tools, goals, decisions).slice(0, 4);

  // Unified activity feed
  const activityFeed = buildActivityFeed(tools, goals, decisions);

  const stats = oversight?.metrics || {
    monthlyBurn: 0,
    governanceScore: 100,
    shadowAiCount: 0,
    spendPerSeat: 0
  };

  const metrics = [
    {
      label: 'Monthly AI Burn',
      value: loading ? '—' : `$${stats.monthlyBurn.toLocaleString()}`,
      sub: loading ? '' : `Trend: ${stats.burnTrend >= 0 ? '+' : ''}${stats.burnTrend}% vs last month`,
      icon: DollarSign,
      color: stats.burnTrend > 10 ? '#ef4444' : '#6366f1',
      bg: stats.burnTrend > 10 ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
      href: '/analytics',
    },
    {
      label: 'Governance Score',
      value: loading ? '—' : `${stats.governanceScore}%`,
      sub: loading ? '' : `${stats.governanceScore > 90 ? 'Audit Ready' : 'Action Required'}`,
      icon: CheckCircle,
      color: stats.governanceScore > 80 ? '#22c55e' : '#f59e0b',
      bg: stats.governanceScore > 80 ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
      href: '/team',
    },
    {
      label: 'Shadow AI Alerts',
      value: loading ? '—' : String(stats.shadowAiCount),
      sub: loading ? '' : 'Unclaimed charges',
      icon: AlertTriangle,
      color: stats.shadowAiCount > 0 ? '#f59e0b' : '#3b82f6',
      bg: stats.shadowAiCount > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)',
      href: '/team',
    },
    {
      label: 'Efficiency Rate',
      value: loading ? '—' : `$${stats.spendPerSeat}`,
      sub: loading ? '' : 'Spend per seat',
      icon: BarChart3,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.12)',
      href: '/analytics',
    },
  ];

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className="page-header animate-fade-in">
        <h1>Welcome, {user?.name.split(' ')[0]}</h1>
        <p>Your AI Command Center & Governance Portal</p>
      </div>

      {/* Metrics Row */}
      <div className={`grid-4 ${styles.metricsGrid}`}>
        {metrics.map((metric, i) => (
          <Link
            key={metric.label}
            href={metric.href}
            className={`card metric-card animate-fade-in stagger-${i + 1} ${styles.metricLink}`}
          >
            <div
              className="metric-icon"
              style={{ background: metric.bg, color: metric.color }}
            >
              <metric.icon size={22} />
            </div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-label">{metric.label}</div>
            {metric.sub && <div className={styles.metricSub}>{metric.sub}</div>}
          </Link>
        ))}
      </div>

      {/* Executive Pulse: Tool & Member Breakdown */}
      <div className={`animate-fade-in stagger-2 ${styles.pulseSection}`}>
        <div className="section-header">
          <h2><Zap size={20} /> Executive Pulse</h2>
          <div className={styles.pulseTabs}>
            <button
              className={`${styles.pulseTab} ${pulseTab === 'tool' ? styles.pulseTabActive : ''}`}
              onClick={() => setPulseTab('tool')}
            >
              Top Tools
            </button>
            <button
              className={`${styles.pulseTab} ${pulseTab === 'member' ? styles.pulseTabActive : ''}`}
              onClick={() => setPulseTab('member')}
            >
              Top Staff
            </button>
          </div>
        </div>

        <div className={`card ${styles.pulseCard}`}>
          {pulseTab === 'tool' ? (
            <div className={styles.pulseGrid}>
              {oversight?.spendingInsights?.byTool?.map((item: any) => (
                <div key={item.id} className={styles.pulseItem}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemValue}>${item.spend}</span>
                  </div>
                  <div className={styles.itemBar}>
                    <div
                      className={styles.itemFill}
                      style={{
                        width: `${Math.min(100, (item.spend / (item.commitment || 1)) * 100)}%`,
                        background: 'var(--accent-primary)'
                      }}
                    />
                  </div>
                  <div className={styles.itemMeta}>Commitment: ${item.commitment}/mo</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.pulseGrid}>
              {oversight?.spendingInsights?.byMember?.map((item: any) => (
                <div key={item.id} className={styles.pulseItem}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemValue}>${item.spend}</span>
                  </div>
                  <div className={styles.itemBar}>
                    <div
                      className={styles.itemFill}
                      style={{
                        width: `${Math.min(100, (item.spend / (item.budget || 1)) * 100)}%`,
                        background: (item.spend > item.budget) ? '#ef4444' : '#22c55e'
                      }}
                    />
                  </div>
                  <div className={styles.itemMeta}>Budget: ${item.budget} ({item.department})</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Priority Items */}
      <div className={`grid-2 ${styles.mainGrid}`}>
        {/* Oversight Alerts */}
        <div className="animate-fade-in stagger-2">
          <div className="section-header">
            <h2>Governance Radar</h2>
            <div className="badge badge-error">{oversight?.alerts?.length || 0} Alerts</div>
          </div>
          <div className={styles.insightsList}>
            {oversight?.alerts?.length > 0 ? (
              oversight.alerts.map((alert: any) => (
                <div key={alert.id} className={`glass-card ${styles.insightCard}`} style={{ borderLeft: `4px solid ${alert.severity === 'high' ? '#ef4444' : '#f59e0b'}` }}>
                  <div className={styles.insightIcon} style={{
                    background: alert.severity === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    color: alert.severity === 'high' ? '#ef4444' : '#f59e0b'
                  }}>
                    {alert.type === 'alert' ? <ShieldAlert size={16} /> : <Zap size={16} />}
                  </div>
                  <div className={styles.insightContent}>
                    <h4 style={{ color: alert.severity === 'high' ? '#ef4444' : 'inherit' }}>{alert.title}</h4>
                    <p>{alert.meta}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                <CheckCircle size={32} color="var(--color-success)" style={{ opacity: 0.5, marginBottom: 'var(--space-sm)' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>All systems compliant.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in stagger-3">
          <div className="section-header">
            <h2>Management Portal</h2>
          </div>
          <div className={styles.actionsGrid}>
            <Link href="/team" className={`card ${styles.actionCard}`}>
              <div className={styles.actionIcon} style={{ background: '#6366f118', color: '#6366f1' }}>
                <Users size={20} />
              </div>
              <span className={styles.actionLabel}>Manage Team & Invoices</span>
              <ArrowRight size={16} className={styles.actionArrow} />
            </Link>
            <Link href="/tools?action=add" className={`card ${styles.actionCard}`}>
              <div className={styles.actionIcon} style={{ background: '#22c55e18', color: '#22c55e' }}>
                <Plus size={20} />
              </div>
              <span className={styles.actionLabel}>Provision New AI Tool</span>
              <ArrowRight size={16} className={styles.actionArrow} />
            </Link>
            <Link href="/analytics" className={`card ${styles.actionCard}`}>
              <div className={styles.actionIcon} style={{ background: '#f59e0b18', color: '#f59e0b' }}>
                <BarChart3 size={20} />
              </div>
              <span className={styles.actionLabel}>Analyze Spend ROI</span>
              <ArrowRight size={16} className={styles.actionArrow} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity — Unified */}
      <div className="animate-fade-in stagger-4">
        <div className="section-header">
          <h2>Ledger Activity</h2>
          <span className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            Auto-refreshing
          </span>
        </div>
        {activityFeed.length > 0 ? (
          <div className={styles.recentList}>
            {activityFeed.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.id} href={item.href} className={`glass-card ${styles.recentItem}`}>
                  <div className={styles.recentIcon} style={{ background: `${item.color}18`, color: item.color }}>
                    <Icon size={16} />
                  </div>
                  <div className={styles.recentInfo}>
                    <span className={styles.recentName}>{item.title}</span>
                    <span className={styles.recentMeta}>{item.meta}</span>
                  </div>
                  <span className={styles.recentTime}>{timeAgo(item.date)}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">
                <Clock size={28} />
              </div>
              <h3>No activity yet</h3>
              <p>Add tools or members to see updates here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { ShieldAlert, Users } from 'lucide-react';

