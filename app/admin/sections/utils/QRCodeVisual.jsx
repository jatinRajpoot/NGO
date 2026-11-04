'use client';

import { useState } from 'react';
import { QrCode } from 'lucide-react';

export default function QRCodeVisual({ value, size = 80, label = 'Scan to verify' }) {
  const [hasError, setHasError] = useState(false);
  const encoded = encodeURIComponent(value || '');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encoded}&margin=2`;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '6px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}
      title={value}
    >
      {!hasError ? (
        <img
          src={qrUrl}
          alt={`QR Code for ${value}`}
          width={size}
          height={size}
          style={{ display: 'block', borderRadius: '4px' }}
          onError={() => setHasError(true)}
        />
      ) : (
        /* Fallback SVG QR pattern */
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1e293b"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="5" height="5" x="3" y="3" rx="1" fill="#1e293b" />
          <rect width="5" height="5" x="16" y="3" rx="1" fill="#1e293b" />
          <rect width="5" height="5" x="3" y="16" rx="1" fill="#1e293b" />
          <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
          <path d="M21 21v.01" />
          <path d="M12 7v3a2 2 0 0 1-2 2H7" />
          <path d="M3 12h.01" />
          <path d="M12 3h.01" />
          <path d="M12 16v.01" />
          <path d="M16 12h1" />
          <path d="M21 12v.01" />
          <path d="M12 21v-1" />
        </svg>
      )}
      {label && (
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: '#64748b',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
