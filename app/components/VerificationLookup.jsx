'use client';

import { useId, useEffect, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';

const MAX_CODE_LENGTH = 100;

export default function VerificationLookup() {
  const captionId = useId();
  const [code, setCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const initial = (query.get('code') || query.get('id') || '').trim().slice(0, MAX_CODE_LENGTH);
    setCode(initial);
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = code.trim().slice(0, MAX_CODE_LENGTH);
    if (!trimmed) return;
    setEnteredCode(trimmed);
    setChecked(true);
  }

  const echoedCode = enteredCode.length > 80 ? `${enteredCode.slice(0, 80)}…` : enteredCode;

  return (
    <>
      <form className="verification-form" onSubmit={handleSubmit}>
        <label htmlFor="verification-code">Document or reference code</label>
        <div className="verification-input-row">
          <input
            id="verification-code"
            name="code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setChecked(false);
            }}
            autoComplete="off"
            spellCheck="false"
            maxLength={MAX_CODE_LENGTH}
            required
            placeholder="Enter the code printed on the document"
            aria-describedby={captionId}
          />
          <button type="submit" className="button button-blue">
            <Search size={16} aria-hidden="true" /> Check code
          </button>
        </div>
        <p className="form-caption" id={captionId}>
          You can also open a QR link that includes <code>?code=…</code>. A code entered here stays in your browser; it is not sent to a verification service.
        </p>
      </form>
      {checked && (
        <div className="verification-result" role="status" aria-live="polite">
          <AlertCircle size={22} aria-hidden="true" />
          <div>
            <strong>Online verification is unavailable</strong>
            <p>
              Entered code: <code>{echoedCode}</code>. Online verification is not connected to this website. This check cannot confirm whether a document is genuine, valid, or expired, and the code was not transmitted anywhere. For official document verification, please contact the foundation directly through its published channels.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
