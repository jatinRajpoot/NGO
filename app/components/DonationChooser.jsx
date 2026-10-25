'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Heart, ShieldCheck } from 'lucide-react';
import { organization } from '../data/site-data';

const amounts = [500, 1500, 3000, 6000];
const impact = {
  500: 'Supports digital literacy and government scheme awareness for 2 rural families.',
  1500: 'Provides educational and vocational learning materials for 1 youth trainee.',
  3000: 'Helps sponsor a community health, hygiene and preventive care camp.',
  6000: 'Supports women’s livelihood and tailoring or digital skills training for 1 beneficiary.',
};

export default function DonationChooser({ compact = false }) {
  const [amount, setAmount] = useState(1500);
  const [custom, setCustom] = useState('');
  const [frequency, setFrequency] = useState('One-time');
  const chosenAmount = custom ? Number(custom) : amount;
  const whatsappHref = useMemo(() => {
    const message = `Hello GSDD Foundation, I would like to contribute ₹${chosenAmount || ''} (${frequency.toLowerCase()}). Please share the official donation process and 80G receipt details.`;
    return `https://wa.me/${organization.phoneHref.replace('+', '')}?text=${encodeURIComponent(message)}`;
  }, [chosenAmount, frequency]);

  return (
    <section className={`donation-card${compact ? ' donation-card-compact' : ''}`} aria-labelledby={compact ? 'quick-donate-title' : 'donate-choice-title'}>
      <div className="donation-card-top">
        <span className="donation-mark"><Heart size={19} fill="currentColor" aria-hidden="true" /></span>
        <span className="donation-lock"><ShieldCheck size={14} aria-hidden="true" /> 80G · {organization.tax80g}</span>
      </div>
      <h2 id={compact ? 'quick-donate-title' : 'donate-choice-title'}>{compact ? 'Empower a community today' : 'Choose your contribution'}</h2>
      <p className="donation-tax-note">50% tax exemption under Section 80G, subject to applicable rules and documentation.</p>
      <div className="frequency-switch" role="group" aria-label="Contribution frequency">
        {['Monthly', 'One-time'].map((option) => <button type="button" key={option} onClick={() => setFrequency(option)} aria-pressed={frequency === option}>{option}</button>)}
      </div>
      <div className="donation-amounts" role="group" aria-label="Choose an amount">
        {amounts.map((value) => <button type="button" key={value} className={`${amount === value && !custom ? 'is-selected' : ''}${value === 1500 ? ' is-popular' : ''}`} onClick={() => { setAmount(value); setCustom(''); }} aria-pressed={amount === value && !custom}>
          <strong>₹{value.toLocaleString('en-IN')}</strong>{value === 1500 && <small>Most popular</small>}
        </button>)}
      </div>
      <label className="custom-amount-label" htmlFor={compact ? 'custom-amount-home' : 'custom-amount-donate'}>
        <span>Custom amount</span><span className="custom-input-wrap">₹ <input id={compact ? 'custom-amount-home' : 'custom-amount-donate'} type="number" min="1" inputMode="numeric" placeholder="Enter amount" value={custom} onChange={(event) => setCustom(event.target.value)} /></span>
      </label>
      <p className="impact-note">{impact[amount] || 'Your contribution helps support community learning, health awareness and local opportunity.'}</p>
      <a className="button button-donate donation-submit" href={whatsappHref} target="_blank" rel="noreferrer">Ask for secure donation details <ArrowRight size={16} aria-hidden="true" /></a>
      <p className="donation-smallprint">{compact ? 'Payments are arranged directly with the foundation.' : 'This site does not process payments or collect donor PAN. Contact the foundation directly for official payment instructions and receipt details.'}</p>
    </section>
  );
}
