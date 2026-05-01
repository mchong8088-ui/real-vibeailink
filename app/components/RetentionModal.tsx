// 概念性代碼，用於顯示挽留視窗
export const RetentionModal = ({ onClose, onHandleAction }) => (
  <div className="modal-overlay">
    <h2>等等！我們不想失去您</h2>
    <p>比起直接取消，何不嘗試更靈活的 Coffee Plan？</p>
    
    {/* 選項 1: 降級到 Coffee Plan */}
    <button onClick={() => onHandleAction('coffee_plan')}>
       切換至 Coffee Plan ($5 / 100 點)
    </button>
    
    {/* 選項 2: 維持現狀 */}
    <button onClick={onClose}>保留目前方案</button>
    
    {/* 選項 3: 強制取消 */}
    <button onClick={() => onHandleAction('unsubscribe')} style={{color: 'red'}}>
       確認取消 (不再收費)
    </button>
  </div>
);