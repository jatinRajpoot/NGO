'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Quote, Code2,
  Heading1, Heading2, ListOrdered, List, Link2, Image as ImageIcon,
  Video, Eraser
} from 'lucide-react';

function normalizeEmbedUrl(raw) {
  const input = String(raw || '').trim();
  if (!input) return '';
  try {
    const u = new URL(input);
    if (u.protocol !== 'https:') return '';
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return input;
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${encodeURIComponent(v)}`;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\/+/, '');
      if (id) return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.replace(/^\/+/, '').split('/')[0];
      if (/^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    return '';
  } catch {
    return '';
  }
}

export default function RichTextEditor({ value = '', onChange, placeholder = 'Write rich formatted post description...' }) {
  const editorRef = useRef(null);
  const [promptMode, setPromptMode] = useState(null); // 'link' | 'image' | 'video'
  const [promptUrl, setPromptUrl] = useState('');
  const [promptError, setPromptError] = useState('');

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const emitChange = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (cmd, arg = null) => {
    editorRef.current?.focus();
    try {
      document.execCommand(cmd, false, arg);
    } catch {}
    emitChange();
  };

  const toggleBlock = (tagName) => {
    editorRef.current?.focus();
    try {
      document.execCommand('formatBlock', false, `<${tagName}>`);
    } catch {}
    emitChange();
  };

  const insertCodeBlock = () => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    const text = sel?.toString()?.trim() || 'Code snippet';
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    try {
      document.execCommand('insertHTML', false, `<pre><code>${escaped}</code></pre><p><br></p>`);
    } catch {}
    emitChange();
  };

  const handleInsertMedia = (e) => {
    e.preventDefault();
    setPromptError('');
    const url = promptUrl.trim();
    if (!url) {
      setPromptError('Please enter a valid HTTPS URL.');
      return;
    }

    if (promptMode === 'link') {
      if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
        setPromptError('Link must start with https://, http://, or /');
        return;
      }
      exec('createLink', url);
    } else if (promptMode === 'image') {
      if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
        setPromptError('Image URL must start with https://, http://, or /');
        return;
      }
      exec('insertImage', url);
    } else if (promptMode === 'video') {
      const embedUrl = normalizeEmbedUrl(url);
      if (!embedUrl) {
        setPromptError('Please enter a valid https:// YouTube or Vimeo link.');
        return;
      }
      editorRef.current?.focus();
      try {
        document.execCommand(
          'insertHTML',
          false,
          `<p><iframe src="${embedUrl}" title="Embedded video" allowfullscreen></iframe></p><p><br></p>`
        );
      } catch {}
      emitChange();
    }

    setPromptMode(null);
    setPromptUrl('');
  };

  const toolbarButtons = [
    { label: 'Bold', icon: Bold, action: () => exec('bold') },
    { label: 'Italic', icon: Italic, action: () => exec('italic') },
    { label: 'Underline', icon: Underline, action: () => exec('underline') },
    { label: 'Strikethrough', icon: Strikethrough, action: () => exec('strikeThrough') },
    { divider: true },
    { label: 'Heading 1', icon: Heading1, action: () => toggleBlock('h1') },
    { label: 'Heading 2', icon: Heading2, action: () => toggleBlock('h2') },
    { label: 'Blockquote', icon: Quote, action: () => toggleBlock('blockquote') },
    { label: 'Code Block', icon: Code2, action: insertCodeBlock },
    { divider: true },
    { label: 'Ordered List', icon: ListOrdered, action: () => exec('insertOrderedList') },
    { label: 'Bullet List', icon: List, action: () => exec('insertUnorderedList') },
    { divider: true },
    { label: 'Insert Link', icon: Link2, action: () => { setPromptMode('link'); setPromptUrl(''); setPromptError(''); } },
    { label: 'Insert Image URL', icon: ImageIcon, action: () => { setPromptMode('image'); setPromptUrl(''); setPromptError(''); } },
    { label: 'Insert Video URL', icon: Video, action: () => { setPromptMode('video'); setPromptUrl(''); setPromptError(''); } },
    { divider: true },
    { label: 'Clear Formatting', icon: Eraser, action: () => exec('removeFormat') },
  ];

  return (
    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#ffffff' }}>
      {/* Quill-Snow style toolbar */}
      <div
        role="toolbar"
        aria-label="Rich text formatting"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 10px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        {toolbarButtons.map((btn, idx) =>
          btn.divider ? (
            <span key={`div-${idx}`} style={{ width: '1px', height: '20px', background: '#cbd5e1', margin: '0 4px' }} />
          ) : (
            <button
              key={btn.label}
              type="button"
              title={btn.label}
              aria-label={btn.label}
              onClick={btn.action}
              style={{
                display: 'inline-grid',
                placeItems: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                border: '1px solid transparent',
                background: 'transparent',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <btn.icon size={15} />
            </button>
          )
        )}
      </div>

      {promptMode && (
        <div style={{ padding: '10px 12px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <input
            type="url"
            value={promptUrl}
            onChange={(e) => setPromptUrl(e.target.value)}
            placeholder={
              promptMode === 'video'
                ? 'https://www.youtube.com/watch?v=... or Vimeo URL'
                : 'https://...'
            }
            className="adm-form-control"
            style={{ flex: 1, minWidth: '220px', height: '34px' }}
          />
          <button type="button" onClick={handleInsertMedia} className="adm-btn adm-btn-sm adm-btn-primary">
            Insert {promptMode}
          </button>
          <button type="button" onClick={() => setPromptMode(null)} className="adm-btn adm-btn-sm adm-btn-outline">
            Cancel
          </button>
          {promptError && <span style={{ width: '100%', fontSize: '11px', color: '#dc2626' }}>{promptError}</span>}
        </div>
      )}

      {/* Editable surface */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        data-placeholder={placeholder}
        style={{
          minHeight: '180px',
          maxHeight: '360px',
          overflowY: 'auto',
          padding: '14px 16px',
          fontSize: '14px',
          lineHeight: 1.65,
          color: '#0f172a',
          outline: 'none',
        }}
      />
    </div>
  );
}
