"use client";
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    setMessage('Page loaded successfully!');
    console.log('Page mounted');
  }, []);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>vibeAiLink</h1>
      <p>{message}</p>
      <p>If you see this, the basic page is working.</p>
    </div>
  );
}
