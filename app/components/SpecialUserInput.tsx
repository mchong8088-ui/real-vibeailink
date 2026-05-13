import React, { useState } from 'react';

// Import your SourceMenu component (adjust the path if it is located elsewhere)
import { SourceMenu } from './SourceMenu'; 

interface SpecialUserInputProps {
  langKey: string;
}

export default function SpecialUserInput({ langKey }: SpecialUserInputProps) {
  // 1. Correctly defined state inside the function
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="relative w-full">
      {/* Existing Header Content Wrapper */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold">VibeAiLink</h1>
        
        {/* The Toggle Button for the Source Menu */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {langKey === 'en' ? 'Open Sources' : '開啟來源'}
        </button>
      </div>
      
      {/* 2. The Popup Window (SourceMenu) */}
      <SourceMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onSelect={(type) => {
          console.log("Selected source type:", type);
          setIsMenuOpen(false);
          // Add your analysis logic here
        }}
        langKey={langKey}
      />
    </header>
  );
}