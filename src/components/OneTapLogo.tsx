import React from 'react';

interface OneTapLogoProps {
  className?: string;
}

export const OneTapLogo: React.FC<OneTapLogoProps> = ({ 
  className = "w-9 h-9",
}) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer Ripple Ring */}
        <path
          d="M 32 38 A 28 28 0 1 1 88 38"
          stroke="#0066FF"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Inner Ripple Ring */}
        <path
          d="M 42 40 A 18 18 0 1 1 78 40"
          stroke="#0066FF"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Center Target Dot / Pulse */}
        <circle 
          cx="60" 
          cy="38" 
          r="4" 
          fill="#0066FF" 
        />

        {/* Precise Hand Tap Contour with rounded knuckles & wrist */}
        <path
          d="M 48 96
             C 38 88 32 80 32 74
             C 32 70 36 67 40 70
             C 45 74 49 79 51 79
             L 51 38
             C 51 33 55 30 60 30
             C 65 30 69 33 69 38
             L 69 58
             C 69 55 72 53 76 54
             C 80 55 82 58 82 62
             C 82 59 85 57 89 58
             C 93 59 95 63 94 67
             C 95 65 98 64 101 67
             C 103 70 102 75 100 80
             C 97 91 88 103 74 105
             C 60 107 51 100 48 96 Z"
          fill="#FFFFFF"
          stroke="#0A1931"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
