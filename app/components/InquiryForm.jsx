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
    const email = trimmed(data, 'email');
    const phone = trimmed(data, 'phone');
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
    const href = buildMailtoHref(
      `Website enquiry: ${data.get('topic')}`,
      `Name: ${name}\nEmail: ${email}\nMobile / WhatsApp: ${phone || 'Not provided'}\n\n${message}`,
    );
    if (href.length > MAILTO_URL_LIMIT) {
      setReady(false);
      setSummary(`These details are too long for one email draft. Please shorten your message, or email ${organization.email} directly.`);
      return;
    }
    setErrors({});
    setSummary('');
    setReady(true);
    window.location.href = href;
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
    <button type="submit" className="button button-blue">Prepare email <ArrowRight size={16} aria-hidden="true" /></button>
    {summary && <p className="form-status" role="alert" style={errorBannerStyle}>{summary}</p>}
    {ready && !summary && <p className="form-status" role="status">Your email app should open with a draft. If it does not open, you can email {organization.email} directly.</p>}
    <p className="form-caption">Submitting opens your email app. This form does not store your information on this website.</p>
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
