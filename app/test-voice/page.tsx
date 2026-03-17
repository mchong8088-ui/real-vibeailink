'use client';
import { useState, useEffect, useRef } from 'react';

export default function VibeAILinkPage() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [inputText, setInputText] = useState('你好，歡迎來到 Vibe AI Link。'); // Default Cantonese greeting

  // 1. Load System Voices
  useEffect(() => {
    const synth = window.speechSynthesis;
    
    const updateVoices = () => {
      const allVoices = synth.getVoices();
      // Filter for Hong Kong Cantonese (zh-HK)
      const hkVoices = allVoices.filter(v => v.lang.includes('HK') || v.lang.includes('zh-HK'));
      setVoices(hkVoices);
      
      // Default selection to the first available HK voice
      if (hkVoices.length > 0 && !selectedVoiceName) {
        setSelectedVoiceName(hkVoices[0].name);
      }
    };

    updateVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = updateVoices;
    }
  }, [selectedVoiceName]);

  // 2. The Free Speak Function
  const handleSpeak = () => {
    if (!inputText) return;
    
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(inputText);
    
    // Find and set the user-selected voice
    const voice = voices.find(v => v.name === selectedVoiceName);
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.lang = 'zh-HK';
    utterance.rate = 1.0; // Adjust speed if needed
    utterance.pitch = 1.0;
    
    synth.speak(utterance);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      {/* Header Section - Optimized for Desktop View */}
      <header className="flex justify-between items-center mb-10 bg-white p-4 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600">VibeAILink.com</h1>
        <div className="flex gap-4 items-center">
          <span className="text-gray-600">Welcome Back, Developer</span>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            Login
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Avatar & Voice Controls */}
        <section className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">AI Avatar Voice Settings</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Cantonese Voice (Free)
            </label>
            <select 
              className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none"
              value={selectedVoiceName}
              onChange={(e) => setSelectedVoiceName(e.target.value)}
            >
              {voices.length > 0 ? (
                voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} {v.localService ? '(On-device)' : '(Cloud)'}
                  </option>
                ))
              ) : (
                <option>Searching for HK voices...</option>
              )}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Note: High-quality voices like "Sin-ji" appear on macOS/iOS.
            </p>
          </div>

          <textarea 
            className="w-full p-3 border rounded-lg mb-4 h-32"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter Cantonese text here..."
          />

          <button 
            onClick={handleSpeak}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition"
          >
            Play Voice (No Cost)
          </button>
        </section>

        {/* Right Side: Preview Placeholder */}
        <section className="flex flex-col items-center justify-center bg-gray-200 rounded-2xl border-dashed border-4 border-gray-300">
          <p className="text-gray-500">Avatar Preview Area</p>
          <div className="mt-4 w-32 h-32 bg-gray-400 rounded-full animate-pulse"></div>
        </section>
      </div>
    </main>
  );
}