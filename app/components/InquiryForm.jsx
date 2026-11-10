'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { organization } from '../data/site-data';

const MAILTO_URL_LIMIT = 1900;
const errorTextStyle = { color: '#B42318' };
const errorBannerStyle = { color: '#8F1D14', background: '#FDF0EF', borderLeftColor: '#B42318' };

function trimmed(data, name) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildMailtoHref(subject, body) {
  return `mailto:${organization.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function fieldErrorMessage(id, message) {
  return <span id={id} className="form-caption" style={errorTextStyle}>{message}</span>;
}

function invalidProps(name, errors) {
  if (!errors[name]) return {};
  return { 'aria-invalid': true, 'aria-describedby': `${name}-error` };
}

export function ContactForm() {
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState(null);

  function clearMessages() {
    setReady(false);
    setErrors({});
    setSummary('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = trimmed(data, 'name');
    const email = trimmed(data, 'email');
    const phone = trimmed(data, 'phone');
    const topic = trimmed(data, 'topic') || 'General enquiry';
    const message = trimmed(data, 'message');
    const nextErrors = {};
    if (!name) nextErrors.name = 'Enter your name.';
    if (!email) nextErrors.email = 'Enter your email address.';
    else if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address, such as name@example.com.';
    if (!message) nextErrors.message = 'Write a short message so we know how to help.';
    if (Object.keys(nextErrors).length > 0) {
      setReady(false);
      setErrors(nextErrors);
      setSummary('Please complete the highlighted fields.');
      const firstInvalid = ['name', 'email', 'message'].find((field) => nextErrors[field]);
      form.elements[firstInvalid]?.focus();
      return;
    }

    setErrors({});
    setSummary('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/inquiries/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, topic, message }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        setSummary(payload?.error || 'Could not save your enquiry ticket. Please try again.');
        return;
      }
      setSubmittedEnquiry({
        ...payload.ticket,
        delivery: payload.delivery,
      });
    } catch {
      setSummary('Network error saving your enquiry ticket. Please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedEnquiry) {
    const waText = `Hello GSDD Foundation, I have submitted an online enquiry [Ticket: ${submittedEnquiry.ticketId}].\nName: ${submittedEnquiry.name}\nTopic: ${submittedEnquiry.topic}\nMessage: ${submittedEnquiry.message}`;
    const mailText = `Enquiry Ticket: ${submittedEnquiry.ticketId}\nName: ${submittedEnquiry.name}\nEmail: ${submittedEnquiry.email}\nPhone: ${submittedEnquiry.phone}\nTopic: ${submittedEnquiry.topic}\n\n${submittedEnquiry.message}`;
    const deliveredExternally = Boolean(submittedEnquiry.delivery?.delivered);

    return (
      <div className="enquiry-success-panel" role="status" aria-live="polite">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <span style={{ display: 'grid', placeItems: 'center', width: '36px', height: '36px', borderRadius: '50%', background: '#DCFCE7', color: '#15803D' }}>
            ✓
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--gsdd-navy-dark)' }}>Enquiry Ticket Saved!</h3>
            <span style={{ fontSize: '12px', color: 'var(--gsdd-text-muted)' }}>Server Ticket ID: <strong><code>{submittedEnquiry.ticketId}</code></strong></span>
          </div>
        </div>
        <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', margin: '0 0 10px' }}>
          Thank you <strong>{submittedEnquiry.name}</strong>. Your enquiry regarding <strong>{submittedEnquiry.topic}</strong> has been persisted in the foundation server queue for staff review.
        </p>
        <p style={{ fontSize: '12px', color: deliveredExternally ? '#15803D' : '#92400E', margin: '0 0 16px' }}>
          {deliveredExternally
            ? 'An email notification was dispatched to foundation staff.'
            : 'External email relay is not configured on this server; your ticket is stored for admin review and you can also forward it immediately via WhatsApp or Email below.'}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <a
            href={`https://wa.me/${organization.phoneHref.replace(/\+/g, '')}?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noreferrer"
            className="button button-blue"
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            Forward to WhatsApp
          </a>
          <a
            href={buildMailtoHref(`Website enquiry: ${submittedEnquiry.topic} [${submittedEnquiry.ticketId}]`, mailText)}
            className="button button-outline-blue"
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            Send via Email
          </a>
          <button
            type="button"
            onClick={() => setSubmittedEnquiry(null)}
            className="button-text"
            style={{ fontSize: '13px' }}
          >
            Submit another enquiry
          </button>
        </div>
      </div>
    );
  }

  return <form className="contact-form" onSubmit={handleSubmit} onInput={clearMessages}>
    <div className="form-row">
      <label>Name
        <input id="contact-name" name="name" autoComplete="name" maxLength={100} required {...invalidProps('name', errors)} />
        {errors.name && fieldErrorMessage('name-error', errors.name)}
      </label>
      <label>Email
        <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required {...invalidProps('email', errors)} />
        {errors.email && fieldErrorMessage('email-error', errors.email)}
      </label>
    </div>
    <div className="form-row">
      <label>Mobile / WhatsApp <span>(optional)</span>
        <input id="contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={20} />
      </label>
      <label>Enquiry type
        <select id="contact-topic" name="topic" defaultValue="Partnership"><option>Volunteering</option><option>Training</option><option>Partnership</option><option>Donation</option><option>General enquiry</option></select>
      </label>
    </div>
    <label>Message
      <textarea id="contact-message" name="message" rows="4" maxLength={1200} required placeholder="Tell us how we can help." {...invalidProps('message', errors)} />
      {errors.message && fieldErrorMessage('message-error', errors.message)}
    </label>
    <button type="submit" className="button button-blue" disabled={submitting}>
      {submitting ? 'Submitting enquiry...' : 'Submit enquiry'} <ArrowRight size={16} aria-hidden="true" />
    </button>
    {summary && <p className="form-status" role="alert" style={errorBannerStyle}>{summary}</p>}
    <p className="form-caption">Your enquiry is saved in our staff queue with a ticket ID for follow-up.</p>
  </form>;
}

