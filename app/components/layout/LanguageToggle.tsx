"use client";
import React, { useState, useRef, useEffect } from 'react';

interface LanguageToggleProps {
  currentLang: string;
  onLangChange: (lang: string) => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ currentLang, onLangChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Map display names
  const getDisplayName = (lang: string) => {
    switch (lang) {
      case 'English': return 'EN';
      case 'Cantonese': return '粵語';
      case '简体中文': return '简体';
      default: return lang.substring(0, 2).toUpperCase();
    }
  };

  const getFullName = (lang: string) => {
    switch (lang) {
      case 'English': return 'English';
      case 'Cantonese': return '粵語 (繁體中文)';
      case '简体中文': return '简体中文';
      default: return lang;
    }
  };

  const languages = ['English', 'Cantonese', '简体中文'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '6px 12px',
          borderRadius: '8px',
          backgroundColor: '#F3F4F6',
          border: '1px solid #E5E7EB',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          color: '#1F2937',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        {getDisplayName(currentLang)}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          backgroundColor: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          zIndex: 50,
          minWidth: '120px',
          overflow: 'hidden'
        }}>
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                onLangChange(lang);
                setIsOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                backgroundColor: currentLang === lang ? '#EFF6FF' : 'white',
                color: currentLang === lang ? '#2563EB' : '#4B5563',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: currentLang === lang ? '600' : '400',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentLang !== lang) {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }
              }}
              onMouseLeave={(e) => {
                if (currentLang !== lang) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {getFullName(lang)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
