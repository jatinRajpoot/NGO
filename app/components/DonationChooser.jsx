'use client';

import { useId, useMemo, useState } from 'react';
import { ArrowRight, Heart, ShieldCheck } from 'lucide-react';
import { organization } from '../data/site-data';

const amounts = [500, 1500, 3000, 6000];
const MIN_CUSTOM_AMOUNT = 1;
const MAX_CUSTOM_AMOUNT = 10000000; // ₹1,00,00,000 (1 crore)
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;

export default function DonationChooser({ compact = false }) {
  const customAmountId = compact ? 'custom-amount-home' : 'custom-amount-donate';
  const errorId = useId();
  const [amount, setAmount] = useState(1500);
  const [custom, setCustom] = useState('');
  const [frequency, setFrequency] = useState('One-time');
  const [purpose, setPurpose] = useState('General support');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [requestError, setRequestError] = useState('');

  const isCustom = custom !== '';
  const customValue = isCustom ? Number(custom) : Number.NaN;
  const customIsValid =
    isCustom &&
    Number.isInteger(customValue) &&
    customValue >= MIN_CUSTOM_AMOUNT &&
    customValue <= MAX_CUSTOM_AMOUNT;
  const chosenAmount = isCustom ? customValue : amount;
  const amountIsValid = isCustom ? customIsValid : Number.isInteger(amount) && amount >= MIN_CUSTOM_AMOUNT;
  const invalidAmount = isCustom && !customIsValid;

  const trimmedEmail = donorEmail.trim();
  const invalidEmail =
    trimmedEmail !== '' &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) || trimmedEmail.length > MAX_EMAIL_LENGTH);

  const formattedAmount = amountIsValid ? chosenAmount.toLocaleString('en-IN') : '';
  const frequencyWord = frequency === 'Monthly' ? 'monthly' : 'one-time';

  function clearMessages() {
    setRequestError('');
    setRequestStatus('');
  }

  function validateDonation() {
    if (invalidAmount) {
      const val = Number(custom);
      const errorMsg =
        Number.isFinite(val) && val > MAX_CUSTOM_AMOUNT
          ? 'Enter a custom amount of at most ₹1,00,00,000, or choose a suggested amount.'
          : 'Enter a custom amount of at least ₹1, or choose a suggested amount.';
      return { valid: false, error: errorMsg, focusId: customAmountId };
    }
    if (invalidEmail) {
      return {
        valid: false,
        error: 'Enter a valid email address, or leave the email field blank.',
        focusId: 'donor-email',
      };
    }
    if (donorName.trim().length > MAX_NAME_LENGTH) {
      return {
        valid: false,
        error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
        focusId: 'donor-name',
      };
    }
    return { valid: true };
  }

  function handleWhatsAppClick(event) {
    const check = validateDonation();
    if (!check.valid) {
      event.preventDefault();
      setRequestError(check.error);
      if (check.focusId) {
        const input = document.getElementById(check.focusId);
        if (input) input.focus();
      }
      return;
    }
    setRequestError('');
    setRequestStatus(
      'A WhatsApp message draft with your details has been prepared. If WhatsApp did not open, use the email option below. Nothing has been sent or paid through this website.',
    );
  }

  function handleEmailClick(event) {
    const check = validateDonation();
    if (!check.valid) {
      event.preventDefault();
      setRequestError(check.error);
      if (check.focusId) {
        const input = document.getElementById(check.focusId);
        if (input) input.focus();
      }
      return;
    }
    setRequestError('');
    setRequestStatus(
      'An email draft with your details has been prepared in your email app. Nothing has been sent or paid through this website.',
    );
  }

  const enquiryDetails = useMemo(
    () =>
      [
        amountIsValid
          ? `Hello GSDD Foundation, I would like information about a ₹${formattedAmount} ${frequencyWord} contribution.`
          : `Hello GSDD Foundation, I would like information about making a contribution (amount to be discussed).`,
        `Purpose preference: ${purpose}. Please share the current official donation process and receipt details.`,
        donorName.trim() ? `Name: ${donorName.trim().slice(0, MAX_NAME_LENGTH)}` : '',
        trimmedEmail ? `Email: ${trimmedEmail.slice(0, MAX_EMAIL_LENGTH)}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    [amountIsValid, formattedAmount, frequencyWord, purpose, donorName, trimmedEmail],
  );

  const whatsappHref = useMemo(
    () => `https://wa.me/${organization.phoneHref.replace(/\+/g, '')}?text=${encodeURIComponent(enquiryDetails)}`,
    [enquiryDetails],
  );
  const mailtoHref = useMemo(
    () =>
      `mailto:${organization.email}?subject=${encodeURIComponent(`Donation enquiry (${frequencyWord})`)}&body=${encodeURIComponent(enquiryDetails)}`,
    [enquiryDetails, frequencyWord],
  );

  return (
    <section
      className={`donation-card${compact ? ' donation-card-compact' : ''}`}
      aria-labelledby={compact ? 'quick-donate-title' : 'donate-choice-title'}
    >
      <div className="donation-card-top">
        <span className="donation-mark">
          <Heart size={19} fill="currentColor" aria-hidden="true" />
        </span>
        <span className="donation-lock">
          <ShieldCheck size={14} aria-hidden="true" /> 80G · {organization.tax80g}
        </span>
      </div>
      <h2 id={compact ? 'quick-donate-title' : 'donate-choice-title'}>
        {compact ? 'Empower a community today' : 'Choose your contribution'}
      </h2>
      <p className="donation-tax-note">
        Ask the foundation about any applicable 80G documentation. This page does not process donations.
      </p>
      <div className="frequency-switch" role="group" aria-label="Contribution frequency preference">
        {['One-time', 'Monthly'].map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => {
              setFrequency(option);
              clearMessages();
            }}
            aria-pressed={frequency === option}
          >
            {option}
          </button>
        ))}
      </div>
      {frequency === 'Monthly' && (
        <p className="donation-frequency-note">
          Monthly is a request preference only; no recurring payment is set up here.
        </p>
      )}
      <div className="donation-amounts" role="group" aria-label="Choose an amount">
        {amounts.map((value) => (
          <button
            type="button"
            key={value}
            className={amount === value && !custom ? 'is-selected' : ''}
            onClick={() => {
              setAmount(value);
              setCustom('');
              clearMessages();
            }}
            aria-pressed={amount === value && !custom}
          >
            <strong>₹{value.toLocaleString('en-IN')}</strong>
          </button>
        ))}
      </div>
      <label className="custom-amount-label" htmlFor={customAmountId}>
        <span>Custom amount</span>
        <span className="custom-input-wrap">
          ₹{' '}
          <input
            id={customAmountId}
            type="number"
            min={MIN_CUSTOM_AMOUNT}
            max={MAX_CUSTOM_AMOUNT}
            step="1"
            inputMode="numeric"
            placeholder="Enter amount"
            value={custom}
            aria-invalid={invalidAmount}
            aria-describedby={invalidAmount && requestError ? errorId : undefined}
            onChange={(event) => {
              setCustom(event.target.value);
              clearMessages();
            }}
          />
        </span>
      </label>
      {!compact && (
        <div className="donation-details">
          <label htmlFor="donation-purpose">
            Purpose preference{' '}
            <select
              id="donation-purpose"
              value={purpose}
              onChange={(event) => {
                setPurpose(event.target.value);
                clearMessages();
              }}
            >
              <option>General support</option>
              <option>Education and skills</option>
              <option>Digital inclusion</option>
              <option>Health awareness</option>
              <option>Women’s empowerment</option>
              <option>Community development</option>
            </select>
          </label>
          <p>Purpose is a preference to discuss with the foundation, not a promise of restricted allocation.</p>
          <div className="donation-details-row">
            <label htmlFor="donor-name">
              Name <span>(optional)</span>
              <input
                id="donor-name"
                autoComplete="name"
                maxLength={MAX_NAME_LENGTH}
                value={donorName}
                onChange={(event) => {
                  setDonorName(event.target.value);
                  clearMessages();
                }}
              />
            </label>
            <label htmlFor="donor-email">
              Email <span>(optional)</span>
              <input
                id="donor-email"
                type="email"
                autoComplete="email"
                maxLength={MAX_EMAIL_LENGTH}
                value={donorEmail}
                aria-invalid={invalidEmail}
                aria-describedby={invalidEmail && requestError ? errorId : undefined}
                onChange={(event) => {
                  setDonorEmail(event.target.value);
                  clearMessages();
                }}
              />
            </label>
          </div>
        </div>
      )}
      <p className="impact-note">
        Suggested amount only. Confirm current programme priorities, payment instructions and receipt details directly
        with the foundation.
      </p>
      <a
        className="button button-donate donation-submit"
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleWhatsAppClick}
      >
        Ask for official donation details <ArrowRight size={16} aria-hidden="true" />
      </a>
      {requestError && (
        <p id={errorId} className="donation-request-error" role="alert">
          {requestError}
        </p>
      )}
      {requestStatus && (
        <p className="donation-request-status" role="status">
          {requestStatus}
        </p>
      )}
      <p className="donation-smallprint">
        Cannot use WhatsApp?{' '}
        <a className="text-link" href={mailtoHref} onClick={handleEmailClick}>
          Request the same details by email
        </a>{' '}
        — the link opens your own email app; this website sends nothing on your behalf.
      </p>
      <p className="donation-smallprint">
        {compact
          ? 'Continue with the foundation for official payment instructions. No payment is made on this site.'
          : 'The optional name and email above are added to your WhatsApp or email inquiry draft. This website does not collect or store donor details, process payment, or generate a receipt.'}
      </p>
    </section>
  );
}
