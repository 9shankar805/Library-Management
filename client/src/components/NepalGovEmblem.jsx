import React from "react";

/**
 * Official Emblem of Nepal (नेपालको निसान छाप) SVG
 * Designed for government headers (klib.gov.np standard)
 */
export const NepalGovEmblem = ({ width = 64, height = 64, className = "" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Emblem of Nepal (नेपाल सरकारको निशान छाप)"
    >
      <defs>
        <radialGradient id="skyGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#87ceeb" />
          <stop offset="60%" stopColor="#4a90e2" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </radialGradient>
        <linearGradient id="mountGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="crimsonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b91c1c" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
      </defs>

      {/* Rhododendron Floral Wreath Outer Ring */}
      <g stroke="#dc2626" strokeWidth="6" fill="none">
        <circle cx="100" cy="95" r="78" stroke="#16a34a" strokeWidth="7" />
        <circle cx="100" cy="95" r="74" stroke="#dc2626" strokeWidth="4" strokeDasharray="6,4" />
      </g>

      {/* Sky Background */}
      <circle cx="100" cy="95" r="68" fill="url(#skyGrad)" />

      {/* Mount Everest Peaks */}
      <polygon points="100,42 125,95 75,95" fill="url(#mountGrad)" />
      <polygon points="68,58 92,95 44,95" fill="#f8fafc" opacity="0.9" />
      <polygon points="132,60 156,95 108,95" fill="#f8fafc" opacity="0.9" />
      {/* Mountain shading */}
      <polygon points="100,42 100,95 75,95" fill="#cbd5e1" opacity="0.4" />

      {/* Green Hills & Terai Base */}
      <ellipse cx="100" cy="115" rx="66" ry="32" fill="#15803d" />
      <ellipse cx="100" cy="122" rx="60" ry="22" fill="#84cc16" opacity="0.7" />

      {/* Clasped Hands of National Unity */}
      <g transform="translate(100, 116) scale(0.7)">
        <ellipse cx="-16" cy="0" rx="14" ry="7" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />
        <ellipse cx="16" cy="0" rx="14" ry="7" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="5" fill="#f97316" />
      </g>

      {/* Sun & Moon (National Symbols) */}
      <circle cx="62" cy="74" r="9" fill="url(#goldGrad)" />
      {/* 12 rays around sun */}
      <g stroke="#f59e0b" strokeWidth="1.5">
        <line x1="62" y1="62" x2="62" y2="60" />
        <line x1="62" y1="86" x2="62" y2="88" />
        <line x1="50" y1="74" x2="48" y2="74" />
        <line x1="74" y1="74" x2="76" y2="74" />
      </g>

      {/* Crescent Moon */}
      <circle cx="138" cy="74" r="8" fill="url(#goldGrad)" />
      <circle cx="141" cy="72" r="7" fill="url(#skyGrad)" />

      {/* National Motto Ribbon at Bottom */}
      <g transform="translate(0, 5)">
        <path
          d="M 28 160 Q 100 176 172 160 L 168 180 Q 100 194 32 180 Z"
          fill="url(#crimsonGrad)"
          stroke="#7f1d1d"
          strokeWidth="1.5"
        />
        <text
          x="100"
          y="173"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="Mukta, sans-serif"
        >
          जननी जन्मभूमिश्च स्वर्गादपि गरीयसी
        </text>
      </g>
    </svg>
  );
};

/**
 * National Flag of Nepal (नेपालको राष्ट्रिय झण्डा) SVG
 */
export const NepalFlag = ({ width = 32, height = 40, className = "" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 125"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="National Flag of Nepal"
    >
      <defs>
        <filter id="flagShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>
      {/* Double Pennant Blue Border */}
      <polygon
        points="4,4 96,48 44,48 96,108 4,108"
        fill="#003893"
        filter="url(#flagShadow)"
      />
      {/* Crimson Interior */}
      <polygon
        points="10,12 84,46 38,46 84,98 10,98"
        fill="#DC143C"
      />
      {/* Moon Symbol (Upper Pennant) */}
      <circle cx="30" cy="30" r="9" fill="#ffffff" />
      <circle cx="30" cy="27" r="8" fill="#DC143C" />
      <polygon points="30,28 32,34 28,34" fill="#ffffff" />

      {/* Sun Symbol (Lower Pennant) */}
      <circle cx="32" cy="74" r="10" fill="#ffffff" />
      <g stroke="#ffffff" strokeWidth="2">
        <line x1="32" y1="60" x2="32" y2="88" />
        <line x1="18" y1="74" x2="46" y2="74" />
        <line x1="22" y1="64" x2="42" y2="84" />
        <line x1="22" y1="84" x2="42" y2="64" />
      </g>
    </svg>
  );
};

export default NepalGovEmblem;
