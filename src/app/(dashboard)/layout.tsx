'use client';

import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import { useAuth } from "@/components/AuthProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen" style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-main)',
                color: 'var(--text-tertiary)'
            }}>
                <div className="animate-pulse">Initializing Command Center...</div>
            </div>
        );
    }

    if (!user) return null; // AuthProvider handles redirect

    return (
        <div className="app-layout">
            <CommandPalette />
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
