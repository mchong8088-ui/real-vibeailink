"use client";
import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { footerContent, disclaimerData } from '../../constants/content';

interface InfoModalProps {
  contentKey: string; 
  language: string;
  onClose: () => void;
}

export const InfoModal = ({ contentKey, language, onClose }: InfoModalProps) => {
  const getDisplayData = () => {
    if (contentKey === "Disclaimer" || contentKey === "免責聲明") {
      const d = disclaimerData[language] || disclaimerData["English"];
      return { title: d.title, body: d.content };
    }
    const body = footerContent[contentKey]?.[language] || "Content not found.";
    return { title: contentKey, body };
  };

  const { title, body } = getDisplayData();

  return (
    <div className="animate-in fade-in zoom-in duration-300">
      <div className="bg-white rounded-[2.5rem] border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* HEADER WITH RETURN BUTTON */}
        <div className="p-6 border-b-4 border-slate-900 bg-slate-50 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 bg-white border-2 border-slate-900 px-4 py-2 rounded-xl font-black text-sm hover:bg-blue-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
          >
            <ArrowLeft size={18} />
            <span>Return to Previous Page</span>
          </button>
          <h2 className="font-black text-xl uppercase tracking-tighter text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-red-50 rounded-full text-red-500">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="p-10 max-h-[60vh] overflow-y-auto bg-white">
          <div className="prose prose-slate max-w-none">
            <p className="whitespace-pre-wrap text-lg leading-relaxed font-medium text-slate-700">
              {body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};