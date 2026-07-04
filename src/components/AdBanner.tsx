'use client';

import React, { useEffect } from 'react';

interface AdBannerProps {
  slotId?: string;
  format?: 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

export default function AdBanner({ slotId, format = 'horizontal', className = '' }: AdBannerProps) {
  const adSenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  
  // Define dimensions based on format for the placeholder
  let width = '100%';
  let height = '90px'; // default horizontal
  let label = 'Horizontal Banner [728x90]';

  if (format === 'vertical') {
    width = '300px';
    height = '600px';
    label = 'Vertical Banner [300x600]';
  } else if (format === 'rectangle') {
    width = '300px';
    height = '250px';
    label = 'Rectangle Ad [300x250]';
  }

  // If there is no AdSense ID, render the beautiful placeholder
  if (!adSenseId) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 overflow-hidden ${className}`}
        style={{ width, height: format === 'horizontal' ? 'auto' : height, minHeight: height }}
      >
        <span className="text-xs font-bold uppercase tracking-wider mb-1">AdSense Placement</span>
        <span className="text-[10px] font-medium">{label}</span>
      </div>
    );
  }

  // Once AdSense ID is set, this code will run and render real ads
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adSenseId}
        data-ad-slot={slotId || "1234567890"}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
