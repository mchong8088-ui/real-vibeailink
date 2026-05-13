// components/layout/LanguageToggle.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Languages, ChevronDown, Check } from 'lucide-react';

interface LanguageToggleProps {
  currentLang: string;
  onLangChange: (lang: string) => void;
}

export function LanguageToggle({ currentLang, onLangChange }: LanguageToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { label: "粵語 (繁體中文)", value: "Cantonese", flag: "🇭🇰", short: "廣" },
    { label: "简体中文", value: "简体中文", flag: "🇨🇳", short: "中" },
    { label: "English", value: "English", flag: "🇺🇸", short: "EN" }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLangData = languages.find(l => l.value === currentLang);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'transparent',
          border: 'none',
          borderRadius: '9999px',
          padding: '6px 12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <Languages size={16} style={{ color: '#3B82F6' }} />
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#3B82F6',
          textTransform: 'uppercase',
        }}>
          {currentLangData?.short || 'EN'}
        </span>
        <ChevronDown size={12} style={{ 
          color: '#3B82F6',
          transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          marginTop: '8px',
          width: '200px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          zIndex: 110,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}>
          {languages.map((lang) => (
            <button
              key={lang.value}
              onClick={() => {
                onLangChange(lang.value);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: currentLang === lang.value ? '700' : '500',
                backgroundColor: currentLang === lang.value ? '#EFF6FF' : 'white',
                color: currentLang === lang.value ? '#2563EB' : '#475569',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (currentLang !== lang.value) {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                }
              }}
              onMouseLeave={(e) => {
                if (currentLang !== lang.value) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>{lang.flag}</span>
                <span>{lang.label}</span>
              </div>
              {currentLang === lang.value && (
                <Check size={14} style={{ color: '#2563EB' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}