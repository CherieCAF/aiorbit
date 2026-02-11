'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Wrench,
    Target,
    Maximize2,
    Minimize2,
    Info,
} from 'lucide-react';
import type { Tool, Goal } from '@/lib/db';
import styles from './page.module.css';

interface MapNode {
    id: string;
    label: string;
    type: 'tool' | 'goal';
    x: number;
    y: number;
    color: string;
    radius: number;
    data: Tool | Goal;
}

interface MapEdge {
    from: string;
    to: string;
}

const TOOL_COLORS: Record<string, string> = {
    Productivity: '#6366f1',
    Creative: '#ec4899',
    Code: '#22c55e',
    Research: '#3b82f6',
    Communication: '#f59e0b',
    Analytics: '#8b5cf6',
    Writing: '#06b6d4',
    Other: '#64748b',
};

const GOAL_COLORS: Record<string, string> = {
    Career: '#6366f1',
    Learning: '#3b82f6',
    Project: '#22c55e',
    Financial: '#f59e0b',
    Health: '#ec4899',
    Other: '#64748b',
};

function layoutNodes(tools: Tool[], goals: Goal[], width: number, height: number): { nodes: MapNode[]; edges: MapEdge[] } {
    const cx = width / 2;
    const cy = height / 2;
    const nodes: MapNode[] = [];
    const edges: MapEdge[] = [];

    // Place goals in inner ring
    const goalRadius = Math.min(width, height) * 0.18;
    goals.forEach((goal, i) => {
        const angle = (i / Math.max(goals.length, 1)) * Math.PI * 2 - Math.PI / 2;
        nodes.push({
            id: goal.id,
            label: goal.title,
            type: 'goal',
            x: cx + Math.cos(angle) * goalRadius,
            y: cy + Math.sin(angle) * goalRadius,
            color: GOAL_COLORS[goal.category] || '#64748b',
            radius: 28,
            data: goal,
        });
    });

    // Place tools in outer ring
    const toolRadius = Math.min(width, height) * 0.36;
    tools.forEach((tool, i) => {
        const angle = (i / Math.max(tools.length, 1)) * Math.PI * 2 - Math.PI / 2;
        nodes.push({
            id: tool.id,
            label: tool.name,
            type: 'tool',
            x: cx + Math.cos(angle) * toolRadius,
            y: cy + Math.sin(angle) * toolRadius,
            color: TOOL_COLORS[tool.category] || '#64748b',
            radius: 22,
            data: tool,
        });
    });

    // Edges: goals linkedToolIds → tools
    goals.forEach((goal) => {
        goal.linkedToolIds.forEach((toolId) => {
            if (tools.some(t => t.id === toolId)) {
                edges.push({ from: goal.id, to: toolId });
            }
        });
    });

    return { nodes, edges };
}

