// components/modals/TermsModal.tsx
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { disclaimerData } from '@/constants/legal';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  displayName: string;
  email: string;
  onAccept: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({
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
        display_name: displayName,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-center">Terms of Service & Legal Agreement</h2>
          <p className="text-center text-gray-500 text-sm mt-1">
            Please read carefully before accepting
          </p>
        </div>
        
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6"
          onScroll={handleScroll}
        >
          {/* Terms of Service */}
          <div>
            <h3 className="text-lg font-bold text-blue-600 mb-3">1. Terms of Service</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>Eligibility:</strong> This website is for legal adults only (18+).</p>
              <p><strong>Service Nature:</strong> Market data summaries and AI analysis - NOT financial advice.</p>
              <p><strong>User Responsibility:</strong> All actions are independent decisions. Consult licensed professionals.</p>
              <p><strong>Subscription & Cancellation:</strong> Processed via Stripe. Fees are non-refundable after delivery.</p>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div>
            <h3 className="text-lg font-bold text-blue-600 mb-3">2. Disclaimer</h3>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {disclaimerData["粵語 (繁體中文)"].content}
            </div>
          </div>
          
          {/* Privacy Policy */}
          <div>
            <h3 className="text-lg font-bold text-blue-600 mb-3">3. Privacy Policy</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>Data Collection:</strong> Only necessary account information is collected.</p>
              <p><strong>Payment Security:</strong> All payments are securely processed by Stripe.</p>
              <p><strong>Data Usage:</strong> Used only for verification and reporting. Never sold to third parties.</p>
              <p><strong>Data Retention:</strong> Automatically deleted upon account deactivation.</p>
            </div>
          </div>
          
          {/* Explorer Credits */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">🎁 Welcome Bonus!</h3>
            <p className="text-sm text-yellow-700">
              Upon accepting these terms, you will receive <strong>100 FREE credits</strong> as an Explorer member!
            </p>
          </div>
        </div>
        
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={!isScrolledToBottom || loading}
              className={`flex-1 px-4 py-2 rounded-lg transition ${
                isScrolledToBottom && !loading
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Processing...' : 'Accept & Get 100 Credits'}
            </button>
          </div>
          {!isScrolledToBottom && (
            <p className="text-xs text-gray-500 text-center mt-3">
              Please scroll to the bottom to enable acceptance
            </p>
          )}
        </div>
      </div>
    </div>
  );
};