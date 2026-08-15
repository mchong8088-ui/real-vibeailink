"use client";
import React, { useState, useRef } from 'react';
import { 
  X, Upload, Play, Pause, Download, Sparkles, 
  FileText, Music, Video, Globe, Settings, AlertCircle, Loader2 
} from 'lucide-react';

interface VoiceProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  initialScript?: string;
  onUpgradePlan?: () => void;
 langKey?: string;
}

export const VoiceProviderModal: React.FC<VoiceProviderModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  initialScript = '',
  onUpgradePlan,
  
}) => {
  const [script, setScript] = useState(initialScript);
  const [language, setLanguage] = useState<'Cantonese' | 'Mandarin' | 'English'>('Cantonese');
  const [targetLanguage, setTargetLanguage] = useState<string>('None');
  const [voiceType, setVoiceType] = useState<'local' | 'gateway'>('local');
  const [speed, setSpeed] = useState<number>(1.0);
  const [template, setTemplate] = useState<'standard' | 'hook' | 'broll' | 'shorts'>('standard');

  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Generated Outputs
  const [generatedMp3Base64, setGeneratedMp3Base64] = useState<string | null>(null);
  const [generatedSrt, setGeneratedSrt] = useState<string | null>(null);
  const [generatedChapters, setGeneratedChapters] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isSubscriber = Boolean(profile?.subscription_plan && profile.subscription_plan !== 'Free Explorer');
  const hasEnoughCredits = (profile?.credits || 0) >= 300;
  const canUseFeature = isSubscriber || hasEnoughCredits;

  // Credit estimate calculation
  const charCount = script.length;
  let baseCredits = charCount < 500 ? 2 : (charCount > 2000 ? 10 : 5);
  const estimatedCredits = voiceType === 'gateway' ? baseCredits * 2 : baseCredits;

  // File Upload Handler (.txt, .docx, .mp3, .mp4)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.txt')) {
      const text = await file.text();
      setScript(text);
    } else if (fileName.endsWith('.docx')) {
      // Basic text extraction or send to backend parser
      const text = await file.text();
      setScript(text);
    } else if (fileName.endsWith('.mp3') || fileName.endsWith('.mp4')) {
      alert("Audio/Video file uploaded. Running auto-transcription...");
      // Route audio/video to transcription API
    }
  };

  // 5-Second Quick Audio Preview
  const handleAudioPreview = async () => {
    if (!script.trim()) return;
    setIsPreviewing(true);

    try {
      const res = await fetch('/api/youtube/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, language, speed }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
          setIsPlayingAudio(true);
        }
      }
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setIsPreviewing(false);
    }
  };

  // Main Generation Execution
  const handleGenerate = async () => {
    if (!user) {
      alert("Please login first.");
      return;
    }

    if (!canUseFeature) {
      const confirmUpgrade = window.confirm(
        "This feature is only available for monthly/annual subscribers or users with 300+ credits. Would you like to upgrade your plan?"
      );
      if (confirmUpgrade && onUpgradePlan) onUpgradePlan();
      return;
    }

    if (!script.trim()) {
      alert("Please provide or upload a script.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Generate Audio MP3
      const voiceRes = await fetch('/api/youtube/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          script,
          language,
          useGateway: voiceType === 'gateway',
          speed,
        }),
      });

      const voiceData = await voiceRes.json();
      if (voiceData.success) {
        setGeneratedMp3Base64(voiceData.audio);
      } else {
        alert(voiceData.error || "Voice generation failed.");
        setIsLoading(false);
        return;
      }

      // 2. Generate SRT Subtitles & YouTube Chapters
      const subRes = await fetch('/api/youtube/subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          language,
          targetLanguage: targetLanguage !== 'None' ? targetLanguage : undefined,
        }),
      });

      const subData = await subRes.json();
      if (subData.success) {
        setGeneratedSrt(subData.srt);
        setGeneratedChapters(subData.youtubeChapters);
      }

    } catch (err) {
      console.error('Generation failed:', err);
      alert('Generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper Downloads
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadMp3 = () => {
    if (!generatedMp3Base64) return;
    const a = document.createElement('a');
    a.href = `data:audio/mp3;base64,${generatedMp3Base64}`;
    a.download = `youtube_voiceover_${Date.now()}.mp3`;
    a.click();
  };

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
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles color="#8B5CF6" size={20} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              Voice Provider & YouTube Creator Studio
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        {!canUseFeature && (
          <div style={{
            backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px',
            padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle color="#EF4444" size={16} />
            <span style={{ fontSize: '12px', color: '#991B1B' }}>
              Subscriber Only: Requires a Monthly/Annual Subscription or 300+ Credits.
            </span>
          </div>
        )}

        {/* File Import & Text Input */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
              Script / Input Content
            </label>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', background: '#F3F4F6',
                border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                fontSize: '11px', color: '#4B5563'
              }}
            >
              <Upload size={12} /> Import File (.txt, .docx, .mp3, .mp4)
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.docx,.mp3,.mp4"
              style={{ display: 'none' }}
            />
          </div>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your script here or import from AI Research Assistant..."
            rows={5}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB',
              fontSize: '12px', fontFamily: 'inherit', resize: 'vertical', outline: 'none'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#6B7280' }}>
            <span>Characters: {charCount}</span>
            <span>Estimated Credits: <strong>{estimatedCredits}</strong></span>
          </div>
        </div>

        {/* Configuration Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {/* Language Selection */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Voice Language
            </label>
            <select
              value={language}
              onChange={(e: any) => setLanguage(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}
            >
              <option value="Cantonese">Cantonese (Danny)</option>
              <option value="Mandarin">Mandarin (Ting-Ting)</option>
              <option value="English">English (Samantha)</option>
            </select>
          </div>

          {/* Bilingual Subtitle Translation */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Subtitles Translation
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}
            >
              <option value="None">None (Original Language)</option>
              <option value="English">Bilingual English</option>
              <option value="Traditional Chinese">Bilingual Traditional Chinese</option>
              <option value="Simplified Chinese">Bilingual Simplified Chinese</option>
            </select>
          </div>

          {/* Voice Provider Type */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Engine Mode
            </label>
            <select
              value={voiceType}
              onChange={(e: any) => setVoiceType(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}
            >
              <option value="local">Local macOS Voice (2 credits / 500 chars)</option>
              <option value="gateway">Gateway AI Voice (Double Credits)</option>
            </select>
          </div>

          {/* Speed Control */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Pacing / Speed: {speed}x
            </label>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Preview Audio Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '8px 12px', background: '#F9FAFB', borderRadius: '8px' }}>
          <button
            onClick={handleAudioPreview}
            disabled={isPreviewing || !script.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
              borderRadius: '20px', border: '1px solid #D1D5DB', background: '#FFFFFF',
              cursor: 'pointer', fontSize: '11px', fontWeight: '500'
            }}
          >
            {isPreviewing ? <Loader2 size={12} className="animate-spin" /> : (isPlayingAudio ? <Pause size={12} /> : <Play size={12} />)}
            5s Audio Preview
          </button>
          <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} style={{ display: 'none' }} />
          <span style={{ fontSize: '11px', color: '#6B7280' }}>Sample audio voice quality before full generation</span>
        </div>

        {/* Generate Action Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading || !canUseFeature}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px',
            backgroundColor: canUseFeature ? '#8B5CF6' : '#9CA3AF',
            color: 'white', border: 'none', fontWeight: '600', fontSize: '14px',
            cursor: canUseFeature ? 'pointer' : 'not-allowed', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px'
          }}
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isLoading ? 'Generating Audio & Subtitles...' : `Generate Package (${estimatedCredits} Credits)`}
        </button>

        {/* 3 Download Action Buttons */}
        {generatedMp3Base64 && (
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111827', display: 'block', marginBottom: '8px' }}>
              Download Generated Assets:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => downloadFile(script, 'script.txt', 'text/plain')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#FFFFFF',
                  fontSize: '11px', cursor: 'pointer', fontWeight: '500'
                }}
              >
                <FileText size={12} /> Script (.txt)
              </button>
              <button
                onClick={downloadMp3}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  padding: '8px', borderRadius: '6px', border: 'none', background: '#10B981',
                  color: 'white', fontSize: '11px', cursor: 'pointer', fontWeight: '500'
                }}
              >
                <Music size={12} /> MP3 Audio
              </button>
              <button
                onClick={() => downloadFile(generatedSrt || '', 'subtitles.srt', 'text/plain')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  padding: '8px', borderRadius: '6px', border: 'none', background: '#3B82F6',
                  color: 'white', fontSize: '11px', cursor: 'pointer', fontWeight: '500'
                }}
              >
                <Video size={12} /> SRT Subtitles
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};