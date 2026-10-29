'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Search } from 'lucide-react';

export default function VerificationLookup() {
  const [code, setCode] = useState('');
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setCode(query.get('code') || query.get('id') || '');
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    setChecked(true);
  }

  return <>
    <form className="verification-form" onSubmit={handleSubmit}>
      <label htmlFor="verification-code">Document or reference code</label>
      <div className="verification-input-row">
        <input id="verification-code" name="code" value={code} onChange={(event) => { setCode(event.target.value); setChecked(false); }} autoComplete="off" required placeholder="Enter the code printed on the document" />
        <button type="submit" className="button button-blue"><Search size={16} aria-hidden="true" /> Check code</button>
      </div>
      <p className="form-caption">You can also open a QR link that includes <code>?code=…</code>. The code is not sent to a verification service.</p>
    </form>
    {checked && <div className="verification-result" role="status" aria-live="polite">
      <AlertCircle size={22} aria-hidden="true" />
      <div><strong>Unable to verify this document online</strong><p>Live document verification is not connected to this website. No validity result has been inferred for the code you entered. Contact the foundation through its published channels.</p></div>
    </div>}
  </>;
}
