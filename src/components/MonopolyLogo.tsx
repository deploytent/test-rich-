import React from 'react';

interface MonopolyLogoProps {
  compact?: boolean;
  className?: string;
}

/**
 * Bold Monopoly GO!-inspired 3D cartoon title SVG:
 * Golden-yellow gradient text, thick dark outline (paint-order: stroke fill), and chunky 3D shadow.
 */
export const MonopolyLogo: React.FC<MonopolyLogoProps> = ({
  compact = false,
  className = '',
}) => {
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg viewBox="0 0 38 38" className="h-8 w-8 shrink-0 drop-shadow-sm" aria-hidden="true">
          <rect x="2" y="2" width="34" height="34" rx="10" fill="#FFFDF7" stroke="#F59E0B" strokeWidth="2.5" />
          <rect x="7" y="20" width="6" height="10" rx="2" fill="#65C438" />
          <rect x="16" y="13" width="6" height="17" rx="2" fill="#F59E0B" />
          <rect x="25" y="8" width="6" height="22" rx="2" fill="#38BDF8" />
          <circle cx="28" cy="8" r="3" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="1.2" />
        </svg>
        <svg viewBox="0 0 280 42" className="h-7 sm:h-8 w-auto" role="img" aria-label="Data Tycoon: สถิติพิชิตเศรษฐี">
          <defs>
            <linearGradient id="logoGoldCompact" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFF078" />
              <stop offset="55%" stopColor="#FFC82C" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <text
            x="2"
            y="24"
            fontFamily="Prompt, sans-serif"
            fontSize="21"
            fontWeight="900"
            fill="#2D1B00"
            stroke="#2D1B00"
            strokeWidth="5"
            strokeLinejoin="round"
            style={{ paintOrder: 'stroke fill' }}
            transform="translate(0, 2.5)"
          >
            DATA TYCOON
          </text>
          <text
            x="2"
            y="24"
            fontFamily="Prompt, sans-serif"
            fontSize="21"
            fontWeight="900"
            fill="url(#logoGoldCompact)"
            stroke="#2D1B00"
            strokeWidth="5"
            strokeLinejoin="round"
            style={{ paintOrder: 'stroke fill' }}
          >
            DATA TYCOON
          </text>
          <rect x="2" y="28" width="142" height="13" rx="6.5" fill="#E11D48" stroke="#FFFFFF" strokeWidth="1.5" />
          <text
            x="73"
            y="38"
            textAnchor="middle"
            fontFamily="Prompt, sans-serif"
            fontSize="9.5"
            fontWeight="800"
            fill="#FFFFFF"
          >
            สถิติพิชิตเศรษฐี
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className={`select-none ${className}`}>
      <svg
        viewBox="0 0 420 118"
        className="w-full max-w-[380px] h-auto drop-shadow-[0_6px_8px_rgba(30,20,0,0.22)]"
        role="img"
        aria-label="Data Tycoon: สถิติพิชิตเศรษฐี"
      >
        <defs>
          <linearGradient id="logoGoldHero" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF799" />
            <stop offset="45%" stopColor="#FFD23F" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="ribbonRedHero" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E11D48" />
            <stop offset="50%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>
        </defs>

        {/* Decorative mini sparkles */}
        <path d="M26 24 L29 16 L32 24 L40 27 L32 30 L29 38 L26 30 L18 27 Z" fill="#FFF799" />
        <path d="M388 18 L390 12 L392 18 L398 20 L392 22 L390 28 L388 22 L382 20 Z" fill="#FFF799" />

        {/* 3D chunky drop shadow layer */}
        <text
          x="210"
          y="58"
          textAnchor="middle"
          fontFamily="Prompt, sans-serif"
          fontSize="48"
          fontWeight="900"
          letterSpacing="1"
          fill="#2D1B00"
          stroke="#2D1B00"
          strokeWidth="12"
          strokeLinejoin="round"
          style={{ paintOrder: 'stroke fill' }}
          transform="translate(0, 6)"
        >
          DATA TYCOON
        </text>

        {/* White rim highlight layer */}
        <text
          x="210"
          y="58"
          textAnchor="middle"
          fontFamily="Prompt, sans-serif"
          fontSize="48"
          fontWeight="900"
          letterSpacing="1"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="14"
          strokeLinejoin="round"
          style={{ paintOrder: 'stroke fill' }}
          transform="translate(0, -1)"
        >
          DATA TYCOON
        </text>

        {/* Main Golden Yellow Cartoon Text with thick dark border */}
        <text
          x="210"
          y="58"
          textAnchor="middle"
          fontFamily="Prompt, sans-serif"
          fontSize="48"
          fontWeight="900"
          letterSpacing="1"
          fill="url(#logoGoldHero)"
          stroke="#2D1B00"
          strokeWidth="9"
          strokeLinejoin="round"
          style={{ paintOrder: 'stroke fill' }}
        >
          DATA TYCOON
        </text>

        {/* Red & White Ribbon Subtitle */}
        <g transform="translate(86, 70)">
          <rect
            x="0"
            y="4"
            width="248"
            height="36"
            rx="18"
            fill="#9F1239"
          />
          <rect
            x="0"
            y="0"
            width="248"
            height="35"
            rx="17.5"
            fill="url(#ribbonRedHero)"
            stroke="#FFFFFF"
            strokeWidth="3"
          />
          <text
            x="124"
            y="24"
            textAnchor="middle"
            fontFamily="Prompt, sans-serif"
            fontSize="19"
            fontWeight="900"
            fill="#FFFFFF"
            stroke="#7F1D1D"
            strokeWidth="3"
            strokeLinejoin="round"
            style={{ paintOrder: 'stroke fill' }}
          >
            สถิติพิชิตเศรษฐี
          </text>
        </g>
      </svg>
    </div>
  );
};

export const BanknoteStackIcon: React.FC<{ className?: string }> = ({
  className = 'h-5 w-5',
}) => (
  <svg viewBox="0 0 36 28" className={className} aria-hidden="true">
    {/* Bottom stack layer */}
    <rect x="3" y="9" width="30" height="16" rx="3.5" fill="#15803D" />
    <rect x="3" y="6" width="30" height="16" rx="3.5" fill="#22C55E" />
    {/* Top banknote */}
    <rect x="3" y="3" width="30" height="16" rx="3.5" fill="#86EFAC" stroke="#16A34A" strokeWidth="1.5" />
    <rect x="6" y="5.5" width="24" height="11" rx="2" fill="#4ADE80" />
    <circle cx="18" cy="11" r="4" fill="#FEF08A" stroke="#15803D" strokeWidth="1" />
    <text x="18" y="13.5" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#14532D">
      ฿
    </text>
  </svg>
);
