"use client";

import React from 'react';
import Link from 'next/link';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">Refund and Cancellation Policy</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Cancellation Policy</h2>
          <p className="text-gray-700 mb-2">
            You may cancel your subscription at any time. Upon cancellation, you will continue to have access 
            to the service until the end of your current billing period.
          </p>
          <p className="text-gray-700">
            To cancel your subscription, please go to your account settings and click "Unsubscribe", or visit 
            the Stripe Customer Portal linked in your confirmation email.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Refund Policy</h2>
          <p className="text-gray-700">
            We do not offer refunds for partial subscription periods. However, if you experience technical issues 
            that prevent you from using the service, please contact our support team for assistance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
          <p className="text-gray-700">
            If you have any questions about this Refund Policy, please contact us at:
            <a href="mailto:support@vibeailink.com" className="text-blue-600 ml-1">support@vibeailink.com</a>
          </p>
        </section>

        <div className="mt-8 pt-6 border-t">
          <button
            onClick={() => window.location.href = '/unsubscribe'}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Go to Unsubscribe Page
          </button>
        </div>
      </div>
    </div>
  );
}