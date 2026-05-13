// hooks/useSystemRoutine.ts
import { useState, useEffect } from 'react';

export function useSystemRoutine() {
  const [device, setDevice] = useState({ os: "Detecting...", isMobile: false });

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua) || window.innerWidth < 1024;
    let os = "Standard OS";
    if (ua.indexOf("Win") !== -1) os = "Windows";
    if (ua.indexOf("Mac") !== -1) os = "MacOS";
    
    setDevice({ os, isMobile });
  }, []);

  return device;
}