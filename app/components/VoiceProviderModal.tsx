"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Play, Pause, Download, Sparkles, 
  FileText, Music, Video, Globe, Settings, AlertCircle, Loader2,
  User, Send, CheckSquare, Square, Mail, Gauge, Mic, FileAudio,
  CheckCircle, AlertTriangle, RefreshCw, Type, Info
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

interface Voice {
  name: string;
  language: string;
  gender?: string;
  quality?: string;
}

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
  const [downloadFormat, setDownloadFormat] = useState<'wav' | 'mp3'>('wav');
  const [enableScenePause, setEnableScenePause] = useState<boolean>(false);
  const [scenePause, setScenePause] = useState<number>(2);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('Aasing (Enhanced)');
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [isAudioUploaded, setIsAudioUploaded] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<boolean>(false);
  
  // Speech-to-Text states
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [transcriptionSuccess, setTranscriptionSuccess] = useState<boolean>(false);

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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

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

  const isWeb = typeof window !== 'undefined' && 
    (window.location.hostname.includes('vercel.app') || 
     window.location.hostname.includes('vibeailink.com'));
  
  const isCantoneseAvailable = !isWeb;

  // ============================================
  // FUNCTIONS
  // ============================================

  const loadAvailableVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const response = await fetch('/api/voices');
      const data = await response.json();
      if (data.success && data.voices) {
        setAvailableVoices(data.voices);
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
    if (isWeb && newLang === 'Cantonese') {
      const msg = langKey === 'Traditional Chinese' 
        ? '粵語語音在網頁版僅支援國語發音（Mandarin fallback）。\n\n如需純正粵語發音，請使用桌面版應用程式（macOS）。'
        : langKey === 'Simplified Chinese'
        ? '粤语语音在网页版仅支持普通话发音（Mandarin fallback）。\n\n如需纯正粤语发音，请使用桌面版应用程序（macOS）。'
        : 'Cantonese on web uses Mandarin pronunciation (fallback).\n\nFor authentic Cantonese, please use the desktop app (macOS).';
      alert(msg);
      setLanguage('Mandarin');
      loadAvailableVoices();
      return;
    }
    setLanguage(newLang);
    loadAvailableVoices();
  };

  const containsChinese = (text: string): boolean => /[\u4e00-\u9fff]/.test(text);

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

  const getSuggestedLanguage = () => {
    if (isChineseText(script)) return 'Cantonese';
    return null;
  };

  const languageCodeMap: Record<string, string> = {
    'Cantonese': 'zh-HK',
    'Mandarin': 'zh-CN',
    'English': 'en-US'
  };

  // ============================================
  // AUDIO FILE UPLOAD & TRANSCRIPTION
  // ============================================

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    setTranscriptionSuccess(false);
    setTranscriptionError(null);

    const url = URL.createObjectURL(file);
    setUploadedAudioUrl(url);

    const audio = new Audio();
    audio.src = url;
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };
  };

  const clearUploadedAudio = () => {
    if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
    setUploadedAudioFile(null);
    setUploadedAudioUrl(null);
    setIsAudioUploaded(false);
    setAudioDuration(0);
    setTranscriptionSuccess(false);
    setTranscriptionError(null);
    if (audioFileInputRef.current) audioFileInputRef.current.value = '';
  };

  // ============================================
  // SPEECH-TO-TEXT (Convert Audio to Script)
  // ============================================

  const handleConvertToScript = async () => {
  if (!uploadedAudioFile) {
    alert('Please upload an audio file first.');
    return;
  }

  setIsTranscribing(true);
  setTranscriptionError(null);
  setTranscriptionSuccess(false);

  try {
    // Convert the audio file to base64
    const reader = new FileReader();
    const audioBase64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(uploadedAudioFile);
    });

    // Detect language from the audio (use the selected language as hint)
    const detectLang = language === 'Cantonese' ? 'zh-HK' : 
                       language === 'Mandarin' ? 'zh-CN' : 'en-US';

    console.log('📤 Sending to speech-to-text API...');

    // Call the speech-to-text API
    const response = await fetch('/api/speech-to-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: audioBase64,
        language: detectLang,
        format: uploadedAudioFile.type.includes('wav') ? 'wav' : 'mp3',
      }),
    });

    const result = await response.json();
    console.log('📥 Speech-to-text response:', result);
    
    // Handle errors
    if (!response.ok) {
      if (response.status === 402) {
        const errorMsg = langKey === 'Traditional Chinese' 
          ? `❌ 積分不足！需要 ${result.creditsNeeded || '?'} 積分，您只有 ${result.creditsAvailable || 0} 積分。\n\n請充值後再試。`
          : langKey === 'Simplified Chinese'
          ? `❌ 积分不足！需要 ${result.creditsNeeded || '?'} 积分，您只有 ${result.creditsAvailable || 0} 积分。\n\n请充值后再试。`
          : `❌ Insufficient credits! Need ${result.creditsNeeded || '?'} credits, you have ${result.creditsAvailable || 0}.\n\nPlease top up and try again.`;
        
        setTranscriptionError(errorMsg);
        setIsTranscribing(false);
        return;
      }
      
      throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    if (result.success && result.text) {
      // Set the transcribed text to the script
      setScript(result.text);
      setTranscriptionSuccess(true);
      
      // Auto-detect language if Chinese
      if (isChineseText(result.text)) {
        setLanguage('Cantonese');
      }
      
      // Show success with credit info
      const successMsg = langKey === 'Traditional Chinese'
        ? `✅ 轉錄完成！${result.isDevMode ? '（測試模式）' : `使用了 ${result.creditsUsed} 積分，剩餘 ${result.creditsRemaining} 積分`}`
        : langKey === 'Simplified Chinese'
        ? `✅ 转录完成！${result.isDevMode ? '（测试模式）' : `使用了 ${result.creditsUsed} 积分，剩余 ${result.creditsRemaining} 积分`}`
        : `✅ Transcription complete!${result.isDevMode ? ' (Test Mode)' : ` Used ${result.creditsUsed} credits, ${result.creditsRemaining} remaining`}`;
      
      console.log(successMsg);
    } else {
      throw new Error(result.error || 'Transcription failed');
    }
  } catch (error) {
    console.error('Transcription error:', error);
    const errorMsg = langKey === 'Traditional Chinese'
      ? `轉錄失敗：${error instanceof Error ? error.message : '請重試'}`
      : langKey === 'Simplified Chinese'
      ? `转录失败：${error instanceof Error ? error.message : '请重试'}`
      : `Transcription failed: ${error instanceof Error ? error.message : 'Please try again'}`;
    
    setTranscriptionError(errorMsg);
  } finally {
    setIsTranscribing(false);
  }
};

  // ============================================
  // SURVEY
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
      if (script && isChineseText(script)) setLanguage('Cantonese');
      setGenerationSuccess(false);
      setGenerationError(null);
      setTranscriptionSuccess(false);
      setTranscriptionError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isWeb && language === 'Cantonese') {
      setLanguage('Mandarin');
      loadAvailableVoices();
    }
  }, [isWeb]);

  useEffect(() => {
    return () => {
      if (audioRef.current?.src) URL.revokeObjectURL(audioRef.current.src);
      if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
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
      if (isChineseText(text)) setLanguage('Cantonese');
    }
  };

  const handleAudioPreview = async () => {
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
        if (isWeb) setLanguage('Mandarin');
        else setLanguage('Cantonese');
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

      if (audioRef.current?.src) URL.revokeObjectURL(audioRef.current.src);

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
    setGenerationError(null);
    setGenerationSuccess(false);
    setGeneratedMp3Base64(null);
    setGeneratedSrt(null);
    setGeneratedChapters(null);
    setGeneratedSegments(null);

    if (uploadedAudioFile) {
      alert('You have uploaded an audio file. Use the preview to listen, or remove it to generate new audio.');
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
        if (isWeb) setLanguage('Mandarin');
        else setLanguage('Cantonese');
        await loadAvailableVoices();
      }
    }

    setIsLoading(true);

    const langCode = languageCodeMap[language] || 'zh-HK';

    try {
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
        setGeneratedMp3Base64(cleanAudio);
        
        const actualDuration = voiceData.duration || 0;
        setAudioDuration(actualDuration);

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
        
        if (subData.success) {
          setGeneratedSrt(subData.srt);
          setGeneratedChapters(subData.youtubeChapters);
          setGeneratedSegments(subData.segments || []);
        } else {
          console.warn('Subtitle generation warning:', subData.error);
        }

        setGenerationSuccess(true);
        setGenerationError(null);

      } else {
        setGenerationError(voiceData.error || "Voice generation failed.");
      }

    } catch (err) {
      console.error('Generation failed:', err);
      setGenerationError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
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

  const charCount = script.length;
  let baseCredits = charCount < 500 ? 2 : (charCount > 2000 ? 10 : 5);
  const estimatedCredits = voiceType === 'gateway' ? baseCredits * 2 : baseCredits;

  const suggestedLang = getSuggestedLanguage();

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
    if (isWeb && language === 'Cantonese') {
      if (langKey === 'Traditional Chinese') {
        return '⚠️ 粵語在網頁版將使用國語發音。如需純正粵語，請使用桌面版 macOS 應用程式。';
      } else if (langKey === 'Simplified Chinese') {
        return '⚠️ 粤语在网页版将使用普通话发音。如需纯正粤语，请使用桌面版 macOS 应用程序。';
      } else {
        return '⚠️ Cantonese on web uses Mandarin pronunciation. For authentic Cantonese, use the desktop macOS app.';
      }
    }
    return null;
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
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px', background: '#F3F4F6',
                  border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '11px', color: '#4B5563'
                }}
              >
                <FileText size={12} /> Import Script (.txt, .docx)
              </button>
              <button
                onClick={() => audioFileInputRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px', background: '#F3F4F6',
                  border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '11px', color: '#4B5563'
                }}
                title="Upload MP3, WAV, M4A audio files"
              >
                <FileAudio size={12} /> Upload Audio (MP3/WAV)
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.docx" style={{ display: 'none' }} />
            <input type="file" ref={audioFileInputRef} onChange={handleAudioFileUpload} accept="audio/*" style={{ display: 'none' }} />
          </div>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your script here..."
            rows={6}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '12px', fontFamily: 'inherit', resize: 'vertical' }}
          />
          
          {/* Uploaded Audio File Display */}
          {isAudioUploaded && uploadedAudioFile && (
            <div style={{
              marginTop: '8px',
              padding: '10px 14px',
              backgroundColor: '#ECFDF5',
              borderRadius: '8px',
              border: '1px solid #86EFAC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Music size={16} color="#10B981" />
                <span style={{ fontSize: '12px', color: '#065F46' }}>
                  {uploadedAudioFile.name} ({(uploadedAudioFile.size / 1024 / 1024).toFixed(2)} MB)
                  {audioDuration > 0 && ` • ${formatDurationDisplay(audioDuration)}`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {/* Convert to Script Button */}
                <button
                  onClick={handleConvertToScript}
                  disabled={isTranscribing}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isTranscribing ? '#9CA3AF' : '#8B5CF6',
                    color: 'white',
                    fontSize: '11px',
                    cursor: isTranscribing ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {isTranscribing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Type size={14} />
                  )}
                  {isTranscribing ? 'Transcribing...' : 'Convert to Script'}
                </button>
                <button
                  onClick={clearUploadedAudio}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#EF4444',
                    fontSize: '12px',
                    padding: '2px 8px'
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          )}

          {/* Transcription Status */}
          {transcriptionError && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#FEF2F2',
              borderRadius: '6px',
              border: '1px solid #FCA5A5',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertTriangle size={14} color="#EF4444" />
              <span style={{ fontSize: '12px', color: '#991B1B' }}>{transcriptionError}</span>
            </div>
          )}
          
          {transcriptionSuccess && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#F0FDF4',
              borderRadius: '6px',
              border: '1px solid #86EFAC',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle size={14} color="#10B981" />
              <span style={{ fontSize: '12px', color: '#065F46' }}>
                ✅ Transcription complete! Script updated above. You can now edit and generate audio.
              </span>
            </div>
          )}

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
                  handleLanguageChange(suggestedLang as any);
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
          {getCantoneseWebWarning() && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#92400E'
            }}>
              {getCantoneseWebWarning()}
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

          {/* ── USER GUIDE / LIMITATIONS ── */}
          <div style={{
            marginTop: '12px',
            padding: '12px 14px',
            backgroundColor: '#F0F9FF',
            borderRadius: '8px',
            border: '1px solid #BAE6FD',
            fontSize: '11px'
          }}>
            <div style={{ fontWeight: '600', color: '#0369A1', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} /> 📋 Voice Provider Guide
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', color: '#0C4A6E' }}>
              <div>
                <span style={{ fontWeight: '600' }}>📝 Script Import:</span>
                <span style={{ fontSize: '10px', display: 'block', color: '#475569' }}>
                  • Max 10,000 characters<br />
                  • Supports .txt, .docx<br />
                  • Est. cost: 2-10 credits
                </span>
              </div>
              <div>
                <span style={{ fontWeight: '600' }}>🎵 Audio Upload:</span>
                <span style={{ fontSize: '10px', display: 'block', color: '#475569' }}>
                  • Max 10MB (Free) / 50MB (Subscriber)<br />
                  • Max 5 mins (Free) / 30 mins (Subscriber)<br />
                  • Supports MP3, WAV, M4A
                </span>
              </div>
              <div>
                <span style={{ fontWeight: '600' }}>🎙️ Convert to Script:</span>
                <span style={{ fontSize: '10px', display: 'block', color: '#475569' }}>
                  • 5 credits per minute<br />
                  • Min 2 credits per file<br />
                  • Auto-detects language
                </span>
              </div>
              <div>
                <span style={{ fontWeight: '600' }}>📥 Generate Package:</span>
                <span style={{ fontSize: '10px', display: 'block', color: '#475569' }}>
                  • WAV (Lossless) / MP3 (Compressed)<br />
                  • SRT Subtitles with timing<br />
                  • YouTube chapter markers
                </span>
              </div>
            </div>
            <div style={{ 
              marginTop: '8px', 
              paddingTop: '8px', 
              borderTop: '1px solid #BAE6FD',
              fontSize: '10px',
              color: '#64748B',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '4px'
            }}>
              <span>💡 <strong>Tip:</strong> Upload audio → Convert to Script → Edit → Generate new audio + subtitles</span>
              <span style={{ color: '#DC2626' }}>⚠️ For educational use only. Max 30 mins per file.</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Voice Language</label>
            <select value={language} onChange={(e: any) => {
              handleLanguageChange(e.target.value);
            }} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}>
              <option value="Cantonese" disabled={isWeb}>
                Cantonese (粵語 - zh-HK) {isWeb && '⚠️ Web (Mandarin fallback)'}
              </option>
              <option value="Mandarin">Mandarin (國語 - zh-CN)</option>
              <option value="English">English (en-US)</option>
            </select>
            {isWeb && (
              <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>
                💡 Cantonese on web uses Mandarin pronunciation (fallback)
              </div>
            )}
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

        {/* Voice Engine and Voice Selector */}
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
                mode="voice"
              />
            </div>
            <div style={{
              fontSize: '10px',
              color: '#6B7280',
              marginTop: '6px',
              padding: '6px 10px',
              backgroundColor: '#F3F4F6',
              borderRadius: '6px',
              lineHeight: '1.4'
            }}>
              {getVoiceSelectorHelpText()}
            </div>
          </div>
        </div>

        {/* Speed Control */}
        <div style={{ marginBottom: '16px', marginTop: '8px' }}>
          <label style={{ 
            fontSize: '12px', 
            fontWeight: '500', 
            color: '#374151', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '4px'
          }}>
            <Gauge size={16} />
            Speech Speed: <span style={{ fontWeight: 'bold', color: '#2563EB' }}>{speed.toFixed(1)}x</span>
            <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: 'normal' }}>
              ({speed < 0.9 ? 'Slower' : speed > 1.1 ? 'Faster' : 'Normal'})
            </span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '10px', color: '#6B7280' }}>🐢</span>
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
            <span style={{ fontSize: '10px', color: '#6B7280' }}>🐇</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#9CA3AF', marginTop: '2px' }}>
            <span>Slow (0.5x)</span>
            <span>Normal (1.0x)</span>
            <span>Fast (1.5x)</span>
          </div>
        </div>

        {/* Scene Pause */}
        <div style={{ marginBottom: '16px', marginTop: '8px' }}>
          <label style={{ 
            fontSize: '12px', 
            fontWeight: '500', 
            color: '#374151', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '4px'
          }}>
            <span style={{ fontSize: '16px' }}>🎬</span>
            Scene Pauses
            <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: 'normal' }}>
              (Add pauses between scenes)
            </span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '11px', 
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
              Enable scene pauses
            </label>
            {enableScenePause && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span style={{ fontSize: '10px', color: '#6B7280' }}>⏱️</span>
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
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563EB', minWidth: '30px' }}>
                  {scenePause}s
                </span>
              </div>
            )}
          </div>
          {enableScenePause && (
            <div style={{ fontSize: '9px', color: '#9CA3AF', marginTop: '2px' }}>
              💡 Scenes are detected by: <strong>Episode X:</strong>, <strong>Scene X:</strong>, <strong>Part X:</strong>, or paragraph breaks
            </div>
          )}
        </div>

        {/* Preview & Generate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '8px 12px', background: '#F9FAFB', borderRadius: '8px' }}>
          <button
            onClick={handleAudioPreview}
            disabled={isPreviewing || (!script.trim() && !uploadedAudioFile)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', 
              borderRadius: '20px', border: '1px solid #10B981', background: '#ECFDF5', 
              color: '#047857', cursor: 'pointer', fontSize: '12px', fontWeight: '600'
            }}
          >
            {isPreviewing ? <Loader2 size={12} className="animate-spin" /> : (isPlayingAudio ? <Pause size={12} /> : <Play size={12} />)}
            {uploadedAudioFile ? 'Play Uploaded Audio' : `5s ${language} Preview`}
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
          {selectedVoice && !uploadedAudioFile && (
            <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: 'auto' }}>
              Voice: {selectedVoice}
            </span>
          )}
          {uploadedAudioFile && (
            <span style={{ fontSize: '11px', color: '#10B981', marginLeft: 'auto' }}>
              ✅ Audio loaded
            </span>
          )}
        </div>

        {/* Generate Button - Hidden when audio is uploaded */}
        {!isAudioUploaded && (
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              backgroundColor: '#10B981',
              color: 'white', border: 'none',
              fontWeight: '600', fontSize: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px'
            }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isLoading ? 'Generating Audio & Subtitles...' : `Generate Package (${estimatedCredits} Credits)`}
          </button>
        )}

        {/* Audio Uploaded - Ready message when audio is uploaded */}
        {isAudioUploaded && (
          <div style={{
            marginBottom: '16px',
            padding: '10px 14px',
            backgroundColor: '#FEF3C7',
            borderRadius: '8px',
            border: '1px solid #FDE68A',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '12px', color: '#92400E', margin: 0 }}>
              ⚡ Audio uploaded. Use <strong>"Convert to Script"</strong> to transcribe, then edit and generate new audio.
            </p>
          </div>
        )}

        {/* Generation Status */}
        {generationError && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#FEF2F2',
            borderRadius: '8px',
            border: '1px solid #FCA5A5',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} color="#EF4444" />
            <span style={{ fontSize: '12px', color: '#991B1B' }}>{generationError}</span>
          </div>
        )}

        {generationSuccess && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#F0FDF4',
            borderRadius: '8px',
            border: '1px solid #86EFAC',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} color="#10B981" />
            <span style={{ fontSize: '12px', color: '#065F46' }}>
              ✅ Generation successful! Download your assets below.
              {audioDuration > 0 && ` Duration: ${formatDurationDisplay(audioDuration)}`}
            </span>
          </div>
        )}

        {/* Download Section */}
        {generatedMp3Base64 && (
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111827', display: 'block', marginBottom: '8px' }}>
              📥 Download Generated Assets:
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
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

              <button 
                onClick={() => setSurvey(prev => ({ ...prev, isOpen: true }))}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '4px', 
                  padding: '8px', 
                  borderRadius: '6px', 
                  border: 'none', 
                  background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)',
                  color: 'white', 
                  fontSize: '11px', 
                  cursor: 'pointer',
                  fontWeight: '500',
                  boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(147, 51, 234, 0.3)';
                }}
              >
                <span style={{ 
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#EF4444',
                  color: 'white',
                  fontSize: '7px',
                  fontWeight: 'bold',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  animation: 'pulse 2s infinite'
                }}>
                  NEW
                </span>
                <User size={12} /> Digital Twin
              </button>
            </div>
            
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

        {/* Uploaded Audio Info when no generation yet */}
        {isAudioUploaded && !generatedMp3Base64 && (
          <div style={{
            marginTop: '12px',
            padding: '12px 16px',
            backgroundColor: '#F0FDF4',
            borderRadius: '8px',
            border: '1px solid #86EFAC',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '12px', color: '#065F46', margin: 0 }}>
              ✅ Audio file uploaded: <strong>{uploadedAudioFile?.name}</strong>
              <br />
              <span style={{ fontSize: '11px', color: '#6B7280' }}>
                Click <strong>Play Uploaded Audio</strong> to listen, or <strong>Convert to Script</strong> to transcribe.
                {audioDuration > 0 && ` Duration: ${formatDurationDisplay(audioDuration)}`}
              </span>
            </p>
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};