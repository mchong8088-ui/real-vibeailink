"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Play, Pause, Download, Sparkles, 
  FileText, Music, Video, Globe, Settings, AlertCircle, Loader2 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VoiceSelector } from './layout/VoiceSelector';

interface VoiceProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  initialScript?: string;
  onUpgradePlan?: () => void;
  langKey?: string;
}

// Define voice type
interface Voice {
  name: string;
  language: string;
  gender?: string;
  quality?: string;
}

export const VoiceProviderModal: React.FC<VoiceProviderModalProps> = ({
  isOpen,
  onClose,
  user: propUser,
  profile,
  initialScript = '',
  onUpgradePlan,
}) => {
  const [script, setScript] = useState(initialScript);
  const [language, setLanguage] = useState<'Cantonese' | 'Mandarin' | 'English'>('Cantonese');
  const [targetLanguage, setTargetLanguage] = useState<string>('None');
  const [voiceType, setVoiceType] = useState<'local' | 'gateway'>('local');
  const [speed, setSpeed] = useState<number>(1.0);
  
  // Download format selection
  const [downloadFormat, setDownloadFormat] = useState<'wav' | 'mp3'>('wav');
  
  // Voice selection state
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('Aasing (Enhanced)');
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Generated Outputs
  const [generatedMp3Base64, setGeneratedMp3Base64] = useState<string | null>(null);
  const [generatedSrt, setGeneratedSrt] = useState<string | null>(null);
  const [generatedChapters, setGeneratedChapters] = useState<string | null>(null);
  const [generatedSegments, setGeneratedSegments] = useState<any[] | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0); // NEW: Store audio duration

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // DEFINE FUNCTIONS FIRST
  // ============================================

  // Load available voices from the system
  const loadAvailableVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const response = await fetch('/api/voices');
      const data = await response.json();
      
      if (data.success && data.voices) {
        setAvailableVoices(data.voices);
        
        // Find the best voice based on current language
        const languageMap: Record<string, string> = {
          'Cantonese': 'Cantonese',
          'Mandarin': 'Mandarin',
          'English': 'English'
        };
        
        const filterLang = languageMap[language];
        const filtered = data.voices.filter((v: Voice) => 
          v.language.includes(filterLang) ||
          (filterLang === 'Cantonese' && v.language.includes('zh-HK')) ||
          (filterLang === 'Mandarin' && v.language.includes('zh-CN')) ||
          (filterLang === 'English' && v.language.includes('en_'))
        );
        
        // Set the first available voice for the language
        if (filtered.length > 0) {
          setSelectedVoice(filtered[0].name);
        } else if (data.voices.length > 0) {
          setSelectedVoice(data.voices[0].name);
        }
        
        console.log('Available voices loaded:', data.voices);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // Handle voice change from selector
  const handleVoiceChange = (voice: string) => {
    setSelectedVoice(voice);
  };

  // Check if text contains Chinese
  const containsChinese = (text: string): boolean => {
    return /[\u4e00-\u9fff]/.test(text);
  };

  // Check if text is primarily Chinese
  const isChineseText = (text: string): boolean => {
    const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
    const totalChars = text.replace(/\s/g, '').length;
    return totalChars > 0 && (chineseChars.length / totalChars) > 0.3;
  };

  // Get language warning
  const getLanguageWarning = () => {
    const hasChinese = containsChinese(script);
    const hasEnglish = /[a-zA-Z]/.test(script);
    const isChinese = isChineseText(script);
    
    if (isChinese && language === 'English') {
      return '⚠️ Warning: You have Chinese text but selected English voice. This will not pronounce correctly. Please select Cantonese or Mandarin.';
    }
    if (hasEnglish && (language === 'Cantonese' || language === 'Mandarin') && !hasChinese) {
      return '⚠️ Warning: You have English text but selected Chinese voice. This may not pronounce correctly.';
    }
    if (hasChinese && hasEnglish && language === 'English') {
      return '⚠️ Warning: Mixed language detected. Please select the primary language for best results.';
    }
    return null;
  };

  // Get suggested language based on text
  const getSuggestedLanguage = () => {
    if (isChineseText(script)) {
      return 'Cantonese';
    }
    return null;
  };

  // Language to standard BCP-47 locale mapping
  const languageCodeMap: Record<string, string> = {
    'Cantonese': 'zh-HK',
    'Mandarin': 'zh-CN',
    'English': 'en-US'
  };

  // ============================================
  // USE EFFECTS
  // ============================================

  // Load available voices on mount
  useEffect(() => {
    if (isOpen) {
      loadAvailableVoices();
      
      // Auto-detect language from script
      if (script && isChineseText(script)) {
        setLanguage('Cantonese');
      }
    }
  }, [isOpen]);

  // Clean up audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current?.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  // ============================================
  // EARLY RETURN
  // ============================================

  if (!isOpen) return null;

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.txt') || fileName.endsWith('.docx')) {
      const text = await file.text();
      setScript(text);
      
      // Auto-detect language from uploaded script
      if (isChineseText(text)) {
        setLanguage('Cantonese');
      }
    }
  };

  // 1. Audio Preview
  const handleAudioPreview = async () => {
    if (!script.trim()) {
      alert("Please enter some script text first.");
      return;
    }
    
    // Auto-correct language if needed
    if (isChineseText(script) && language === 'English') {
      const confirmSwitch = confirm(
        "You have Chinese text but selected English voice. This will not pronounce correctly. Would you like to switch to Cantonese?"
      );
      if (confirmSwitch) {
        setLanguage('Cantonese');
        await loadAvailableVoices();
      }
    }
    
    setIsPreviewing(true);
    setPreviewError(null);

    const langCode = languageCodeMap[language] || 'zh-HK';

    try {
      const res = await fetch('/api/youtube/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          script: script.slice(0, 200),
          language, 
          langCode,
          speed,
          voiceType,
          selectedVoice
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      const blob = await res.blob();
      
      if (!blob || blob.size === 0) {
        throw new Error("Generated audio is empty");
      }

      if (audioRef.current?.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      const url = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
        
        try {
          await audioRef.current.play();
          setIsPlayingAudio(true);
        } catch (playError) {
          console.error('Play error:', playError);
          setPreviewError('Failed to play audio. Click play button manually.');
        }
      }
    } catch (err) {
      console.error('Preview error:', err);
      setPreviewError(err instanceof Error ? err.message : 'Preview failed');
      alert(`Preview failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsPreviewing(false);
    }
  };

  // 2. Full Package Generation
  const handleGenerate = async () => {
    let activeUser = propUser;
    if (!activeUser) {
      const { data: { session } } = await supabase.auth.getSession();
      activeUser = session?.user || null;
    }

    if (!activeUser) {
      alert("Please login first.");
      return;
    }

    if (!script.trim()) {
      alert("Please provide or upload a script.");
      return;
    }

    // Auto-correct language if needed
    if (isChineseText(script) && language === 'English') {
      const confirmSwitch = confirm(
        "You have Chinese text but selected English voice. This will not pronounce correctly. Would you like to switch to Cantonese?"
      );
      if (confirmSwitch) {
        setLanguage('Cantonese');
        await loadAvailableVoices();
      }
    }

    setIsLoading(true);

    const langCode = languageCodeMap[language] || 'zh-HK';

    try {
      // 2.1 Generate Voice - Pass the requested format
      const voiceRes = await fetch('/api/youtube/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser.id,
          script,
          language,
          langCode,
          useGateway: voiceType === 'gateway',
          speed,
          selectedVoice,
          format: downloadFormat, // Pass the selected format
        }),
      });

      const voiceData = await voiceRes.json();
      console.log('Voice API response:', voiceData);

      if (voiceData.success) {
        // Clean the base64 data - remove any whitespace or line breaks
        const cleanAudio = voiceData.audio.replace(/\s/g, '');
        console.log('Clean audio data length:', cleanAudio.length);
        console.log('Audio format:', voiceData.format);
        console.log('Audio duration:', voiceData.duration, 'seconds');
        console.log('Duration formatted:', voiceData.durationFormatted);
        
        setGeneratedMp3Base64(cleanAudio);
        setAudioDuration(voiceData.duration || 0); // Store the duration
      } else {
        alert(voiceData.error || "Voice generation failed.");
        setIsLoading(false);
        return;
      }

      // 2.2 Generate Subtitles - Pass the audio duration for sync
      const subRes = await fetch('/api/youtube/subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          language,
          langCode,
          targetLanguage: targetLanguage !== 'None' ? targetLanguage : undefined,
          totalDuration: audioDuration, // Pass the actual audio duration
        }),
      });

      const subData = await subRes.json();
      if (subData.success) {
        setGeneratedSrt(subData.srt);
        setGeneratedChapters(subData.youtubeChapters);
        setGeneratedSegments(subData.segments || []);
        
        console.log('Subtitles generated:', subData.metadata);
        console.log('Duration source:', subData.metadata?.durationSource);
      } else {
        console.warn('Subtitle generation warning:', subData.error);
      }

    } catch (err) {
      console.error('Generation failed:', err);
      alert('Generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download audio with format selection
  const downloadAudio = () => {
    if (!generatedMp3Base64) {
      alert('No audio data available. Please generate audio first.');
      return;
    }
    
    const timestamp = Date.now();
    const extension = downloadFormat === 'mp3' ? 'mp3' : 'wav';
    const mimeType = downloadFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav';
    const filename = `vibeailink_voice_${timestamp}.${extension}`;
    
    try {
      console.log('=== DOWNLOAD AUDIO ===');
      console.log('Format:', downloadFormat);
      console.log('Data length:', generatedMp3Base64.length);
      
      // Clean the base64 data
      const cleanBase64 = generatedMp3Base64.replace(/\s/g, '');
      
      // Use fetch with data URL
      const dataUrl = `data:${mimeType};base64,${cleanBase64}`;
      
      fetch(dataUrl)
        .then(response => {
          console.log('Fetch response status:', response.status);
          return response.blob();
        })
        .then(blob => {
          console.log('Blob size:', blob.size, 'bytes');
          console.log('Blob type:', blob.type);
          
          if (blob.size === 0) {
            throw new Error('Blob is empty');
          }
          
          // Create download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          console.log('=== DOWNLOAD COMPLETE ===');
        })
        .catch(error => {
          console.error('Download error:', error);
          alert('Failed to download audio. Please try again.');
        });
      
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download audio. Please try again.');
    }
  };

  const downloadScript = () => {
    const timestamp = Date.now();
    const filename = `vibeailink_script_${timestamp}.txt`;
    downloadFile(script, filename, 'text/plain');
  };

  const downloadSubtitles = () => {
    const timestamp = Date.now();
    const filename = `vibeailink_subtitle_${timestamp}.srt`;
    downloadFile(generatedSrt || '', filename, 'text/plain');
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play().catch(err => {
          console.error('Play failed:', err);
          alert('Failed to play audio. Please try again.');
        });
        setIsPlayingAudio(true);
      }
    }
  };

  const isSubscriber = Boolean(profile?.subscription_plan && profile.subscription_plan !== 'Free Explorer');
  const hasEnoughCredits = (profile?.credits || 0) >= 100;

  const charCount = script.length;
  let baseCredits = charCount < 500 ? 2 : (charCount > 2000 ? 10 : 5);
  const estimatedCredits = voiceType === 'gateway' ? baseCredits * 2 : baseCredits;

  const suggestedLang = getSuggestedLanguage();

  // Format duration for display
  const formatDurationDisplay = (seconds: number): string => {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%',
        maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles color="#8B5CF6" size={20} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              Voice Provider Studio
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        {/* Script Area */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Script Content</label>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', background: '#F3F4F6',
                border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                fontSize: '11px', color: '#4B5563'
              }}
            >
              <Upload size={12} /> Import File (.txt, .docx)
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.docx" style={{ display: 'none' }} />
          </div>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your script here..."
            rows={6}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '12px', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#6B7280' }}>
            <span>Characters: {charCount}</span>
            <span>Est. Cost: <strong>{estimatedCredits} Credits</strong></span>
          </div>
          {suggestedLang && language !== suggestedLang && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #3B82F6',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#1E40AF'
            }}>
              💡 Tip: Your text appears to be in Chinese. For best results, select <strong>{suggestedLang}</strong> as the Voice Language.
              <button
                onClick={() => {
                  setLanguage(suggestedLang as any);
                  loadAvailableVoices();
                }}
                style={{
                  marginLeft: '8px',
                  padding: '2px 10px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Switch to {suggestedLang}
              </button>
            </div>
          )}
          {getLanguageWarning() && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#92400E'
            }}>
              {getLanguageWarning()}
            </div>
          )}
        </div>

        {/* Controls - Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Voice Language</label>
            <select value={language} onChange={(e: any) => {
              setLanguage(e.target.value);
              loadAvailableVoices();
            }} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}>
              <option value="Cantonese">Cantonese (粵語 - zh-HK)</option>
              <option value="Mandarin">Mandarin (國語 - zh-CN)</option>
              <option value="English">English (en-US)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Subtitle Translation</label>
            <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}>
              <option value="None">None (Original Language)</option>
              <option value="English">Bilingual English</option>
              <option value="Traditional Chinese">Bilingual Traditional Chinese</option>
              <option value="Simplified Chinese">Bilingual Simplified Chinese</option>
            </select>
          </div>
        </div>

        {/* Voice Engine and Voice Selector - Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Voice Engine</label>
            <select 
              value={voiceType} 
              onChange={(e: any) => setVoiceType(e.target.value)} 
              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}
            >
              <option value="local">Local (Desktop)</option>
              <option value="gateway">Gateway (Cloud)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Select Voice {isLoadingVoices && <Loader2 size={12} className="animate-spin" />}
            </label>
            <div style={{ width: '100%' }}>
              <VoiceSelector 
  currentVoice={selectedVoice}
  onVoiceChange={handleVoiceChange}
  mode="voice"  // This shows specific voices (Aasing, Sinji, etc.)
/>
            </div>
          </div>
        </div>

        {/* Preview Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '8px 12px', background: '#F9FAFB', borderRadius: '8px' }}>
          <button
            onClick={handleAudioPreview}
            disabled={isPreviewing || !script.trim()}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', 
              borderRadius: '20px', border: '1px solid #10B981', background: '#ECFDF5', 
              color: '#047857', cursor: 'pointer', fontSize: '12px', fontWeight: '600'
            }}
          >
            {isPreviewing ? <Loader2 size={12} className="animate-spin" /> : (isPlayingAudio ? <Pause size={12} /> : <Play size={12} />)}
            5s {language} Audio Preview
          </button>
          <audio 
            ref={audioRef} 
            onEnded={() => setIsPlayingAudio(false)}
            onError={(e) => {
              console.error('Audio error:', e);
              setPreviewError('Audio playback error');
            }}
            style={{ display: 'none' }} 
          />
          {previewError && (
            <span style={{ fontSize: '11px', color: '#EF4444' }}>{previewError}</span>
          )}
          {selectedVoice && (
            <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: 'auto' }}>
              Voice: {selectedVoice}
            </span>
          )}
        </div>

        {/* Generate Action */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px',
            backgroundColor: '#10B981', color: 'white', border: 'none',
            fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px'
          }}
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isLoading ? 'Generating Audio & Subtitles...' : `Generate Package (${estimatedCredits} Credits)`}
        </button>

        {/* Downloads */}
        {generatedMp3Base64 && (
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111827', display: 'block', marginBottom: '8px' }}>
              Download Generated Assets:
              {generatedSegments && generatedSegments.length > 0 && (
                <span style={{ fontSize: '11px', fontWeight: '400', color: '#6B7280', marginLeft: '8px' }}>
                  ({generatedSegments.length} segments)
                </span>
              )}
              {audioDuration > 0 && (
                <span style={{ fontSize: '11px', fontWeight: '400', color: '#6B7280', marginLeft: '8px' }}>
                  ⏱️ {formatDurationDisplay(audioDuration)}
                </span>
              )}
            </span>
            
            {/* Download Format Selection */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '10px',
              padding: '8px 12px',
              backgroundColor: '#F9FAFB',
              borderRadius: '6px'
            }}>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Audio Format:</span>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '11px', 
                cursor: 'pointer',
                fontWeight: downloadFormat === 'wav' ? '600' : '400',
                color: downloadFormat === 'wav' ? '#2563EB' : '#4B5563'
              }}>
                <input 
                  type="radio" 
                  value="wav" 
                  checked={downloadFormat === 'wav'}
                  onChange={() => setDownloadFormat('wav')}
                  style={{ cursor: 'pointer' }}
                />
                WAV (Lossless)
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '11px', 
                cursor: 'pointer',
                fontWeight: downloadFormat === 'mp3' ? '600' : '400',
                color: downloadFormat === 'mp3' ? '#2563EB' : '#4B5563'
              }}>
                <input 
                  type="radio" 
                  value="mp3" 
                  checked={downloadFormat === 'mp3'}
                  onChange={() => setDownloadFormat('mp3')}
                  style={{ cursor: 'pointer' }}
                />
                MP3 (Compressed)
              </label>
              {downloadFormat === 'mp3' && (
                <span style={{ fontSize: '10px', color: '#6B7280' }}>
                  (Smaller file size)
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button 
                onClick={downloadScript} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '4px', 
                  padding: '8px', 
                  borderRadius: '6px', 
                  border: '1px solid #D1D5DB', 
                  background: '#FFFFFF', 
                  fontSize: '11px', 
                  cursor: 'pointer' 
                }}
              >
                <FileText size={12} /> Script
              </button>
              
              <button 
                onClick={downloadAudio} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '4px', 
                  padding: '8px', 
                  borderRadius: '6px', 
                  border: 'none', 
                  background: '#10B981', 
                  color: 'white', 
                  fontSize: '11px', 
                  cursor: 'pointer' 
                }}
              >
                <Music size={12} /> {downloadFormat.toUpperCase()} Audio
              </button>
              
              <button 
                onClick={downloadSubtitles} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '4px', 
                  padding: '8px', 
                  borderRadius: '6px', 
                  border: 'none', 
                  background: '#3B82F6', 
                  color: 'white', 
                  fontSize: '11px', 
                  cursor: 'pointer' 
                }}
              >
                <Video size={12} /> Subtitles
              </button>
            </div>
            
            {/* Info text */}
            <div style={{ 
              marginTop: '8px', 
              fontSize: '10px', 
              color: '#9CA3AF',
              textAlign: 'center'
            }}>
              {downloadFormat === 'wav' 
                ? 'WAV: Lossless high-quality audio' 
                : 'MP3: Compressed format with good quality'}
              {audioDuration > 0 && ` • Duration: ${formatDurationDisplay(audioDuration)}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};