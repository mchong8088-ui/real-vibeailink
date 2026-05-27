"use client";
import React, { useState, useRef } from 'react';

interface SourceMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSource: (sourceType: string, sourceData?: any) => void;
  langKey: string;
}

export const SourceMenu: React.FC<SourceMenuProps> = ({
  isOpen,
  onClose,
  onSelectSource,
  langKey,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const getText = () => {
    if (langKey === 'Cantonese') {
      return {
        title: '新增分析來源',
        urlOption: '分析新聞連結',
        urlPlaceholder: '貼上 Motley Fool, CNBC 等連結',
        photoOption: '拍照或上傳文件',
        photoDesc: '掃描實體報告或截圖',
        fileOption: '上傳數據文件',
        fileDesc: 'PDF, CSV, 或技術資料表',
        back: '返回'
      };
    } else if (langKey === '简体中文') {
      return {
        title: '新增分析来源',
        urlOption: '分析新闻链接',
        urlPlaceholder: '贴上 Motley Fool, CNBC 等链接',
        photoOption: '拍照或上传文件',
        photoDesc: '扫描实体报告或截图',
        fileOption: '上传数据文件',
        fileDesc: 'PDF, CSV, 或技术资料表',
        back: '返回'
      };
    } else {
      return {
        title: 'Add Analysis Source',
        urlOption: 'Analyze News Link',
        urlPlaceholder: 'Paste links from Motley Fool, CNBC, etc.',
        photoOption: 'Take Photo or Upload',
        photoDesc: 'Scan physical reports or screenshots',
        fileOption: 'Upload Data File',
        fileDesc: 'PDF, CSV, or Technical Sheets',
        back: 'Back'
      };
    }
  };

  const t = getText();

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onSelectSource('url', urlInput.trim());
      // Emit custom event for SmartInputSystem
      window.dispatchEvent(new CustomEvent('source-select', { 
        detail: { sourceType: 'url', sourceData: urlInput.trim() } 
      }));
      setUrlInput('');
      setShowUrlInput(false);
      onClose();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const sourceData = {
          name: file.name,
          content: e.target?.result,
          type: file.type,
        };
        onSelectSource(type, sourceData);
        window.dispatchEvent(new CustomEvent('source-select', { 
          detail: { sourceType: type, sourceData } 
        }));
      };
      reader.readAsDataURL(file);
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        width: '100%',
        maxWidth: '500px',
        padding: '24px',
        animation: 'slideUp 0.3s ease',
      }} onClick={(e) => e.stopPropagation()}>
        
        {!showUrlInput ? (
          <>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>{t.title}</h3>
            
            <button
              onClick={() => setShowUrlInput(true)}
              style={{
                width: '100%',
                padding: '16px',
                marginBottom: '12px',
                backgroundColor: '#F3F4F6',
                border: 'none',
                borderRadius: '12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🔗 {t.urlOption}</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>{t.urlPlaceholder}</div>
            </button>
            
            <button
              onClick={() => photoInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '16px',
                marginBottom: '12px',
                backgroundColor: '#F3F4F6',
                border: 'none',
                borderRadius: '12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📷 {t.photoOption}</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>{t.photoDesc}</div>
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '16px',
                marginBottom: '20px',
                backgroundColor: '#F3F4F6',
                border: 'none',
                borderRadius: '12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📁 {t.fileOption}</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>{t.fileDesc}</div>
            </button>
            
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#6B7280',
                cursor: 'pointer',
              }}
            >
              {t.back}
            </button>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>🔗 {t.urlOption}</h3>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={t.urlPlaceholder}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowUrlInput(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#F3F4F6',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: urlInput.trim() ? '#22C55E' : '#D1D5DB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: urlInput.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Add
              </button>
            </div>
          </>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,.txt,.doc,.docx"
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e, 'file')}
        />
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e, 'photo')}
        />
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
