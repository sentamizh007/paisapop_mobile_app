import React from 'react';

interface ShakeDetectorProps {
  children: React.ReactNode;
}

export const ShakeDetector: React.FC<ShakeDetectorProps> = ({ children }) => {
  return <>{children}</>;
};
