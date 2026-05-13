// components/modals/TermsModal.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { disclaimerData } from '../../constants/legal';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  displayName: string;
  email: string;
  onAccept: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  user,
  displayName,
  email,
  onAccept,
}) => {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    setIsScrolledToBottom(isBottom);
  };

  const handleAccept = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName || email.split('@')[0],
        email: email,
        has_accepted_legal: true,
        credits: 100,
        subscription_status: 'explorer',
        subscription_plan: 'Free Explorer',
      })
      .eq('id', user.id);
    
    if (!error) {
      onAccept();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
        <div className="p-5 border-b">
          <h2 className="text-xl font-bold text-center">Terms of Service & Legal Agreement</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-5" onScroll={handleScroll}>
          <div>
            <h3 className="text-base font-bold text-blue-600 mb-2">1. Terms of Service</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Eligibility:</strong> For legal adults only (18+).</p>
              <p><strong>Service Nature:</strong> Market data summaries and AI analysis - NOT financial advice.</p>
              <p><strong>User Responsibility:</strong> All actions are independent decisions.</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-base font-bold text-blue-600 mb-2">2. Disclaimer</h3>
            <div className="text-sm text-gray-700">
              <p>{disclaimerData?.["English"]?.content || "Data provided is based on 'Big Data Algorithms' and 'Mathematical Models' and does not constitute investment advice."}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-base font-bold text-blue-600 mb-2">3. Privacy Policy</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Data Collection:</strong> Only necessary account information.</p>
              <p><strong>Payment Security:</strong> Securely processed by Stripe.</p>
              <p><strong>Data Retention:</strong> Deleted upon account deactivation.</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm font-semibold text-yellow-800">🎁 Welcome Bonus!</p>
            <p className="text-xs text-yellow-700 mt-1">Accept to receive 100 FREE credits as an Explorer member!</p>
          </div>
        </div>
        
        <div className="p-5 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition text-sm"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={!isScrolledToBottom || loading}
              className={`flex-1 px-4 py-2 rounded-lg transition text-sm ${
                isScrolledToBottom && !loading
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Processing...' : 'Accept & Get 100 Credits'}
            </button>
          </div>
          {!isScrolledToBottom && (
            <p className="text-xs text-gray-400 text-center mt-3">Please scroll to the bottom to accept</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsModal;