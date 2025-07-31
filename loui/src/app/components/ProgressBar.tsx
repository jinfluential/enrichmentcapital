'use client';

import React from 'react';

interface ProgressBarProps {
  progress: number;
  currentSymbol: string;
}

export default function ProgressBar({ progress, currentSymbol }: ProgressBarProps) {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">
          {currentSymbol ? `Analyzing ${currentSymbol}...` : 'Preparing search...'}
        </span>
        <span className="text-green-400">{Math.round(progress)}%</span>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className="bg-green-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