export function VolunteerForm() {
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState('');

  function clearMessages() {
    setReady(false);
    setErrors({});
    setSummary('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = trimmed(data, 'name');
    const phone = trimmed(data, 'phone');
    const email = trimmed(data, 'email');
    const district = trimmed(data, 'district');
    const nextErrors = {};
    if (!name) nextErrors.name = 'Enter your full name.';
    if (!phone) nextErrors.phone = 'Enter a phone or WhatsApp number.';
    else if (!/^[+\d][\d\s()+-]{5,19}$/.test(phone)) nextErrors.phone = 'Enter a reachable phone or WhatsApp number, using digits, spaces or +, -, ( ).';
    if (!email) nextErrors.email = 'Enter your email address.';
    else if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address, such as name@example.com.';
    if (!district) nextErrors.district = 'Enter your district and state.';
    if (Object.keys(nextErrors).length > 0) {
      setReady(false);
      setErrors(nextErrors);
      setSummary('Please complete the highlighted fields.');
      const firstInvalid = ['name', 'phone', 'email', 'district'].find((field) => nextErrors[field]);
      form.elements[firstInvalid]?.focus();
      return;
    }
    const href = buildMailtoHref('Volunteer application', [
      `Name: ${name}`,
      `Mobile / WhatsApp: ${phone}`,
      `Email: ${email}`,
      `District & State: ${district}`,
      `Area of interest: ${data.get('interest')}`,
      `Availability: ${data.get('availability')}`,
    ].join('\n'));
    if (href.length > MAILTO_URL_LIMIT) {
      setReady(false);
      setSummary(`These details are too long for one email draft. Please shorten them, or email ${organization.email} directly.`);
      return;
    }
    setErrors({});
    setSummary('');
    setReady(true);
    window.location.href = href;
  }

  return <form className="contact-form volunteer-form" onSubmit={handleSubmit} onInput={clearMessages}>
    <div className="form-row">
      <label>Full name
        <input id="volunteer-name" name="name" autoComplete="name" maxLength={100} required {...invalidProps('name', errors)} />
        {errors.name && fieldErrorMessage('name-error', errors.name)}
      </label>
      <label>Mobile / WhatsApp
        <input id="volunteer-phone" name="phone" type="tel" autoComplete="tel" maxLength={20} required {...invalidProps('phone', errors)} />
        {errors.phone && fieldErrorMessage('phone-error', errors.phone)}
      </label>
    </div>
    <div className="form-row">
      <label>Email
        <input id="volunteer-email" name="email" type="email" autoComplete="email" maxLength={254} required {...invalidProps('email', errors)} />
        {errors.email && fieldErrorMessage('email-error', errors.email)}
      </label>
      <label>District &amp; State
        <input id="volunteer-district" name="district" autoComplete="address-level2" maxLength={120} required {...invalidProps('district', errors)} />
        {errors.district && fieldErrorMessage('district-error', errors.district)}
      </label>
    </div>
    <div className="form-row">
      <label>Area of interest
        <select id="volunteer-interest" name="interest" defaultValue="Digital literacy"><option>Digital literacy</option><option>Education</option><option>Health camp</option><option>Women empowerment</option><option>Survey &amp; research</option><option>Social media</option></select>
      </label>
      <label>Availability
        <select id="volunteer-availability" name="availability" defaultValue="Weekends"><option>Weekends</option><option>Weekdays</option><option>Remote</option></select>
      </label>
    </div>
    <button type="submit" className="button button-blue">Prepare volunteer application <ArrowRight size={16} aria-hidden="true" /></button>
    {summary && <p className="form-status" role="alert" style={errorBannerStyle}>{summary}</p>}
    {ready && !summary && <p className="form-status" role="status">Your email app should open with your volunteer application. If it does not open, you can email {organization.email} directly.</p>}
    <p className="form-caption">Your details are sent only when you choose to email the foundation.</p>
  </form>;
}
