"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Coffee, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function UnsubscribePage() {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isFinalStep, setIsFinalStep] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      if (typeof window !== 'undefined' && supabase && supabase.auth) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
      }
    };
    getUser();
  }, []);

  const reasons = [
    "Too expensive",
    "Not using it enough",
    "Missing specific features",
    "Data accuracy concerns",
    "Other"
  ];

  const handleOpenStripePortal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        alert("Unable to open subscription portal. Please try again.");
      }
    } catch (error) {
      console.error('Portal Error:', error);
      alert("Connection failed. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToCoffeePlan = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId: 'price_1TVLFX2RTqNKntjqdZZ0lKBj', // Coffee Plan price ID
          userId: userEmail,
          successUrl: `${window.location.origin}/thank-you`,
          cancelUrl: window.location.href,
        }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      alert('Unable to process payment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black">Manage Subscription</h1>
        </div>

        <div className="p-8">
          {!isFinalStep ? (
            <div className="space-y-6">
              <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex gap-4">
                <Coffee className="text-orange-500 shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-orange-900">Wait! Have you considered the Coffee Plan?</h3>
                  <p className="text-sm text-orange-800 mt-1">
                    For only <strong>$10/month</strong>, you get 300 credits. Perfect if you only check stocks occasionally.
                  </p>
                  <button 
                    onClick={handleSwitchToCoffeePlan}
                    disabled={isLoading}
                    className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-orange-600 transition"
                  >
                    {isLoading ? 'Processing...' : 'Switch to Coffee Plan'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-bold text-slate-700">Why are you leaving us?</p>
                {reasons.map((r) => (
                  <label key={r} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 cursor-pointer">
                    <input 
                      type="radio" 
                      name="reason" 
                      value={r} 
                      onChange={(e) => setReason(e.target.value)}
                      className="w-4 h-4 text-blue-600" 
                    />
                    <span className="text-sm font-medium text-slate-600">{r}</span>
                  </label>
                ))}
              </div>

              <button 
                disabled={!reason || isLoading}
                onClick={handleOpenStripePortal}
                className={`w-full py-4 rounded-2xl font-bold transition-all ${
                  reason && !isLoading ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Continue to Stripe Portal to Cancel
              </button>
            </div>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Are you sure?</h2>
                <p className="text-slate-500 mt-2">
                  Your premium features will be disabled at the end of the current billing cycle.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleOpenStripePortal}
                  disabled={isLoading}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors disabled:bg-red-300"
                >
                  {isLoading ? 'Redirecting...' : 'Confirm & Go to Stripe'}
                </button>
                <button 
                  onClick={() => setIsFinalStep(false)}
                  className="w-full py-4 bg-white text-slate-600 font-bold hover:text-slate-900 transition"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}