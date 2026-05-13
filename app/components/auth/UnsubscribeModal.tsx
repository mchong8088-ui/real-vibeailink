// components/auth/UnsubscribeModal.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DowngradePlanModal } from './DowngradePlanModal';

interface UnsubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  onSelectPlan: (planId: string, priceId: string) => void;
}

const cancelReasons = [
  "Too expensive for my usage",
  "Missing features I need",
  "Don't use it enough",
  "Technical issues or bugs",
  "Found a better alternative",
  "Temporary pause (will return)",
  "Other"
];

const UnsubscribeModal: React.FC<UnsubscribeModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  onSelectPlan,
}) => {
  const [step, setStep] = useState<'reconsider' | 'reason' | 'confirm'>('reconsider');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);

  if (!isOpen) return null;

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleReconsiderConfirm = () => {
    setStep('reason');
  };

  const handleDowngradeInstead = () => {
    // Close the current modal first, then open downgrade modal
    onClose();
    setTimeout(() => {
      setShowDowngradeModal(true);
    }, 100);
  };

  const handleReturn = () => {
    onClose();
  };

  const handleCloseDowngradeModal = () => {
    setShowDowngradeModal(false);
  };

  const handleSubmitReason = async () => {
    if (selectedReasons.length === 0) return;
    
    setLoading(true);
    
    const reasonsText = selectedReasons.join(', ');
    const finalReason = selectedReasons.includes('Other') && customReason 
      ? `${reasonsText} - Custom: ${customReason}`
      : reasonsText;
    
    try {
      await supabase.from('cancellation_feedback').insert({
        user_id: user.id,
        email: user.email,
        plan: profile?.subscription_plan,
        reason: finalReason,
        cancelled_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
    
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id,
          returnUrl: window.location.href,
        }),
      });
      
      const { url } = await response.json();
      
      if (url) {
        window.open(url, '_blank');
        setShowThankYou(true);
      }
    } catch (error) {
      console.error('Error opening Stripe portal:', error);
    }
    
    setLoading(false);
  };

  const handleCloseFinal = () => {
    supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    onClose();
    window.location.replace('/');
  };

  if (showThankYou) {
    return (
      <div className="fixed top-[8vh] left-0 right-0 bottom-0 z-[200] flex items-start justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center mt-20 mx-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-3">Thank You for Visiting vibeAiLink</h2>
          <p className="text-gray-600 text-sm mb-4">
            Your credit balance will be honored until the end of your current billing period according to Stripe's regulations.
          </p>
          <button
            onClick={handleCloseFinal}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Unsubscribe Modal */}
      <div className="fixed top-[8vh] left-0 right-0 bottom-0 z-[200] flex items-start justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative mt-20 mx-4">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg"
          >
            ✕
          </button>
          
          {step === 'reconsider' && (
            <div>
              <h2 className="text-xl font-bold text-center mb-2 mt-4">We're sad to see you go! 😢</h2>
              <p className="text-center text-gray-600 mb-6">
                Before you cancel, would you consider downgrading to a more affordable plan?
              </p>
              
              <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <p className="font-semibold text-yellow-800 text-center">☕ Monthly Coffee Plan</p>
                <p className="text-sm text-yellow-700 text-center mt-1">
                  Only $10/month for 300 credits
                </p>
                <p className="text-xs text-yellow-600 text-center mt-1">
                  Perfect for casual users
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleReconsiderConfirm}
                  className="flex-1 px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition"
                >
                  No, cancel anyway
                </button>
                <button
                  onClick={handleDowngradeInstead}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Downgrade Instead
                </button>
              </div>
              
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleReturn}
                  className="text-gray-400 hover:text-gray-600 text-xs transition flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
          
          {step === 'reason' && (
            <div>
              <h2 className="text-xl font-bold text-center mb-4 mt-4">Help us improve</h2>
              <p className="text-center text-gray-600 mb-4 text-sm">
                Please tell us why you're cancelling <span className="text-blue-600">(select all that apply)</span>
              </p>
              
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {cancelReasons.map((reason) => (
                  <label key={reason} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedReasons.includes(reason)}
                      onChange={() => handleReasonToggle(reason)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{reason}</span>
                  </label>
                ))}
              </div>
              
              {selectedReasons.includes('Other') && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please tell us more..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm mb-4"
                  rows={3}
                />
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('reconsider')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitReason}
                  disabled={selectedReasons.length === 0 || loading}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${
                    selectedReasons.length > 0 && !loading
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Processing...' : 'Continue to Stripe'}
                </button>
              </div>
              
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleReturn}
                  className="text-gray-400 hover:text-gray-600 text-xs transition flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
          
          {step === 'confirm' && (
            <div>
              <div className="text-center mb-6 mt-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold mb-2">Confirm Cancellation</h2>
                <p className="text-gray-600 text-sm">
                  Your subscription will end at the current billing period.
                  You will not be charged again.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('reason')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitReason}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Cancellation'}
                </button>
              </div>
              
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleReturn}
                  className="text-gray-400 hover:text-gray-600 text-xs transition flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Downgrade Plan Modal */}
      <DowngradePlanModal
        isOpen={showDowngradeModal}
        onClose={handleCloseDowngradeModal}
        user={user}
        profile={profile}
        onSelectPlan={onSelectPlan}
      />
    </>
  );
};

export default UnsubscribeModal;