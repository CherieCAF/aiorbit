'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wrench,
  Target,
  BookOpen,
  Lightbulb,
  BarChart3,
  Settings,
  Globe,
  Compass,
  Users,
  ChevronLeft,
  ChevronRight,
  Orbit,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/tools', label: 'AI Tools', icon: Wrench },
  { href: '/directory', label: 'Directory', icon: Compass },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/decisions', label: 'Decisions', icon: BookOpen },
  { href: '/ecosystem', label: 'Ecosystem', icon: Globe },
  { href: '/learning', label: 'Learning', icon: Lightbulb },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        className={styles.mobileMenuBtn}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Orbit size={24} />
          </div>
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoAi}>AI</span>
              <span className={styles.logoOrbit}>Orbit</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <div className={styles.navIcon}>
                  <Icon size={20} />
                </div>
                {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                {isActive && <div className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span className={styles.themeLabel}>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
        </button>

        {/* User Profile & Logout */}
        {user && (
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                <User size={16} />
              </div>
              {!collapsed && (
                <div className={styles.userNameContainer}>
                  <div className={styles.userName}>{user.name}</div>
                  <div className={styles.userDept}>{user.department}</div>
                </div>
              )}
            </div>
            <button
              className={styles.logoutBtn}
              onClick={logout}
              title="Log out"
            >
              <LogOut size={16} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>
    </>
  );
}
