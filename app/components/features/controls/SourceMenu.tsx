import React, { useState } from 'react';

// Define the interface for the props the component expects
export interface SourceMenuProps {
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
      title: langKey === 'en' ? 'Analyze News Link' : '分析新聞連結',
      subtitle: 'Paste links from Motley Fool, CNBC, etc.',
      icon: '🔗',
      hasInput: true,
    },
    {
      id: 'camera',
      title: langKey === 'en' ? 'Camera or Upload' : '拍照或上傳文件',
      subtitle: 'Scan physical reports or screens',
      icon: '📷',
      hasInput: false,
    },
    {
      id: 'file',
      title: langKey === 'en' ? 'Upload Data File' : '上傳數據文件',
      subtitle: 'PDF, CSV, or Technical Sheets',
      icon: '📁',
      hasInput: false,
    },
  ];

  const handleSourceClick = (source: any) => {
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
      top: 0, left: 0, right: 0, bottom: 0,
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
        width: '100%',
        maxWidth: '400px',
        padding: '20px',
        position: 'relative',
        border: '1px solid #E5E7EB',
      }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
            {langKey === 'en' ? 'Add Analysis Source' : '新增分析來源'}
          </h3>
        </div>

        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', border: 'none', background: 'none' }}>✕</button>

        {showUrlInput ? (
          <div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/news"
              style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '12px', border: '1px solid #E5E7EB' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowUrlInput(false)} style={{ flex: 1, padding: '10px', borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleUrlSubmit} style={{ flex: 1, padding: '10px', backgroundColor: '#22C55E', color: 'white', borderRadius: '12px', cursor: 'pointer' }}>Add URL</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sources.map((source) => (
              <button
                key={source.id}
                onClick={() => handleSourceClick(source)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '14px',
                  backgroundColor: '#FEF08A', borderRadius: '14px', cursor: 'pointer', textAlign: 'left', border: '1px solid #E5E7EB'
                }}
              >
                <span style={{ fontSize: '24px' }}>{source.icon}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{source.title}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{source.subtitle}</div>
                </div>
              </button>
            ))}
            <button onClick={onClose} style={{ width: '100%', padding: '12px', backgroundColor: '#22C55E', color: 'white', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
              {langKey === 'en' ? 'RETURN' : '返回'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};