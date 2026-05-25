// components/features/controls/SourceMenu.tsx
import React, { useState, useRef, useEffect } from 'react';

export interface SourceMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSource: (source: string, data?: any) => void;
  langKey: string;
}

export const SourceMenu: React.FC<SourceMenuProps> = ({
  isOpen,
  onClose,
  onSelectSource,
  langKey,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    os: 'unknown',
    browser: 'unknown'
  });
  
  // Camera states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraFileInputRef = useRef<HTMLInputElement>(null);

  // Detect device capabilities
  useEffect(() => {
    const ua = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
    let os = 'unknown';
    let browser = 'unknown';
    
    if (ua.includes('Win')) os = 'windows';
    else if (ua.includes('Mac')) os = 'mac';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'ios';
    else if (ua.includes('Android')) os = 'android';
    else if (ua.includes('Linux')) os = 'linux';
    
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'safari';
    else if (ua.includes('Firefox')) browser = 'firefox';
    else if (ua.includes('Edg')) browser = 'edge';
    
    setDeviceInfo({ isMobile, os, browser });
  }, []);

  if (!isOpen) return null;

  const sources = [
    {
      id: 'link',
      title: langKey === 'en' ? 'Analyze News Link' : '分析新聞連結',
      subtitle: 'Paste links from Motley Fool, CNBC, etc.',
      icon: '🔗',
      hasInput: true,
    },
    {
      id: 'camera',
      title: langKey === 'en' ? 'Camera or Upload' : '拍照或上傳文件',
      subtitle: 'Scan physical reports or screens',
      icon: '📷',
      hasInput: false,
    },
    {
      id: 'file',
      title: langKey === 'en' ? 'Upload Data File' : '上傳數據文件',
      subtitle: 'PDF, CSV, or Technical Sheets',
      icon: '📁',
      hasInput: false,
    },
  ];

  // File upload handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
    }
  };

  const handleFileConfirm = async () => {
    if (!selectedFile) return;
    
    setShowFileUpload(false);
    setSelectedFile(null);
    setSelectedFileName(null);
    
    // Process file based on type
    if (selectedFile.type.startsWith('image/')) {
      // Convert image to base64 for preview
      const reader = new FileReader();
      reader.onload = async (e) => {
        onSelectSource('file_image', {
          name: selectedFile.name,
          data: e.target?.result,
          type: selectedFile.type
        });
      };
      reader.readAsDataURL(selectedFile);
    } else {
      // For PDF, CSV, etc.
      onSelectSource('file_document', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });
    }
    onClose();
  };

  // Camera handlers - Cross-platform
  const startCamera = async () => {
    setShowCamera(true);
    
    // For mobile devices, use file input with capture attribute
    if (deviceInfo.isMobile) {
      // Mobile: Use file input with camera capture
      if (cameraFileInputRef.current) {
        cameraFileInputRef.current.click();
      }
      return;
    }
    
    // Desktop: Use getUserMedia
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      // Fallback to file input
      if (cameraFileInputRef.current) {
        cameraFileInputRef.current.click();
      }
    }
  };

  const handleCameraFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
        setShowCamera(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      setCapturedImage(imageData);
      
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const handlePhotoConfirm = () => {
    if (capturedImage) {
      onSelectSource('camera_photo', capturedImage);
      setCapturedImage(null);
      setShowCamera(false);
      onClose();
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setShowCamera(false);
  };

  const handleSourceClick = (source: any) => {
    if (source.hasInput && source.id === 'link') {
      setShowUrlInput(true);
    } else if (source.id === 'file') {
      setShowFileUpload(true);
    } else if (source.id === 'camera') {
      startCamera();
    } else {
      onSelectSource(source.id);
      onClose();
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onSelectSource('url', urlInput.trim());
      setShowUrlInput(false);
      setUrlInput('');
      onClose();
    }
  };

  // File Upload Modal
  const FileUploadModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '350px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
            {langKey === 'en' ? 'Upload File' : '上傳文件'}
          </h3>
        </div>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".txt,.pdf,.doc,.docx,.jpg,.png,.csv"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '40px',
              border: '2px dashed #E5E7EB',
              borderRadius: '12px',
              backgroundColor: '#F9FAFB',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '32px' }}>📄</span>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              {langKey === 'en' ? 'Click to select file' : '點擊選擇文件'}
            </span>
          </button>
          {selectedFileName && (
            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
              <span style={{ fontSize: '12px' }}>{langKey === 'en' ? 'Selected: ' : '已選擇： '}{selectedFileName}</span>
            </div>
          )}
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              setShowFileUpload(false);
              setSelectedFile(null);
              setSelectedFileName(null);
            }}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: 'white', cursor: 'pointer' }}
          >
            {langKey === 'en' ? 'Return' : '返回'}
          </button>
          <button
            onClick={handleFileConfirm}
            disabled={!selectedFile}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: selectedFile ? '#22C55E' : '#D1D5DB', color: 'white', cursor: selectedFile ? 'pointer' : 'not-allowed' }}
          >
            {langKey === 'en' ? 'Continue' : '繼續'}
          </button>
        </div>
      </div>
    </div>
  );

  // Camera Modal - Cross-platform
  const CameraModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: deviceInfo.isMobile ? '0' : '20px'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: deviceInfo.isMobile ? '0' : '16px', 
        width: deviceInfo.isMobile ? '100%' : '90%', 
        maxWidth: deviceInfo.isMobile ? '100%' : '500px', 
        height: deviceInfo.isMobile ? '100%' : 'auto',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
            {langKey === 'en' ? 'Take Photo' : '拍照'}
          </h3>
          <button onClick={closeCamera} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        
        <div style={{ padding: '16px', textAlign: 'center', flex: 1 }}>
          {!capturedImage ? (
            <>
              {!deviceInfo.isMobile && stream && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', borderRadius: '8px', backgroundColor: '#000' }}
                />
              )}
              {(deviceInfo.isMobile || !stream) && (
                <input
                  ref={cameraFileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraFileSelect}
                  style={{ display: 'none' }}
                />
              )}
              {!deviceInfo.isMobile && !stream && (
                <button
                  onClick={startCamera}
                  style={{ padding: '12px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }}
                >
                  {langKey === 'en' ? 'Start Camera' : '開啟相機'}
                </button>
              )}
              {deviceInfo.isMobile && (
                <button
                  onClick={() => cameraFileInputRef.current?.click()}
                  style={{ padding: '40px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontSize: '16px' }}
                >
                  📷 {langKey === 'en' ? 'Take Photo' : '拍照'}
                </button>
              )}
              {stream && (
                <button
                  onClick={capturePhoto}
                  style={{ marginTop: '12px', padding: '12px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }}
                >
                  {langKey === 'en' ? 'Capture' : '拍攝'}
                </button>
              )}
            </>
          ) : (
            <>
              <img src={capturedImage} alt="Captured" style={{ width: '100%', borderRadius: '8px' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </>
          )}
        </div>
        
        {capturedImage && (
          <div style={{ padding: '16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                setCapturedImage(null);
                if (!deviceInfo.isMobile) startCamera();
              }}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: 'white', cursor: 'pointer' }}
            >
              {langKey === 'en' ? 'Retake' : '重拍'}
            </button>
            <button
              onClick={handlePhotoConfirm}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#22C55E', color: 'white', cursor: 'pointer' }}
            >
              {langKey === 'en' ? 'Continue' : '繼續'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // URL Input Modal
  const UrlInputModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '350px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
            {langKey === 'en' ? 'Enter URL' : '輸入網址'}
          </h3>
        </div>
        <div style={{ padding: '16px' }}>
          <textarea
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/news"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              minHeight: '100px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              setShowUrlInput(false);
              setUrlInput('');
            }}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: 'white', cursor: 'pointer' }}
          >
            {langKey === 'en' ? 'Return' : '返回'}
          </button>
          <button
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: urlInput.trim() ? '#22C55E' : '#D1D5DB', color: 'white', cursor: urlInput.trim() ? 'pointer' : 'not-allowed' }}
          >
            {langKey === 'en' ? 'Continue' : '繼續'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Main Source Menu */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '400px',
          padding: '20px',
          position: 'relative',
          border: '1px solid #E5E7EB',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
              {langKey === 'en' ? 'Add Analysis Source' : '新增分析來源'}
            </h3>
          </div>

          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', border: 'none', background: 'none' }}>✕</button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sources.map((source) => (
              <button
                key={source.id}
                onClick={() => handleSourceClick(source)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '14px',
                  backgroundColor: '#FEF08A', borderRadius: '14px', cursor: 'pointer', textAlign: 'left', border: '1px solid #E5E7EB'
                }}
              >
                <span style={{ fontSize: '24px' }}>{source.icon}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{source.title}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{source.subtitle}</div>
                </div>
              </button>
            ))}
            <button onClick={onClose} style={{ width: '100%', padding: '12px', backgroundColor: '#22C55E', color: 'white', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
              {langKey === 'en' ? 'RETURN' : '返回'}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      {showUrlInput && <UrlInputModal />}
      {showFileUpload && <FileUploadModal />}
      {showCamera && <CameraModal />}
    </>
  );
};