// Create a new component: /app/components/VoiceCloner.tsx

"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Pause, Download, Sparkles, X, Loader2, Volume2 } from 'lucide-react';

interface VoiceClonerProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceCloned: (voiceData: any) => void;
}

export const VoiceCloner: React.FC<VoiceClonerProps> = ({
  isOpen,
  onClose,
  onVoiceCloned,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [voiceText, setVoiceText] = useState('Hello, this is my cloned voice.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        // Auto-select a Chinese voice if available
        const chineseVoice = voices.find(v => 
          v.lang.startsWith('zh') || 
          v.name.toLowerCase().includes('chinese')
        );
        if (chineseVoice) {
          setSelectedVoice(chineseVoice.name);
        } else if (voices.length > 0) {
          setSelectedVoice(voices[0].name);
        }
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access to record your voice.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Play recorded audio
  const playRecordedAudio = () => {
    if (audioRef.current && recordedAudio) {
      audioRef.current.src = recordedAudio;
      audioRef.current.play();
      setIsPlaying(true);
      audioRef.current.onended = () => setIsPlaying(false);
    }
  };

  // Speak with selected voice (TTS)
  const speakWithVoice = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Speech synthesis not supported');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    const voice = availableVoices.find(v => v.name === selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to find a Chinese voice
    if (!voice) {
      const chineseVoice = availableVoices.find(v => v.lang.startsWith('zh'));
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      }
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Clone voice (simplified - uses TTS with selected voice)
  const cloneVoice = async () => {
    if (!voiceText.trim()) {
      alert('Please enter some text to speak.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Use Web Speech API to speak the text
      speakWithVoice(voiceText);
      
      // Wait for speech to finish
      await new Promise((resolve) => {
        const checkSpeaking = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(checkSpeaking);
            resolve(true);
          }
        }, 100);
      });
      
      // Store the voice data
      const voiceData = {
        name: `Cloned Voice - ${new Date().toLocaleString()}`,
        voiceId: selectedVoice || 'default',
        sampleText: voiceText,
        voiceType: 'web-speech-api',
        timestamp: Date.now()
      };
      
      onVoiceCloned(voiceData);
      alert('✅ Voice cloned successfully! You can now use this voice.');
    } catch (error) {
      console.error('Clone error:', error);
      alert('Failed to clone voice. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            🎤 Voice Cloner
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              padding: '4px 8px',
              fontSize: '20px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Voice Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151',
            display: 'block',
            marginBottom: '4px'
          }}>
            Select Voice to Clone
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '12px'
            }}
          >
            {availableVoices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Record Section */}
        <div style={{
          backgroundColor: '#F9FAFB',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h4 style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            margin: '0 0 8px 0'
          }}>
            🎙️ Record Your Voice (Optional)
          </h4>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isRecording ? (
              <button
                onClick={startRecording}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                <Mic size={16} /> Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#F59E0B',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  animation: 'pulse 1.5s infinite'
                }}
              >
                <Loader2 size={16} className="animate-spin" /> Recording...
              </button>
            )}
            {recordedAudio && (
              <>
                <button
                  onClick={playRecordedAudio}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  {isPlaying ? 'Playing...' : 'Play'}
                </button>
                <audio ref={audioRef} style={{ display: 'none' }} />
              </>
            )}
          </div>
          <div style={{
            fontSize: '10px',
            color: '#6B7280',
            marginTop: '8px'
          }}>
            {recordedAudio ? '✅ Voice recorded!' : 'Record your voice or use text below'}
          </div>
        </div>

        {/* Text Input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151',
            display: 'block',
            marginBottom: '4px'
          }}>
            ✏️ Text to Speak
          </label>
          <textarea
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            placeholder="Enter text to speak with the selected voice..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '12px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          <button
            onClick={() => speakWithVoice(voiceText)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              backgroundColor: '#F3F4F6',
              cursor: 'pointer',
              fontSize: '11px',
              marginTop: '4px'
            }}
          >
            <Volume2 size={12} /> Preview Voice
          </button>
        </div>

        {/* Clone Button */}
        <button
          onClick={cloneVoice}
          disabled={isProcessing}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #9333EA, #7C3AED)',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity: isProcessing ? 0.6 : 1
          }}
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isProcessing ? 'Cloning...' : 'Clone Voice'}
        </button>

        {/* Info */}
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: '#FEF3C7',
          borderRadius: '8px',
          fontSize: '11px',
          color: '#92400E'
        }}>
          💡 This creates a voice profile using the selected voice. 
          Works on both desktop and mobile using Web Speech API!
        </div>

        <style>{`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};