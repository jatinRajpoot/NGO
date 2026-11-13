'use client';

import { useMemo } from 'react';
import { encodeQrMatrix } from '../../../lib/qr-encode';

/**
 * Pure ISO-18004 offline SVG QR code renderer for Admin certificates,
 * appointment letters, and verification badges.
 * Renders crisp SVG modules directly without third-party network dependencies.
 */
export default function QRCodeVisual({ value, size = 80, label = 'Scan to verify', fg = '#0F172A', bg = '#FFFFFF' }) {
  const qr = useMemo(() => {
    try {
      const text = (value || '').trim() || 'https://gsddfoundation.org/verify/';
      return encodeQrMatrix(text);
    } catch {
      return null;
    }
  }, [value]);

  const quietZone = 2;
  const viewSize = qr ? qr.size + quietZone * 2 : 24;

  const pathD = useMemo(() => {
    if (!qr) return '';
    const parts = [];
    for (let r = 0; r < qr.size; r += 1) {
      for (let c = 0; c < qr.size; c += 1) {
        if (qr.modules[r][c]) {
          parts.push(`M${c + quietZone},${r + quietZone}h1v1h-1z`);
        }
      }
    }
    return parts.join('');
  }, [qr]);

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '6px',
        background: bg,
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}
      title={value}
    >
      {qr ? (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${viewSize} ${viewSize}`}
          role="img"
          aria-label={label ? `${label}: ${value}` : `QR code for ${value}`}
          shapeRendering="crispEdges"
          style={{ display: 'block', borderRadius: '4px' }}
        >
          <rect width={viewSize} height={viewSize} fill={bg} />
          <path d={pathD} fill={fg} />
        </svg>
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={fg}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="5" height="5" x="3" y="3" rx="1" fill={fg} />
          <rect width="5" height="5" x="16" y="3" rx="1" fill={fg} />
          <rect width="5" height="5" x="3" y="16" rx="1" fill={fg} />
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
