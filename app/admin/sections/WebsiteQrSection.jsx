'use client';

import { useMemo, useState } from 'react';
import { QrCode, Download, Printer, Copy, Check } from 'lucide-react';
import { encodeQrMatrix } from '../../lib/qr-encode';

const PRESET_URLS = [
  { label: 'Main Foundation Website', url: 'https://gsddfoundation.org/' },
  { label: 'Public Donate Page', url: 'https://gsddfoundation.org/donate/' },
  { label: 'Apply for Membership', url: 'https://gsddfoundation.org/membership/' },
  { label: 'Verify Document / Certificate', url: 'https://gsddfoundation.org/verify/' },
  { label: 'Activity Posts & Events', url: 'https://gsddfoundation.org/activity-post/' },
];

export default function WebsiteQrSection({ notify }) {
  const [targetUrl, setTargetUrl] = useState(PRESET_URLS[0].url);
  const [labelText, setLabelText] = useState('Scan to Visit GSDD Foundation Official Website');
  const [fgColor, setFgColor] = useState('#09152f');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [copied, setCopied] = useState(false);

  const qrResult = useMemo(() => {
    try {
      const value = targetUrl.trim() || 'https://gsddfoundation.org/';
      return { ok: true, ...encodeQrMatrix(value), value };
    } catch (err) {
      return { ok: false, error: err?.message || 'URL exceeds supported QR capacity.' };
    }
  }, [targetUrl]);

  const svgMarkup = useMemo(() => {
    if (!qrResult.ok) return '';
    const quiet = 4;
    const total = qrResult.size + quiet * 2;
    const rects = [];
    qrResult.modules.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          rects.push(`<rect x="${c + quiet}" y="${r + quiet}" width="1" height="1" fill="${fgColor}" />`);
        }
      });
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="320" height="320" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="${bgColor}" />${rects.join('')}</svg>`;
  }, [qrResult, fgColor, bgColor]);

  const handleDownloadSvg = () => {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gsdd-website-qr.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify?.('Website QR downloaded as SVG.');
  };

  const handleDownloadPng = () => {
    if (!qrResult.ok) return;
    const quiet = 4;
    const scale = 12;
    const totalPx = (qrResult.size + quiet * 2) * scale;
    const canvas = document.createElement('canvas');
    canvas.width = totalPx;
    canvas.height = totalPx;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, totalPx, totalPx);
    ctx.fillStyle = fgColor;
    qrResult.modules.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
        }
      });
    });

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'gsdd-website-qr.png';
    a.click();
    notify?.('Website QR downloaded as high-resolution PNG.');
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      notify?.('URL copied to clipboard.');
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div>
      <div className="admin-section-header no-print">
        <div>
          <h1>Website QR Generator</h1>
          <p>Generate high-contrast ISO/IEC 18004 scannable QR codes for any public portal link.</p>
        </div>
      </div>

      <div className="overview-analytics-grid">
        <div className="admin-card no-print" style={{ padding: 22 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 16 }}>QR Payload &amp; Customization</h2>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Quick Route Presets
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_URLS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  className={targetUrl === preset.url ? 'admin-btn-primary' : 'admin-btn-ghost'}
                  style={{ fontSize: 12, padding: '6px 10px' }}
                  onClick={() => setTargetUrl(preset.url)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Target URL or Text
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="url"
                className="admin-input"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://gsddfoundation.org/donate/"
              />
              <button type="button" className="admin-btn-ghost" onClick={handleCopyUrl}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Poster Caption
            </label>
            <input
              type="text"
              className="admin-input"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Foreground Color
              </label>
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                style={{ width: '100%', height: 38, borderRadius: 8, cursor: 'pointer' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Background Color
              </label>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                style={{ width: '100%', height: 38, borderRadius: 8, cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button
              type="button"
              className="admin-btn-primary"
              disabled={!qrResult.ok}
              onClick={handleDownloadPng}
            >
              <Download size={14} /> Download PNG
            </button>
            <button
              type="button"
              className="admin-btn-ghost"
              disabled={!qrResult.ok}
              onClick={handleDownloadSvg}
            >
              <QrCode size={14} /> Download SVG
            </button>
            <button
              type="button"
              className="admin-btn-ghost"
              disabled={!qrResult.ok}
              onClick={() => window.print()}
            >
              <Printer size={14} /> Print QR Poster
            </button>
          </div>
        </div>

        <div
          className="admin-card letterhead-paper"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 28,
          }}
        >
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 800, color: '#1e3a8a' }}>
            GLOBAL SKILLS &amp; DIGITAL DEVELOPMENT FOUNDATION
          </p>
          <h3 style={{ margin: '0 0 18px', fontSize: 16 }}>{labelText}</h3>

          {qrResult.ok ? (
            <div
              style={{
                padding: 16,
                background: bgColor,
                border: '1px solid #cbd5e1',
                borderRadius: 14,
              }}
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
          ) : (
            <p style={{ color: '#dc2626', fontSize: 13 }}>{qrResult.error}</p>
          )}

          <p
            style={{
              margin: '16px 0 0',
              fontSize: 12,
              color: '#475569',
              wordBreak: 'break-all',
            }}
          >
            {targetUrl}
          </p>
        </div>
      </div>
    </div>
  );
}
