"use client";
import React, { useRef, ChangeEvent } from 'react';

interface MediaCaptureProps {
  onFileCaptured: (file: File) => void;
  mode: 'camera' | 'file';
}

export function MediaCapture({ onFileCaptured, mode }: MediaCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // This function is called by your [+] menu buttons
  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileCaptured(file);
      // Reset value so the same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  return (
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileChange}
      className="hidden" // Keep it invisible
      accept="image/*,.pdf" // Allows photos and friend-sent PDFs
      // The magic attribute: environment = rear camera on mobile
      capture={mode === 'camera' ? 'environment' : undefined}
    />
  );
}