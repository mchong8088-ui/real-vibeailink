"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Play, Pause, Download, Sparkles, 
  FileText, Music, Video, Globe, Settings, AlertCircle, Loader2,
  User, Send, CheckSquare, Square, Mail, Gauge, Mic, FileAudio
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

// Digital Twin Survey State
interface SurveyState {
  isOpen: boolean;
  selectedOptions: string[];
  customFeedback: string;
  isSubmitting: boolean;
  submitted: boolean;
}

export const VoiceProviderModal: React.FC<VoiceProviderModalProps> = ({
  isOpen,
  onClose,
  user: propUser,
  profile,
  initialScript = '',
  onUpgradePlan,
  langKey = 'English',
}) => {
  const [script, setScript] = useState(initialScript);
  const [language, setLanguage] = useState<'Cantonese' | 'Mandarin' | 'English'>('Cantonese');
  const [targetLanguage, setTargetLanguage] = useState<string>('None');
  const [voiceType, setVoiceType] = useState<'local' | 'gateway'>('local');
  const [speed, setSpeed] = useState<number>(1.0);
  
  // Download format selection
  const [downloadFormat, setDownloadFormat] = useState<'wav' | 'mp3'>('wav');
  
  // Scene pause controls
  const [enableScenePause, setEnableScenePause] = useState<boolean>(false);
  const [scenePause, setScenePause] = useState<number>(2);
  
  // Voice selection state
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('Aasing (Enhanced)');
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  // Uploaded audio file state
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [isAudioUploaded, setIsAudioUploaded] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Generated Outputs
  const [generatedMp3Base64, setGeneratedMp3Base64] = useState<string | null>(null);
  const [generatedSrt, setGeneratedSrt] = useState<string | null>(null);
  const [generatedChapters, setGeneratedChapters] = useState<string | null>(null);
  const [generatedSegments, setGeneratedSegments] = useState<any[] | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Digital Twin Survey State
  const [survey, setSurvey] = useState<SurveyState>({
    isOpen: false,
    selectedOptions: [],
    customFeedback: '',
    isSubmitting: false,
    submitted: false
  });

  // iOS Native TTS state
  const [useiOSNativeTTS, setUseiOSNativeTTS] = useState<boolean>(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Survey options
  const surveyOptions = [
    { id: 'youtube_intro', label: 'Create YouTube intro/outro videos' },
    { id: 'talking_avatar', label: 'Create a talking avatar of myself' },
    { id: 'voice_clone', label: 'Clone my own voice' },
    { id: 'video_tutorials', label: 'Create video tutorials without filming' },
    { id: 'marketing_videos', label: 'Generate marketing videos quickly' },
    { id: 'education', label: 'Educational content with animated talking head' },
    { id: 'personalized', label: 'Personalized video messages' },
    { id: 'other', label: 'Other (please specify)' },
  ];

  // ============================================
  // CHECK: Web vs Local vs Mobile
  // ============================================
  const isWeb = typeof window !== 'undefined' && 
    (window.location.hostname.includes('vercel.app') || 
     window.location.hostname.includes('vibeailink.com'));
  
  const isMobileDevice = typeof window !== 'undefined' && 
    (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
  
  const isMacOS = typeof window !== 'undefined' && 
    navigator.userAgent.indexOf('Mac') !== -1 && !isMobileDevice;

  const isCantoneseAvailable = !isWeb && isMacOS;

  // Check if iOS native Cantonese TTS is available
  const isiOSNativeCantoneseAvailable = typeof window !== 'undefined' && 
    /iPhone|iPad|iPod/i.test(navigator.userAgent) && 
    'speechSynthesis' in window;

  // ============================================
  // DEFINE FUNCTIONS FIRST
  // ============================================

  const loadAvailableVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const response = await fetch('/api/voices');
      const data = await response.json();
      
      if (data.success && data.voices) {
        setAvailableVoices(data.voices);
        console.log('Available voices loaded:', data.voices);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const handleVoiceChange = (voice: string) => {
    setSelectedVoice(voice);
  };

  const handleLanguageChange = (newLang: 'Cantonese' | 'Mandarin' | 'English') => {
    if ((isWeb || isMobileDevice) && newLang === 'Cantonese') {
      const msg = langKey === 'Traditional Chinese' 
        ? '粵語語音在網頁版及手機版僅支援國語發音（Mandarin fallback）。\n\n如需純正粵語發音，請使用桌面版 macOS 應用程式。'
        : langKey === 'Simplified Chinese'
        ? '粤语语音在网页版及手机版仅支持普通话发音（Mandarin fallback）。\n\n如需纯正粤语发音，请使用桌面版 macOS 应用程序。'
        : 'Cantonese on web and mobile uses Mandarin pronunciation (fallback).\n\nFor authentic Cantonese, please use the desktop macOS app.';
      
      alert(msg);
      setLanguage('Mandarin');
      loadAvailableVoices();
      return;
    }
    
    setLanguage(newLang);
    loadAvailableVoices();
  };

  const containsChinese = (text: string): boolean => {
    return /[\u4e00-\u9fff]/.test(text);
  };

  const isChineseText = (text: string): boolean => {
    const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
    const totalChars = text.replace(/\s/g, '').length;
    return totalChars > 0 && (chineseChars.length / totalChars) > 0.3;
  };

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

  const languageCodeMap: Record<string, string> = {
    'Cantonese': 'zh-HK',
    'Mandarin': 'zh-CN',
    'English': 'en-US'
  };

  // ============================================
  // iOS NATIVE TTS FUNCTION
  // ============================================
  
  const speakWithiOSNativeTTS = (text: string, language: string, speed: number = 1.0) => {
    return new Promise<Buffer>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language
      if (language === 'Cantonese' || language === 'zh-HK') {
        utterance.lang = 'zh-HK';
      } else if (language === 'Mandarin' || language === 'zh-CN') {
        utterance.lang = 'zh-CN';
      } else {
        utterance.lang = 'en-US';
      }
      
      // Set speed
      utterance.rate = speed;
      
      // Try to find a Cantonese voice
      const voices = window.speechSynthesis.getVoices();
      let cantoneseVoice = voices.find(v => v.lang === 'zh-HK' || v.lang.startsWith('zh'));
      
      if (cantoneseVoice) {
        utterance.voice = cantoneseVoice;
        console.log('🔊 iOS Native TTS: Using voice:', cantoneseVoice.name, 'Language:', cantoneseVoice.lang);
      } else {
        console.log('🔊 iOS Native TTS: No Cantonese voice found, using default');
      }

      // Collect audio data
      const audioChunks: BlobPart[] = [];
      
      // Use MediaRecorder to capture audio
      const stream = new MediaStream();
      // Note: This is a simplified approach - in production you'd use a more robust method
      
      // For now, just speak and resolve with a mock buffer
      // In production, you'd capture the audio output
      utterance.onend = () => {
        console.log('🔊 iOS Native TTS: Speech finished');
        // Return a mock buffer (in production, you'd have actual audio data)
        resolve(Buffer.from('mock-audio-data'));
      };
      
      utterance.onerror = (event) => {
        reject(new Error(`Speech error: ${event.error}`));
      };
      
      window.speechSynthesis.speak(utterance);
    });
  };

  // ============================================
  // AUDIO FILE UPLOAD FUNCTIONS
  // ============================================

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is audio
    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file (MP3, WAV, M4A, etc.)');
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size too large. Maximum 50MB.');
      return;
    }

    setUploadedAudioFile(file);
    setIsAudioUploaded(true);

    // Create URL for preview
    const url = URL.createObjectURL(file);
    setUploadedAudioUrl(url);

    // Set duration if possible
    const audio = new Audio();
    audio.src = url;
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };

    console.log('📁 Audio file uploaded:', file.name, file.size, 'bytes');
  };

  const clearUploadedAudio = () => {
    if (uploadedAudioUrl) {
      URL.revokeObjectURL(uploadedAudioUrl);
    }
    setUploadedAudioFile(null);
    setUploadedAudioUrl(null);
    setIsAudioUploaded(false);
    setAudioDuration(0);
    if (audioFileInputRef.current) {
      audioFileInputRef.current.value = '';
    }
  };

  // ============================================
  // SURVEY FUNCTIONS
  // ============================================

  const toggleSurveyOption = (optionId: string) => {
    setSurvey(prev => ({
      ...prev,
      selectedOptions: prev.selectedOptions.includes(optionId)
        ? prev.selectedOptions.filter(id => id !== optionId)
        : [...prev.selectedOptions, optionId]
    }));
  };

  const handleSurveySubmit = async () => {
    if (survey.selectedOptions.length === 0 && !survey.customFeedback.trim()) {
      alert('Please select at least one option or provide feedback.');
      return;
    }

    setSurvey(prev => ({ ...prev, isSubmitting: true }));

    try {
      const userEmail = propUser?.email || 'anonymous@user.com';
      const userName = propUser?.user_metadata?.full_name || propUser?.email?.split('@')[0] || 'Anonymous';

      const selectedLabels = surveyOptions
        .filter(opt => survey.selectedOptions.includes(opt.id))
        .map(opt => `• ${opt.label}`)
        .join('\n');

      const emailBody = `
        🎯 Digital Twin Feature Request

        User: ${userName}
        Email: ${userEmail}
        Date: ${new Date().toLocaleString()}

        Selected Features:
        ${selectedLabels || 'None selected'}

        Additional Feedback:
        ${survey.customFeedback || 'None provided'}

        ---
        This survey was submitted from the Voice Provider Studio.
      `;

      const response = await fetch('/api/send-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'vibeailink@gmail.com',
          subject: `🎯 Digital Twin Feature Request - ${userName}`,
          body: emailBody,
          userEmail: userEmail,
          userName: userName,
          selectedFeatures: survey.selectedOptions,
          feedback: survey.customFeedback,
        }),
      });

      if (response.ok) {
        setSurvey(prev => ({ ...prev, submitted: true, isSubmitting: false }));
        setTimeout(() => {
          setSurvey(prev => ({ ...prev, isOpen: false, submitted: false, selectedOptions: [], customFeedback: '' }));
        }, 3000);
      } else {
        throw new Error('Failed to send survey');
      }
    } catch (error) {
      console.error('Survey submission error:', error);
      alert('Failed to submit survey. Please try again or email us directly at vibeailink@gmail.com');
      setSurvey(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // ============================================
  // USE EFFECTS
  // ============================================

  useEffect(() => {
    if (isOpen) {
      loadAvailableVoices();
      // Don't auto-switch language - let user decide
    }
  }, [isOpen]);

  useEffect(() => {
    if ((isWeb || isMobileDevice) && language === 'Cantonese') {
      console.log('Cantonese selected on web/mobile - showing fallback notice');
    }
  }, [isWeb, isMobileDevice, language]);

  useEffect(() => {
    return () => {
      if (audioRef.current?.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      if (uploadedAudioUrl) {
        URL.revokeObjectURL(uploadedAudioUrl);
      }
    };
  }, []);

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
      if (isChineseText(text)) {
        setLanguage('Cantonese');
      }
    }
  };

  const handleAudioPreview = async () => {
    // If there's an uploaded audio file, play it
    if (uploadedAudioUrl) {
      if (audioRef.current) {
        audioRef.current.src = uploadedAudioUrl;
        audioRef.current.load();
        try {
          await audioRef.current.play();
          setIsPlayingAudio(true);
        } catch (playError) {
          console.error('Play error:', playError);
          setPreviewError('Failed to play uploaded audio.');
        }
      }
      return;
    }

    if (!script.trim()) {
      alert("Please enter some script text first.");
      return;
    }
    
    if (isChineseText(script) && language === 'English') {
      const confirmSwitch = confirm(
        "You have Chinese text but selected English voice. This will not pronounce correctly. Would you like to switch to Cantonese or Mandarin?"
      );
      if (confirmSwitch) {
        if (isWeb || isMobileDevice) {
          setLanguage('Mandarin');
        } else {
          setLanguage('Cantonese');
        }
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
          selectedVoice,
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

  const handleGenerate = async () => {
    // If there's an uploaded audio file, we can skip generation
    if (uploadedAudioFile) {
      alert('You have uploaded an audio file. Use the preview to listen, or generate subtitles from the script.');
      return;
    }

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

    if (isChineseText(script) && language === 'English') {
      const confirmSwitch = confirm(
        "You have Chinese text but selected English voice. This will not pronounce correctly. Would you like to switch to Cantonese or Mandarin?"
      );
      if (confirmSwitch) {
        if (isWeb || isMobileDevice) {
          setLanguage('Mandarin');
        } else {
          setLanguage('Cantonese');
        }
        await loadAvailableVoices();
      }
    }

    setIsLoading(true);

    const langCode = languageCodeMap[language] || 'zh-HK';

    try {
      // Generate Voice
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
          format: downloadFormat,
          scenePause: enableScenePause ? scenePause : 0,
        }),
      });

      const voiceData = await voiceRes.json();
      console.log('=== VOICE API RESPONSE ===');
      console.log('Success:', voiceData.success);

      if (voiceData.success) {
        const cleanAudio = voiceData.audio.replace(/\s/g, '');
        console.log('Clean audio data length:', cleanAudio.length);
        
        setGeneratedMp3Base64(cleanAudio);
        
        const actualDuration = voiceData.duration || 0;
        setAudioDuration(actualDuration);

        // Generate Subtitles
        const subRes = await fetch('/api/youtube/subtitles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script,
            language,
            langCode,
            targetLanguage: targetLanguage !== 'None' ? targetLanguage : undefined,
            totalDuration: actualDuration,
          }),
        });

        const subData = await subRes.json();
        console.log('=== SUBTITLE API RESPONSE ===');
        
        if (subData.success) {
          setGeneratedSrt(subData.srt);
          setGeneratedChapters(subData.youtubeChapters);
          setGeneratedSegments(subData.segments || []);
        } else {
          console.warn('Subtitle generation warning:', subData.error);
        }

      } else {
        alert(voiceData.error || "Voice generation failed.");
        setIsLoading(false);
        return;
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
      const cleanBase64 = generatedMp3Base64.replace(/\s/g, '');
      const dataUrl = `data:${mimeType};base64,${cleanBase64}`;
      
      fetch(dataUrl)
        .then(response => response.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
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

  const formatDurationDisplay = (seconds: number): string => {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVoiceSelectorHelpText = () => {
    if (langKey === 'Traditional Chinese') {
      return '💡 如果您的電腦未安裝語音，請選擇「自動男聲」或「自動女聲」以使用雲端語音。\n📌 粵語在網頁版將使用國語發音作為替代。';
    } else if (langKey === 'Simplified Chinese') {
      return '💡 如果您的电脑未安装语音，请选择「自动男声」或「自动女声」以使用云端语音。\n📌 粤语在网页版将使用普通话发音作为替代。';
    } else {
      return '💡 If you don\'t have voices installed, select "Auto-Male" or "Auto-Female" for cloud voices.\n📌 Cantonese on web uses Mandarin pronunciation as fallback.';
    }
  };

  const getCantoneseWebWarning = () => {
    if ((isWeb || isMobileDevice) && language === 'Cantonese') {
      if (langKey === 'Traditional Chinese') {
        return '⚠️ 粵語在網頁版及手機版將使用國語發音。如需純正粵語，請使用桌面版 macOS 應用程式。';
      } else if (langKey === 'Simplified Chinese') {
        return '⚠️ 粤语在网页版及手机版将使用普通话发音。如需纯正粤语，请使用桌面版 macOS 应用程序。';
      } else {
        return '⚠️ Cantonese on web and mobile uses Mandarin pronunciation. For authentic Cantonese, use the desktop macOS app.';
      }
    }
    return null;
  };

  // ============================================
  // RENDER - FIXED MOBILE VERSION
  // ============================================

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
      paddingTop: '40px',
      overflow: 'hidden'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '640px',
        height: 'calc(100vh - 80px)',
        overflowY: 'auto',
        padding: '20px',
        paddingTop: '16px',
        paddingBottom: '30px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E5E7EB',
        position: 'relative'
      }}>
        {/* Header - Fixed with sticky close button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '12px',
          position: 'sticky',
          top: 0,
          backgroundColor: '#FFFFFF',
          zIndex: 10,
          paddingBottom: '10px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles color="#8B5CF6" size={20} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              Voice Provider Studio
            </h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: '#F3F4F6',
              border: 'none',
              cursor: 'pointer',
              color: '#374151',
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px',
              fontSize: '20px',
              fontWeight: 'bold'
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ============================================================
            CANTONESE MOBILE WARNING - COMPACT VERSION
            ============================================================ */}
        {(isMobileDevice || isWeb) && (
          <div style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #F59E0B',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>📱</span>
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '12px', 
                color: '#92400E',
                marginBottom: '2px'
              }}>
                {langKey === 'Traditional Chinese' ? '💡 桌面版 macOS 推薦' :
                 langKey === 'Simplified Chinese' ? '💡 桌面版 macOS 推荐' :
                 '💡 Desktop macOS Recommended'}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#78350F',
                lineHeight: '1.4'
              }}>
                {langKey === 'Traditional Chinese' 
                  ? '此功能在桌面版 macOS 可提供最佳粵語語音。手機版與網頁版使用國語發音替代。'
                  : langKey === 'Simplified Chinese'
                  ? '此功能在桌面版 macOS 可提供最佳粤语语音。手机版与网页版使用普通话发音替代。'
                  : 'Best Cantonese voice experience on desktop macOS. Mobile/web uses Mandarin fallback.'}
              </div>
              <div style={{
                marginTop: '4px',
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  fontSize: '9px',
                  backgroundColor: '#FDE68A',
                  color: '#78350F',
                  padding: '1px 8px',
                  borderRadius: '4px'
                }}>
                  {isMobileDevice ? '📱 Mobile' : '🌐 Web'}
                </span>
                <span style={{
                  fontSize: '9px',
                  backgroundColor: '#D1FAE5',
                  color: '#065F46',
                  padding: '1px 8px',
                  borderRadius: '4px'
                }}>
                  🎯 Mandarin Fallback
                </span>
                {isiOSNativeCantoneseAvailable && (
                  <span style={{
                    fontSize: '9px',
                    backgroundColor: '#DBEAFE',
                    color: '#1E40AF',
                    padding: '1px 8px',
                    borderRadius: '4px'
                  }}>
                    🍎 iOS TTS Available
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            iOS Native TTS Option - ONLY FOR iOS DEVICES
            ============================================================ */}
        {isiOSNativeCantoneseAvailable && (
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #3B82F6',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🍎</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1E40AF' }}>
                  {langKey === 'Traditional Chinese' ? 'iOS 粵語 TTS 可用' :
                   langKey === 'Simplified Chinese' ? 'iOS 粤语 TTS 可用' :
                   'iOS Cantonese TTS Available'}
                </div>
                <div style={{ fontSize: '10px', color: '#3B82F6' }}>
                  {langKey === 'Traditional Chinese' ? '使用 iOS 原生粵語語音（與通知相同）' :
                   langKey === 'Simplified Chinese' ? '使用 iOS 原生粤语语音（与通知相同）' :
                   'Use iOS native Cantonese voice (same as notifications)'}
                </div>
              </div>
            </div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={useiOSNativeTTS}
                onChange={(e) => setUseiOSNativeTTS(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '11px', fontWeight: '500', color: '#1E40AF' }}>
                {langKey === 'Traditional Chinese' ? '啟用' :
                 langKey === 'Simplified Chinese' ? '启用' :
                 'Enable'}
              </span>
            </label>
          </div>
        )}

        {/* Script Area */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>Script Content</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px', background: '#F3F4F6',
                  border: 'none', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '10px', color: '#4B5563'
                }}
              >
                <FileText size={12} /> Import
              </button>
              <button
                onClick={() => audioFileInputRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px', background: '#F3F4F6',
                  border: 'none', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '10px', color: '#4B5563'
                }}
                title="Upload MP3, WAV, M4A audio files"
              >
                <FileAudio size={12} /> Upload Audio
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.docx" style={{ display: 'none' }} />
            <input type="file" ref={audioFileInputRef} onChange={handleAudioFileUpload} accept="audio/*" style={{ display: 'none' }} />
          </div>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your script here..."
            rows={4}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '12px', fontFamily: 'inherit', resize: 'vertical' }}
          />
          
          {/* Uploaded Audio File Display */}
          {isAudioUploaded && uploadedAudioFile && (
            <div style={{
              marginTop: '6px',
              padding: '8px 12px',
              backgroundColor: '#ECFDF5',
              borderRadius: '8px',
              border: '1px solid #86EFAC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Music size={16} color="#10B981" />
                <span style={{ fontSize: '11px', color: '#065F46' }}>
                  {uploadedAudioFile.name} ({(uploadedAudioFile.size / 1024 / 1024).toFixed(2)} MB)
                  {audioDuration > 0 && ` • ${formatDurationDisplay(audioDuration)}`}
                </span>
              </div>
              <button
                onClick={clearUploadedAudio}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#EF4444',
                  fontSize: '11px',
                  padding: '2px 8px'
                }}
              >
                ✕ Remove
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: '#6B7280' }}>
            <span>Characters: {charCount}</span>
            <span>Est. Cost: <strong>{estimatedCredits} Credits</strong></span>
          </div>
          
          {getCantoneseWebWarning() && (
            <div style={{
              marginTop: '6px',
              padding: '6px 10px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#92400E'
            }}>
              {getCantoneseWebWarning()}
            </div>
          )}
          {getLanguageWarning() && (
            <div style={{
              marginTop: '6px',
              padding: '6px 10px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#92400E'
            }}>
              {getLanguageWarning()}
            </div>
          )}
        </div>

        {/* Controls - Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '3px' }}>Voice Language</label>
            <select value={language} onChange={(e: any) => {
              handleLanguageChange(e.target.value);
            }} style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '11px' }}>
              <option value="Cantonese" disabled={isWeb || isMobileDevice}>
                Cantonese (粵語 - zh-HK) {(isWeb || isMobileDevice) && '⚠️ Fallback'}
              </option>
              <option value="Mandarin">Mandarin (國語 - zh-CN)</option>
              <option value="English">English (en-US)</option>
            </select>
            {(isWeb || isMobileDevice) && (
              <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '2px' }}>
                💡 Uses Mandarin pronunciation on mobile/web
              </div>
            )}
            {isMacOS && !isWeb && !isMobileDevice && (
              <div style={{ fontSize: '9px', color: '#10B981', marginTop: '2px' }}>
                ✅ Full Cantonese support on macOS
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '3px' }}>Subtitle Translation</label>
            <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '11px' }}>
              <option value="None">None (Original)</option>
              <option value="English">Bilingual English</option>
              <option value="Traditional Chinese">Bilingual Traditional</option>
              <option value="Simplified Chinese">Bilingual Simplified</option>
            </select>
          </div>
        </div>

        {/* Voice Engine and Voice Selector - Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '3px' }}>Voice Engine</label>
            <select 
              value={voiceType} 
              onChange={(e: any) => setVoiceType(e.target.value)} 
              style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '11px' }}
            >
              <option value="local">Local (Desktop)</option>
              <option value="gateway">Gateway (Cloud)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '3px' }}>
              Select Voice {isLoadingVoices && <Loader2 size={12} className="animate-spin" />}
            </label>
            <div style={{ width: '100%' }}>
              <VoiceSelector 
                currentVoice={selectedVoice}
                onVoiceChange={handleVoiceChange}
                mode="voice"
              />
            </div>
          </div>
        </div>

        {/* Speed Control Bar - Compact */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            fontSize: '11px', 
            fontWeight: '500', 
            color: '#374151', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            marginBottom: '3px'
          }}>
            <Gauge size={14} />
            Speed: <span style={{ fontWeight: 'bold', color: '#2563EB' }}>{speed.toFixed(1)}x</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '9px', color: '#6B7280' }}>🐢</span>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              style={{ 
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                backgroundColor: '#E5E7EB',
                outline: 'none',
                WebkitAppearance: 'none'
              }}
            />
            <span style={{ fontSize: '9px', color: '#6B7280' }}>🐇</span>
          </div>
        </div>

        {/* Scene Pause Control - Compact */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            fontSize: '11px', 
            fontWeight: '500', 
            color: '#374151', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            marginBottom: '3px'
          }}>
            <span style={{ fontSize: '14px' }}>🎬</span>
            Scene Pauses
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '10px', 
              cursor: 'pointer',
              color: enableScenePause ? '#2563EB' : '#6B7280'
            }}>
              <input
                type="checkbox"
                checked={enableScenePause}
                onChange={(e) => {
                  setEnableScenePause(e.target.checked);
                  if (!e.target.checked) setScenePause(0);
                }}
                style={{ cursor: 'pointer' }}
              />
              Enable
            </label>
            {enableScenePause && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                <span style={{ fontSize: '9px', color: '#6B7280' }}>⏱️</span>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={scenePause}
                  onChange={(e) => setScenePause(parseFloat(e.target.value))}
                  style={{ 
                    flex: 1,
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: '#E5E7EB',
                    outline: 'none',
                    WebkitAppearance: 'none'
                  }}
                />
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#2563EB', minWidth: '25px' }}>
                  {scenePause}s
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Preview Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '6px 10px', background: '#F9FAFB', borderRadius: '8px' }}>
          <button
            onClick={handleAudioPreview}
            disabled={isPreviewing || (!script.trim() && !uploadedAudioFile)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', 
              borderRadius: '16px', border: '1px solid #10B981', background: '#ECFDF5', 
              color: '#047857', cursor: 'pointer', fontSize: '11px', fontWeight: '600'
            }}
          >
            {isPreviewing ? <Loader2 size={12} className="animate-spin" /> : (isPlayingAudio ? <Pause size={12} /> : <Play size={12} />)}
            {uploadedAudioFile ? 'Play Audio' : `5s ${language} Preview`}
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
            <span style={{ fontSize: '10px', color: '#EF4444' }}>{previewError}</span>
          )}
          {selectedVoice && !uploadedAudioFile && (
            <span style={{ fontSize: '10px', color: '#6B7280', marginLeft: 'auto' }}>
              Voice: {selectedVoice}
            </span>
          )}
        </div>

        {/* Generate Action */}
        <button
          onClick={handleGenerate}
          disabled={isLoading || isAudioUploaded}
          style={{
            width: '100%', padding: '8px', borderRadius: '8px',
            backgroundColor: isAudioUploaded ? '#9CA3AF' : '#10B981',
            color: 'white', border: 'none',
            fontWeight: '600', fontSize: '13px', cursor: isAudioUploaded ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '12px',
            opacity: isAudioUploaded ? 0.6 : 1
          }}
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {isLoading ? 'Generating...' : isAudioUploaded ? 'Audio Uploaded - Ready' : `Generate Package (${estimatedCredits} Credits)`}
        </button>

        {/* Downloads - Compact */}
        {generatedMp3Base64 && (
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
              <button 
                onClick={downloadScript} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '4px', 
                  padding: '6px', 
                  borderRadius: '6px', 
                  border: '1px solid #D1D5DB', 
                  background: '#FFFFFF', 
                  fontSize: '10px', 
                  cursor: 'pointer' 
                }}
              >
                <FileText size={11} /> Script
              </button>
              
              <button 
                onClick={downloadAudio} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '4px', 
                  padding: '6px', 
                  borderRadius: '6px', 
                  border: 'none', 
                  background: '#10B981', 
                  color: 'white', 
                  fontSize: '10px', 
                  cursor: 'pointer' 
                }}
              >
                <Music size={11} /> {downloadFormat.toUpperCase()}
              </button>
              
              <button 
                onClick={downloadSubtitles} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '4px', 
                  padding: '6px', 
                  borderRadius: '6px', 
                  border: 'none', 
                  background: '#3B82F6', 
                  color: 'white', 
                  fontSize: '10px', 
                  cursor: 'pointer' 
                }}
              >
                <Video size={11} /> Subtitles
              </button>

              <button 
                onClick={() => setSurvey(prev => ({ ...prev, isOpen: true }))}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '4px', 
                  padding: '6px', 
                  borderRadius: '6px', 
                  border: 'none', 
                  background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)',
                  color: 'white', 
                  fontSize: '10px', 
                  cursor: 'pointer',
                  fontWeight: '500',
                  position: 'relative'
                }}
              >
                <span style={{ 
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#EF4444',
                  color: 'white',
                  fontSize: '6px',
                  fontWeight: 'bold',
                  padding: '1px 4px',
                  borderRadius: '8px'
                }}>
                  NEW
                </span>
                <User size={11} /> Twin
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Digital Twin Survey Modal */}
      {survey.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }} onClick={() => {
          if (!survey.submitted) {
            setSurvey(prev => ({ ...prev, isOpen: false }));
          }
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            boxShadow: '0 40px 80px -20px rgba(0,0,0,0.4)',
            position: 'relative',
            animation: 'slideUp 0.3s ease'
          }} onClick={(e) => e.stopPropagation()}>
            
            {survey.submitted ? (
              // Success State
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ 
                  fontSize: '60px', 
                  marginBottom: '16px',
                  background: 'linear-gradient(135deg, #9333EA, #7C3AED)',
                  borderRadius: '50%',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto'
                }}>
                  ✅
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 8px 0' }}>
                  Thank You! 🎉
                </h3>
                <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                  Your feedback has been sent successfully!<br />
                  We'll keep you updated on the Digital Twin feature development.
                </p>
                <button
                  onClick={() => {
                    setSurvey(prev => ({ ...prev, isOpen: false, submitted: false, selectedOptions: [], customFeedback: '' }));
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 32px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              // Survey Content
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <User size={24} color="#9333EA" />
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>
                        🎯 Digital Twin
                      </h3>
                      <span style={{
                        background: 'linear-gradient(135deg, #9333EA, #7C3AED)',
                        color: 'white',
                        fontSize: '9px',
                        fontWeight: '700',
                        padding: '2px 10px',
                        borderRadius: '100px'
                      }}>
                        COMING SOON
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                      Help us build the perfect Digital Twin feature for you!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!survey.submitted) {
                        setSurvey(prev => ({ ...prev, isOpen: false }));
                      }
                    }}
                    style={{
                      background: '#F1F5F9',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} color="#64748B" />
                  </button>
                </div>

                <div style={{ 
                  background: '#F5F3FF', 
                  borderRadius: '12px', 
                  padding: '12px 16px',
                  marginBottom: '20px',
                  border: '1px solid #E9D5FF'
                }}>
                  <p style={{ fontSize: '12px', color: '#6B21A8', margin: 0, lineHeight: '1.5' }}>
                    💡 <strong>Imagine:</strong> Upload a photo, and watch it come alive to speak your script. 
                    Perfect for YouTube intros, tutorials, and marketing videos!
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', margin: '0 0 12px 0' }}>
                    What would you use Digital Twin for? (Select all that apply)
                  </p>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {surveyOptions.map((option) => (
                      <label
                        key={option.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          backgroundColor: survey.selectedOptions.includes(option.id) ? '#F5F3FF' : '#F8FAFC',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          border: survey.selectedOptions.includes(option.id) ? '2px solid #9333EA' : '1px solid #E2E8F0',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{ fontSize: '16px', color: survey.selectedOptions.includes(option.id) ? '#9333EA' : '#94A3B8' }}>
                          {survey.selectedOptions.includes(option.id) ? '☑️' : '☐'}
                        </span>
                        <span style={{ fontSize: '13px', color: '#1E293B' }}>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Additional Feedback 💬
                  </label>
                  <textarea
                    value={survey.customFeedback}
                    onChange={(e) => setSurvey(prev => ({ ...prev, customFeedback: e.target.value }))}
                    placeholder="Share your ideas, feature requests, or anything else..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      backgroundColor: '#F8FAFC',
                      transition: 'border 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.border = '2px solid #9333EA'}
                    onBlur={(e) => e.target.style.border = '1px solid #E2E8F0'}
                  />
                </div>

                <button
                  onClick={handleSurveySubmit}
                  disabled={survey.isSubmitting}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: survey.isSubmitting ? '#9CA3AF' : 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: survey.isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {survey.isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} /> Submit Feedback
                    </>
                  )}
                </button>

                <p style={{ 
                  fontSize: '10px', 
                  color: '#94A3B8', 
                  textAlign: 'center', 
                  margin: '12px 0 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}>
                  <Mail size={12} /> Your feedback will be sent to vibeailink@gmail.com
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Styles for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};