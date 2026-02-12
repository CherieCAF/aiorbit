'use client';

import { useState } from 'react';
import { Mail, Lock, User, UserPlus, ShieldCheck, AlertCircle, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ToastProvider';
import styles from '../login/auth.module.css';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [department, setDepartment] = useState('Engineering');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, department }),
            });

            const data = await res.json();

            if (res.ok) {
                addToast('Welcome to AIOrbit! Your profile has been created.', 'success');
                login(data);
            } else {
                setError(data.error || 'Registration failed');
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
                    <p>Create your profile to join the team</p>
                </div>

                {error && (
                    <div className={styles.errorAlert}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="name">Full Name</label>
                        <div className={styles.inputWrapper}>
                            <User size={16} className={styles.inputIcon} />
                            <input
                                id="name"
                                type="text"
                                className={styles.input}
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

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
                        <label htmlFor="department">Department</label>
                        <div className={styles.inputWrapper}>
                            <Building2 size={16} className={styles.inputIcon} />
                            <select
                                id="department"
                                className={styles.input}
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                required
                            >
                                <option value="Engineering">Engineering</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Product">Product</option>
                                <option value="Operations">Operations</option>
                                <option value="Design">Design</option>
                                <option value="Other">Other</option>
                            </select>
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
                        {loading ? 'Creating Profile...' : (
                            <>
                                <UserPlus size={18} />
                                Get Started
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    Already have an account?{' '}
                    <Link href="/login" className={styles.link}>
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
