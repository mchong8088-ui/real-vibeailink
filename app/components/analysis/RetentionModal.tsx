// Retention Modal Component
import React from 'react';

interface RetentionModalProps {
  onClose: () => void;
  onHandleAction: (action: string) => void;
}

export const RetentionModal = ({ onClose, onHandleAction }: RetentionModalProps) => (
  <div className="modal-overlay" style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  }}>
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '400px',
      textAlign: 'center'
    }}>
      <h2 style={{ marginTop: 0 }}>等等！我們不想失去您</h2>
      <p>比起直接取消，何不嘗試更靈活的 Coffee Plan？</p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button
          onClick={() => onHandleAction('downgrade')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#22C55E',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          查看方案
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          關閉
        </button>
      </div>
    </div>
  </div>
);
