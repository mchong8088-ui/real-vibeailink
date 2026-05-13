"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Coffee, AlertTriangle } from 'lucide-react';

export default function UnsubscribePage() {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isFinalStep, setIsFinalStep] = useState(false);

  const reasons = [
    "Too expensive",
    "Not using it enough",
    "Missing specific features",
    "Data accuracy concerns",
    "Other"
  ];

  const handleFinalCancel = () => {
    // Logic to call Stripe API via your backend/edge function
    console.log("Cancelling subscription for reason:", reason);
    alert("Subscription cancelled. We hope to see you again!");
    router.push('/');
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
                  <button className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
                    Switch to Coffee Plan
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
                disabled={!reason}
                onClick={() => setIsFinalStep(true)}
                className={`w-full py-4 rounded-2xl font-bold transition-all ${
                  reason ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Continue to Unsubscribe
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
                  onClick={handleFinalCancel}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors"
                >
                  Confirm Unsubscribe
                </button>
                <button 
                  onClick={() => setIsFinalStep(false)}
                  className="w-full py-4 bg-white text-slate-600 font-bold"
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