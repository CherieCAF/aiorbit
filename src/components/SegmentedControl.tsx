'use client';

import React from 'react';
import styles from './SegmentedControl.module.css';

interface SegmentOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  activeId: string;
  onChange: (id: string) => void;
  fullWidth?: boolean;
}

export default function SegmentedControl({
  options,
  activeId,
  onChange,
  fullWidth = false,
}: SegmentedControlProps) {
  const activeIndex = options.findIndex((opt) => opt.id === activeId);

  return (
    <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ''}`}>
      <div 
        className={styles.indicator} 
        style={{ 
          width: `${100 / options.length}%`,
          transform: `translateX(${activeIndex * 100}%)`
        }} 
      />
      {options.map((option) => (
        <button
          key={option.id}
          className={`${styles.segment} ${activeId === option.id ? styles.active : ''}`}
          onClick={() => onChange(option.id)}
        >
          {option.icon && <span className={styles.icon}>{option.icon}</span>}
          <span className={styles.label}>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