export default function EcosystemPage() {
    const [tools, setTools] = useState<Tool[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    const fetchData = useCallback(async () => {
        try {
            const [tRes, gRes] = await Promise.all([
                fetch('/api/tools'),
                fetch('/api/goals'),
            ]);
            const t = await tRes.json();
            const g = await gRes.json();
            if (Array.isArray(t)) setTools(t);
            if (Array.isArray(g)) setGoals(g);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Responsive sizing
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: Math.max(rect.height, 500) });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [fullscreen]);

    const { nodes, edges } = useMemo(
        () => layoutNodes(tools, goals, dimensions.width, dimensions.height),
        [tools, goals, dimensions]
    );

    const selectedNodeData = useMemo(
        () => nodes.find(n => n.id === selectedNode),
        [nodes, selectedNode]
    );

    const connectedIds = useMemo(() => {
        if (!hoveredNode && !selectedNode) return new Set<string>();
        const focus = hoveredNode || selectedNode;
        const ids = new Set<string>();
        if (focus) {
            ids.add(focus);
            edges.forEach(e => {
                if (e.from === focus) ids.add(e.to);
                if (e.to === focus) ids.add(e.from);
            });
        }
        return ids;
    }, [hoveredNode, selectedNode, edges]);

    const hasConnections = edges.length > 0;
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;

    return (
        <div className={`${styles.ecosystemPage} ${fullscreen ? styles.fullscreen : ''}`}>
            <div className="page-header animate-fade-in">
                <h1>Ecosystem Map</h1>
                <p>
                    {tools.length} tool{tools.length !== 1 ? 's' : ''} · {goals.length} goal{goals.length !== 1 ? 's' : ''} · {edges.length} connection{edges.length !== 1 ? 's' : ''}
                </p>
            </div>

            <div className={`${styles.mapContainer} animate-fade-in stagger-1`} ref={containerRef}>
                {/* Toolbar */}
                <div className={styles.mapToolbar}>
                    <div className={styles.legend}>
                        <span className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: '#6366f1' }} /> Tools
                        </span>
                        <span className={styles.legendItem}>
                            <span className={styles.legendDotGoal} /> Goals
                        </span>
                        <span className={styles.legendItem}>
                            <span className={styles.legendLine} /> Connections
                        </span>
                    </div>
                    <button
                        className={styles.fullscreenBtn}
                        onClick={() => setFullscreen(!fullscreen)}
                        title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                        {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.pulse} />
                        <p>Loading ecosystem...</p>
                    </div>
                ) : tools.length === 0 && goals.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Info size={40} />
                        <h3>No data yet</h3>
                        <p>Add tools and goals, then link them together to see your AI ecosystem.</p>
                    </div>
                ) : (
                    <svg
                        width={dimensions.width}
                        height={dimensions.height}
                        className={styles.mapSvg}
                        onClick={() => setSelectedNode(null)}
                    >
                        <defs>
                            {/* Gradient for center glow */}
                            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="rgba(99,102,241,0.08)" />
                                <stop offset="100%" stopColor="transparent" />
                            </radialGradient>
                            {/* Edge gradient */}
                            <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="rgba(99,102,241,0.4)" />
                                <stop offset="100%" stopColor="rgba(99,102,241,0.1)" />
                            </linearGradient>
                        </defs>

                        {/* Center glow */}
                        <circle cx={cx} cy={cy} r={Math.min(dimensions.width, dimensions.height) * 0.42} fill="url(#centerGlow)" />

                        {/* Orbit rings */}
                        <circle cx={cx} cy={cy} r={Math.min(dimensions.width, dimensions.height) * 0.18} fill="none" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="4,6" opacity="0.5" />
                        <circle cx={cx} cy={cy} r={Math.min(dimensions.width, dimensions.height) * 0.36} fill="none" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="4,6" opacity="0.3" />

                        {/* Edges */}
                        {edges.map((edge, i) => {
                            const fromNode = nodes.find(n => n.id === edge.from);
                            const toNode = nodes.find(n => n.id === edge.to);
                            if (!fromNode || !toNode) return null;
                            const isHighlighted = connectedIds.has(edge.from) && connectedIds.has(edge.to);
                            const isActive = hoveredNode || selectedNode;
                            return (
                                <line
                                    key={`edge-${i}`}
                                    x1={fromNode.x}
                                    y1={fromNode.y}
                                    x2={toNode.x}
                                    y2={toNode.y}
                                    stroke={isHighlighted ? 'rgba(99,102,241,0.6)' : 'url(#edgeGrad)'}
                                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                                    opacity={isActive ? (isHighlighted ? 1 : 0.1) : 0.6}
                                    className={styles.edge}
                                />
                            );
                        })}

                        {/* Nodes */}
                        {nodes.map((node) => {
                            const isActive = hoveredNode || selectedNode;
                            const isConnected = connectedIds.has(node.id);
                            const isFocused = node.id === hoveredNode || node.id === selectedNode;
                            const opacity = isActive ? (isConnected ? 1 : 0.2) : 1;
                            const scale = isFocused ? 1.15 : 1;

                            return (
                                <g
                                    key={node.id}
                                    transform={`translate(${node.x}, ${node.y}) scale(${scale})`}
                                    className={styles.node}
                                    onMouseEnter={() => setHoveredNode(node.id)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                    onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id === selectedNode ? null : node.id); }}
                                    opacity={opacity}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* Glow */}
                                    {isFocused && (
                                        <circle r={node.radius + 8} fill={node.color} opacity="0.15" />
                                    )}
                                    {/* Background circle */}
                                    <circle
                                        r={node.radius}
                                        fill="var(--bg-card)"
                                        stroke={node.color}
                                        strokeWidth={isFocused ? 3 : 2}
                                    />
                                    {/* Icon */}
                                    <foreignObject x={-10} y={-10} width={20} height={20}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: node.color }}>
                                            {node.type === 'tool' ? <Wrench size={14} /> : <Target size={14} />}
                                        </div>
                                    </foreignObject>
                                    {/* Label */}
                                    <text
                                        y={node.radius + 16}
                                        textAnchor="middle"
                                        fill="var(--text-primary)"
                                        fontSize="11"
                                        fontWeight="600"
                                        className={styles.nodeLabel}
                                    >
                                        {node.label.length > 14 ? node.label.slice(0, 12) + '…' : node.label}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Center label */}
                        <text x={cx} y={cy} textAnchor="middle" fill="var(--text-tertiary)" fontSize="11" fontWeight="600" dy="4">
                            AIOrbit
                        </text>
                    </svg>
                )}

                {/* Detail Panel */}
                {selectedNodeData && (
                    <div className={styles.detailPanel} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.detailHeader}>
                            <div className={styles.detailIcon} style={{ background: selectedNodeData.color }}>
                                {selectedNodeData.type === 'tool' ? <Wrench size={16} /> : <Target size={16} />}
                            </div>
                            <div>
                                <h4>{selectedNodeData.label}</h4>
                                <span className={styles.detailType}>{selectedNodeData.type === 'tool' ? 'AI Tool' : 'Goal'}</span>
                            </div>
                        </div>
                        {selectedNodeData.type === 'tool' && (
                            <div className={styles.detailBody}>
                                <span>Category: {(selectedNodeData.data as Tool).category}</span>
                                <span>Status: {(selectedNodeData.data as Tool).status}</span>
                                <span>Data Access: {(selectedNodeData.data as Tool).dataAccess}</span>
                            </div>
                        )}
                        {selectedNodeData.type === 'goal' && (
                            <div className={styles.detailBody}>
                                <span>Category: {(selectedNodeData.data as Goal).category}</span>
                                <span>Progress: {(selectedNodeData.data as Goal).progress}%</span>
                                <span>Status: {(selectedNodeData.data as Goal).status}</span>
                            </div>
                        )}
                        <div className={styles.detailConnections}>
                            <strong>
                                {edges.filter(e => e.from === selectedNodeData.id || e.to === selectedNodeData.id).length} connection(s)
                            </strong>
                        </div>
                    </div>
                )}

                {/* Hint */}
                {!loading && hasConnections && !selectedNode && (
                    <div className={styles.hint}>
                        Hover to trace connections · Click for details
                    </div>
                )}
            </div>
        </div>
    );
}
