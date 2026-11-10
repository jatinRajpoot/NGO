'use client';

import { useMemo } from 'react';
import { encodeQrMatrix } from '../lib/qr-encode';

/**
 * Renders a genuine, scannable ISO-18004 QR Code SVG directly from `value`
 * without relying on third-party image APIs or placeholder icons.
 */
export default function QRCodeSvg({ value, size = 140, label = 'Scan QR Code', fg = '#0F172A', bg = '#FFFFFF' }) {
  const qr = useMemo(() => {
    try {
      return encodeQrMatrix(value || 'https://gsddfoundation.org/');
    } catch {
      return null;
    }
  }, [value]);

  if (!qr) {
    return null;
  }

  const quietZone = 2;
  const viewSize = qr.size + quietZone * 2;
  const pathParts = [];

  for (let r = 0; r < qr.size; r += 1) {
    for (let c = 0; c < qr.size; c += 1) {
      if (qr.modules[r][c]) {
        pathParts.push(`M${c + quietZone},${r + quietZone}h1v1h-1z`);
      }
    }
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        role="img"
        aria-label={label ? `${label}: ${value}` : `QR code for ${value}`}
        shapeRendering="crispEdges"
        style={{
          display: 'block',
          background: bg,
          borderRadius: '6px',
          border: '1px solid #E2E8F0',
        }}
      >
        <rect width={viewSize} height={viewSize} fill={bg} />
        <path d={pathParts.join('')} fill={fg} />
      </svg>
      {label && (
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569', letterSpacing: '0.03em' }}>
          {label}
        </span>
      )}
    </div>
  );
}
