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
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [t, g, d] = await Promise.all([
        fetch('/api/tools').then((r) => r.json()),
        fetch('/api/goals').then((r) => r.json()),
        fetch('/api/decisions').then((r) => r.json()),
      ]);
      if (Array.isArray(t)) setTools(t);
      if (Array.isArray(g)) setGoals(g);
      if (Array.isArray(d)) setDecisions(d);
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
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const totalSpend = tools.reduce((sum, t) => sum + (t.status !== 'paused' ? t.monthlyCost : 0), 0);

  // Smart insights from insights engine
  const smartInsights = generateInsights(tools, goals, decisions).slice(0, 4);

  // Unified activity feed
  const activityFeed = buildActivityFeed(tools, goals, decisions);

  const metrics = [
    {
      label: 'AI Tools',
      value: loading ? '—' : String(tools.length),
      sub: loading ? '' : `${activeTools.length} active`,
      icon: Wrench,
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.12)',
      href: '/tools',
    },
    {
      label: 'Active Goals',
      value: loading ? '—' : String(activeGoals.length),
      sub: loading ? '' : `${completedGoals.length} completed`,
      icon: Target,
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.12)',
      href: '/goals',
    },
    {
      label: 'Decisions',
      value: loading ? '—' : String(decisions.length),
      sub: loading ? '' : `${decisions.filter(d => d.outcomeStatus === 'positive').length} positive`,
      icon: BookOpen,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      href: '/decisions',
    },
    {
      label: 'Monthly Spend',
      value: loading ? '—' : `$${totalSpend.toFixed(0)}`,
      sub: loading ? '' : `across ${tools.filter(t => t.monthlyCost > 0).length} paid tools`,
      icon: DollarSign,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.12)',
      href: '/analytics',
    },
  ];

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className="page-header animate-fade-in">
        <h1>Command Center</h1>
        <p>Your AI ecosystem at a glance</p>
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

      {/* Quick Actions + Smart Insights */}
      <div className={`grid-2 ${styles.mainGrid}`}>
        {/* Quick Actions */}
        <div className="animate-fade-in stagger-2">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className={styles.actionsGrid}>
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`card ${styles.actionCard}`}
              >
                <div
                  className={styles.actionIcon}
                  style={{ background: `${action.color}18`, color: action.color }}
                >
                  <action.icon size={20} />
                </div>
                <span className={styles.actionLabel}>{action.label}</span>
                <ArrowRight size={16} className={styles.actionArrow} />
              </Link>
            ))}
          </div>
        </div>

        {/* Smart Insights */}
        <div className="animate-fade-in stagger-3">
          <div className="section-header">
            <h2>Smart Insights</h2>
            <Link href="/analytics" className="btn btn-ghost">
              <BarChart3 size={14} /> View all
            </Link>
          </div>
          <div className={styles.insightsList}>
            {smartInsights.map((insight) => {
              const Icon = INSIGHT_ICONS[insight.type];
              const color = INSIGHT_COLORS[insight.type];
              return (
                <div key={insight.id} className={`glass-card ${styles.insightCard}`}>
                  <div className={styles.insightIcon} style={{ background: `${color}18`, color }}>
                    <Icon size={16} />
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
      </div>

      {/* Recent Activity — Unified */}
      <div className="animate-fade-in stagger-4">
        <div className="section-header">
          <h2>Recent Activity</h2>
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
              <p>Add your first AI tool to see activity here.</p>
              <Link href="/tools" className="btn btn-primary">
                <Plus size={16} />
                Add Your First Tool
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
