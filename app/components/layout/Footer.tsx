// In your Footer component, use these styles:
<button
  onClick={() => setActiveLegalTab(tab)}
  style={{
    background: 'none',
    border: 'none',
    color: activeLegalTab === tab ? '#2563EB' : '#3B82F6',
    fontWeight: activeLegalTab === tab ? '900' : '500',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '4px 8px',
  }}
>
  {tabName}
</button>