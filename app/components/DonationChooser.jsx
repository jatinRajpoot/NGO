'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Heart, ShieldCheck } from 'lucide-react';
import { organization } from '../data/site-data';

const amounts = [500, 1500, 3000, 6000];
export default function DonationChooser({ compact = false }) {
  const [amount, setAmount] = useState(1500);
  const [custom, setCustom] = useState('');
  const [frequency, setFrequency] = useState('One-time');
  const [purpose, setPurpose] = useState('General support');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [requestPrepared, setRequestPrepared] = useState(false);
  const [requestError, setRequestError] = useState('');
  const chosenAmount = custom ? Number(custom) : amount;
  const invalidAmount = Boolean(custom) && (!Number.isFinite(chosenAmount) || chosenAmount < 1);
  function handleRequestClick(event) {
    if (invalidAmount) {
      event.preventDefault();
      setRequestError('Enter a custom amount of at least ₹1, or choose a suggested amount.');
      return;
    }
    if (donorEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim())) {
      event.preventDefault();
      setRequestError('Enter a valid email address, or leave the email field blank.');
      return;
    }
    setRequestError('');
    setRequestPrepared(true);
  }
  const whatsappHref = useMemo(() => {
    const details = [
      `Hello GSDD Foundation, I would like information about a ₹${chosenAmount || ''} ${frequency === 'Monthly' ? 'monthly' : 'one-time'} contribution.`,
      `Purpose preference: ${purpose}. Please share the current official donation process and receipt details.`,
      donorName.trim() ? `Name: ${donorName.trim()}` : '',
      donorEmail.trim() ? `Email: ${donorEmail.trim()}` : '',
    ].filter(Boolean).join('\n');
    return `https://wa.me/${organization.phoneHref.replace('+', '')}?text=${encodeURIComponent(details)}`;
  }, [chosenAmount, frequency, purpose, donorName, donorEmail]);

  return (
    <section className={`donation-card${compact ? ' donation-card-compact' : ''}`} aria-labelledby={compact ? 'quick-donate-title' : 'donate-choice-title'}>
      <div className="donation-card-top">
        <span className="donation-mark"><Heart size={19} fill="currentColor" aria-hidden="true" /></span>
        <span className="donation-lock"><ShieldCheck size={14} aria-hidden="true" /> 80G · {organization.tax80g}</span>
      </div>
      <h2 id={compact ? 'quick-donate-title' : 'donate-choice-title'}>{compact ? 'Empower a community today' : 'Choose your contribution'}</h2>
      <p className="donation-tax-note">Ask the foundation about any applicable 80G documentation. This page does not process donations.</p>
      <div className="frequency-switch" role="group" aria-label="Contribution frequency preference">
        {['One-time', 'Monthly'].map((option) => <button type="button" key={option} onClick={() => setFrequency(option)} aria-pressed={frequency === option}>{option}</button>)}
      </div>
      {frequency === 'Monthly' && <p className="donation-frequency-note">Monthly is a request preference only; no recurring payment is set up here.</p>}
      <div className="donation-amounts" role="group" aria-label="Choose an amount">
        {amounts.map((value) => <button type="button" key={value} className={amount === value && !custom ? 'is-selected' : ''} onClick={() => { setAmount(value); setCustom(''); }} aria-pressed={amount === value && !custom}>
          <strong>₹{value.toLocaleString('en-IN')}</strong>
        </button>)}
      </div>
      <label className="custom-amount-label" htmlFor={compact ? 'custom-amount-home' : 'custom-amount-donate'}>
        <span>Custom amount</span><span className="custom-input-wrap">₹ <input id={compact ? 'custom-amount-home' : 'custom-amount-donate'} type="number" min="1" step="1" inputMode="numeric" placeholder="Enter amount" value={custom} onChange={(event) => setCustom(event.target.value)} /></span>
      </label>
      {!compact && <div className="donation-details">
        <label htmlFor="donation-purpose">Purpose preference <select id="donation-purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)}><option>General support</option><option>Education and skills</option><option>Digital inclusion</option><option>Health awareness</option><option>Women’s empowerment</option><option>Community development</option></select></label>
        <p>Purpose is a preference to discuss with the foundation, not a promise of restricted allocation.</p>
        <div className="donation-details-row"><label htmlFor="donor-name">Name <span>(optional)</span><input id="donor-name" autoComplete="name" value={donorName} onChange={(event) => setDonorName(event.target.value)} /></label><label htmlFor="donor-email">Email <span>(optional)</span><input id="donor-email" type="email" autoComplete="email" value={donorEmail} onChange={(event) => setDonorEmail(event.target.value)} /></label></div>
      </div>}
      <p className="impact-note">Suggested amount only. Confirm current programme priorities, payment instructions and receipt details directly with the foundation.</p>
      <a className="button button-donate donation-submit" href={whatsappHref} target="_blank" rel="noreferrer" onClick={handleRequestClick}>Ask for official donation details <ArrowRight size={16} aria-hidden="true" /></a>
      {requestError && <p className="donation-request-error" role="alert">{requestError}</p>}
      {requestPrepared && <p className="donation-request-status" role="status">A WhatsApp request draft has been opened. Nothing has been sent or paid through this website.</p>}
      <p className="donation-smallprint">{compact ? 'Continue with the foundation for official payment instructions. No payment is made on this site.' : 'The optional name and email above are added to your WhatsApp draft. This website does not collect or store donor details, process payment, or generate a receipt.'}</p>
    </section>
  );
}
