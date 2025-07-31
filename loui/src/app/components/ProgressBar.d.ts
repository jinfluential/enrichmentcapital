import React from 'react';

interface ProgressBarProps {
  progress: number;
  currentSymbol?: string;
}

declare const ProgressBar: React.FC<ProgressBarProps>;
export default ProgressBar;
