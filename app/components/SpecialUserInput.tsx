import React, { useState } from 'react';
import { SourceMenu } from './features/controls/SourceMenu'; 

interface SpecialUserInputProps {
  langKey: string;
}

export default function SpecialUserInput({ langKey }: SpecialUserInputProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // This function handles the selection from the menu
  const handleSourceSelection = (sourceType: string, data?: any) => {
    console.log("Selected source:", sourceType, "with data:", data);
    
    // Perform your analysis logic here based on the sourceType
    // e.g., if (sourceType === 'url') { fetchLink(data); }
    
    setIsMenuOpen(false);
  };

  return (
    <header className="relative w-full">
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold">VibeAiLink</h1>
        
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {langKey === 'en' ? 'Open Sources' : '開啟來源'}
        </button>
      </div>
      
      {/* Updated the prop name from onSelect to onSelectSource to match SourceMenu.tsx */}
      <SourceMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onSelectSource={handleSourceSelection}
        langKey={langKey}
      />
    </header>
  );
}