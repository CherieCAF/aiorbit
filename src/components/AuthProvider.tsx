'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Member } from '@/lib/db';

interface AuthContextType {
    user: Member | null;
    loading: boolean;
    login: (member: Member) => void;
    logout: () => void;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ['/login', '/signup', '/api/seed'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('aiorbit_user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    localStorage.removeItem('aiorbit_user');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    useEffect(() => {
        if (!loading) {
            const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));
            if (!user && !isPublicRoute) {
                router.push('/login');
            } else if (user && isPublicRoute) {
                router.push('/');
            }
        }
    }, [user, loading, pathname, router]);

    const login = (member: Member) => {
        setUser(member);
        localStorage.setItem('aiorbit_user', JSON.stringify(member));
        router.push('/');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('aiorbit_user');
        router.push('/login');
    };

    const refreshSession = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/members`);
            if (res.ok) {
                const members: Member[] = await res.json();
                const updated = members.find(m => m.id === user.id);
                if (updated) {
                    setUser(updated);
                    localStorage.setItem('aiorbit_user', JSON.stringify(updated));
                }
            }
        } catch (e) {
            console.error('Failed to refresh session', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
