'use client';

import { useState } from 'react';
import { Mail, Lock, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ToastProvider';
import styles from './auth.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                addToast('Welcome back to the Command Center', 'success');
                login(data);
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={`glass-card ${styles.authCard}`}>
                <div className={styles.header}>
                    <div className={styles.logoIcon}>
                        <ShieldCheck size={28} />
                    </div>
                    <h1>AIOrbit</h1>
                    <p>Enter your command center</p>
                </div>

                {error && (
                    <div className={styles.errorAlert}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Work Email</label>
                        <div className={styles.inputWrapper}>
                            <Mail size={16} className={styles.inputIcon} />
                            <input
                                id="email"
                                type="email"
                                className={styles.input}
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <div className={styles.inputWrapper}>
                            <Lock size={16} className={styles.inputIcon} />
                            <input
                                id="password"
                                type="password"
                                className={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Authenticating...' : (
                            <>
                                <LogIn size={18} />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className={styles.link}>
                        Join the team
                    </Link>
                </div>
            </div>
        </div>
    );
}
