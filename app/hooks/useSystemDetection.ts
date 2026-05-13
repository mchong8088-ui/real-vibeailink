// hooks/useSystemDetection.ts
import { useState, useEffect } from 'react';

export function useSystemDetection() {
  const [env, setEnv] = useState({
    os: 'Detecting...',
    isMobile: false,
    engine: 'Local Synthesis'
  });

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua) || window.innerWidth < 1024;
    
    let osName = "Standard OS";
    if (ua.indexOf("Win") !== -1) osName = "Windows";
    if (ua.indexOf("Mac") !== -1) osName = "MacOS";
    if (ua.indexOf("Linux") !== -1) osName = "Linux";
    
    setEnv({ os: osName, isMobile, engine: 'Local Synthesis' });
  }, []);

  return env;
}