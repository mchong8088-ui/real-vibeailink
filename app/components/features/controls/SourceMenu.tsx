// components/features/controls/SourceMenu.tsx
import React, { useState } from 'react';

interface SourceMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSource: (source: string, data?: any) => void;
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

  if (!isOpen) return null;

  const sources = [
    {
      id: 'link',
      title: '分析新聞連結',
      subtitle: 'Paste links from Motley Fool, CNBC, etc.',
      icon: '🔗',
      hasInput: true,
    },
    {
      id: 'camera',
      title: '拍照或上傳文件',
      subtitle: 'Scan physical reports or screens',
      icon: '📷',
      hasInput: false,
    },
    {
      id: 'file',
      title: '上傳數據文件',
      subtitle: 'PDF, CSV, or Technical Sheets',
      icon: '📁',
      hasInput: false,
    },
  ];

  const handleSourceClick = (source: typeof sources[0]) => {
    if (source.hasInput && source.id === 'link') {
      setShowUrlInput(true);
    } else {
      onSelectSource(source.id);
      onClose();
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onSelectSource('url', urlInput.trim());
      setShowUrlInput(false);
      setUrlInput('');
      onClose();
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(4px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '400px',
        padding: '20px',
        position: 'relative',
        border: '1px solid #E5E7EB',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            新增分析來源
          </h3>
          <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
            Add additional context for AI analysis
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color: '#9CA3AF',
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        {/* URL Input Mode */}
        {showUrlInput ? (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '8px', display: 'block' }}>
                Paste URL
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/news"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  outline: 'none',
                }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowUrlInput(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#22C55E',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: urlInput.trim() ? 'pointer' : 'not-allowed',
                  opacity: urlInput.trim() ? 1 : 0.5,
                }}
              >
                Add URL
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Source options - YELLOW backgrounds */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => handleSourceClick(source)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#FEF08A',
                    border: '1px solid #E5E7EB',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FDE047';
                    e.currentTarget.style.borderColor = '#3B82F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FEF08A';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{source.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      {source.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                      {source.subtitle}
                    </div>
                  </div>
                  <span style={{ color: '#9CA3AF', fontSize: '16px' }}>→</span>
                </button>
              ))}
            </div>

            {/* Return button - GREEN background */}
            <button
              onClick={onClose}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#22C55E',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#16A34A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#22C55E';
              }}
            >
              RETURN TO ANALYSIS
            </button>
          </>
        )}
      </div>
    </div>
  );
};