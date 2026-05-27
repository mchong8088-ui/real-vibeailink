"use client";
import React, { useState, useRef, useEffect } from 'react';

interface Attachment {
  id: string;
  type: 'url' | 'file' | 'photo';
  name: string;
  content?: string;
  preview?: string;
}

interface SmartInputSystemProps {
  langKey: string;
  onAnalyze: (ticker: string, attachments?: Attachment[]) => void;
  onPlusClick: () => void;
  systemInfo: any;
  analysisText?: string;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
}

export const SmartInputSystem: React.FC<SmartInputSystemProps> = ({
  langKey,
  onAnalyze,
  onPlusClick,
  systemInfo,
  analysisText,
  attachments: externalAttachments,
  onAttachmentsChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(externalAttachments || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (externalAttachments) {
      setAttachments(externalAttachments);
    }
  }, [externalAttachments]);

  const updateAttachments = (newAttachments: Attachment[]) => {
    setAttachments(newAttachments);
    if (onAttachmentsChange) {
      onAttachmentsChange(newAttachments);
    }
  };

  const handleAddURL = (url: string) => {
    const newAttachment: Attachment = {
      id: Date.now().toString(),
      type: 'url',
      name: url,
      content: url,
    };
    updateAttachments([...attachments, newAttachment]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'photo') => {
    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const newAttachment: Attachment = {
          id: Date.now().toString(),
          type: type,
          name: file.name,
          content: e.target?.result as string,
          preview: type === 'photo' ? e.target?.result as string : undefined,
        };
        updateAttachments([...attachments, newAttachment]);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const removeAttachment = (id: string) => {
    updateAttachments(attachments.filter(a => a.id !== id));
  };

  const handleSubmit = () => {
    if (inputValue.trim() || attachments.length > 0) {
      onAnalyze(inputValue.trim(), attachments);
      // Don't clear attachments - keep them for the analysis
    }
  };

  const getPlaceholder = () => {
    if (langKey === 'Cantonese') return '輸入股票代號 e.g.: 0700.hk, TSLA';
    if (langKey === '简体中文') return '输入股票代码 e.g.: 0700.hk, TSLA';
    return 'Enter stock symbol e.g.: 0700.hk, TSLA';
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'url': return '🔗';
      case 'file': return '📄';
      case 'photo': return '📷';
      default: return '📎';
    }
  };

  // Listen for custom events from SourceMenu
  useEffect(() => {
    const handleSourceSelect = (event: CustomEvent) => {
      const { sourceType, sourceData } = event.detail;
      if (sourceType === 'url' && sourceData) {
        handleAddURL(sourceData);
      } else if (sourceType === 'file' && sourceData) {
        // Handle file from SourceMenu
        const newAttachment: Attachment = {
          id: Date.now().toString(),
          type: 'file',
          name: sourceData.name || 'Uploaded file',
          content: sourceData.content,
        };
        updateAttachments([...attachments, newAttachment]);
      }
    };

    window.addEventListener('source-select', handleSourceSelect as EventListener);
    return () => window.removeEventListener('source-select', handleSourceSelect as EventListener);
  }, [attachments]);

  return (
    <div style={{ width: '100%' }}>
      {/* Attachments Display Area */}
      {attachments.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: '#F9FAFB',
          borderRadius: '12px',
          border: '1px solid #E5E7EB'
        }}>
          {attachments.map((att) => (
            <div key={att.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'white',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              fontSize: '12px'
            }}>
              <span>{getAttachmentIcon(att.type)}</span>
              <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {att.name.length > 20 ? att.name.substring(0, 20) + '...' : att.name}
              </span>
              <button
                onClick={() => removeAttachment(att.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#EF4444',
                  fontSize: '14px',
                  padding: '0 4px'
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={onPlusClick}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#EF4444',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            flexShrink: 0
          }}
        >
          +
        </button>
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={getPlaceholder()}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          style={{ 
            flex: 1, 
            padding: '10px 14px', 
            fontSize: '14px', 
            color: '#1F2937', 
            backgroundColor: '#F3F4F6', 
            borderRadius: '24px', 
            border: '1px solid #E5E7EB', 
            outline: 'none',
            minWidth: 0
          }}
        />
        
        <button
          onClick={handleSubmit}
          disabled={!inputValue.trim() && attachments.length === 0}
          style={{ 
            padding: '10px 20px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: (inputValue.trim() || attachments.length > 0) ? '#22C55E' : '#D1D5DB', 
            color: 'white', 
            border: 'none', 
            cursor: (inputValue.trim() || attachments.length > 0) ? 'pointer' : 'not-allowed',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          Send
        </button>
      </div>

      {/* Hidden file inputs */}
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
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e, 'photo')}
      />
    </div>
  );
};
