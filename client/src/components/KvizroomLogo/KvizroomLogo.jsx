import React from 'react';

/**
 * KvizroomLogo — inline SVG logo
 * variant: 'light' (white text, for dark backgrounds like Navbar/Hero)
 *          'dark'  (dark text, for light backgrounds like Footer on white)
 * size: number, controls the icon box height in px (default 36)
 */
const KvizroomLogo = ({ variant = 'light', size = 36 }) => {
  const isDark = variant === 'dark';
  const textColor = isDark ? '#0f172a' : '#ffffff';
  const accentColor = '#818cf8'; // soft indigo/violet accent for "room"

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
      {/* SVG Icon Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Kvizroom icon"
      >
        {/* Background rounded square */}
        <rect width="40" height="40" rx="10" fill="url(#kviz-grad)" />

        {/* Mortarboard cap shape */}
        <polygon points="20,9 34,16 20,23 6,16" fill="white" opacity="0.95" />

        {/* Hanging tassel / beam line */}
        <rect x="19" y="23" width="2" height="7" rx="1" fill="white" opacity="0.7" />
        <circle cx="20" cy="31" r="2" fill="#fbbf24" />

        {/* Left arm of diploma ribbon */}
        <path d="M6 16 L6 23 Q6 25 8 26 L12 28" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.75" />

        {/* Checkmark badge bottom-right */}
        <circle cx="31" cy="30" r="6" fill="#10b981" />
        <path d="M28 30 L30.2 32.4 L34 28" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        <defs>
          <linearGradient id="kviz-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>

      {/* Wordmark */}
      <span style={{
        fontFamily: 'var(--font-main)',
        fontSize: `${size * 0.48}px`,
        lineHeight: 1,
        letterSpacing: '-0.04em',
        fontWeight: 800,
      }}>
        <span style={{ color: textColor }}>Kviz</span>
        <span style={{ color: accentColor }}>room</span>
      </span>
    </span>
  );
};

export default KvizroomLogo;
