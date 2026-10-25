'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { organization } from '../data/site-data';

function openEmail(subject, body) {
  window.location.href = `mailto:${organization.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ContactForm() {
  const [ready, setReady] = useState(false);
  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    openEmail(`Website enquiry: ${data.get('topic')}`, `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone') || 'Not provided'}\n\n${data.get('message')}`);
    setReady(true);
  }
  return <form className="contact-form" onSubmit={handleSubmit}>
    <div className="form-row"><label>Name<input name="name" autoComplete="name" required /></label><label>Email<input name="email" type="email" autoComplete="email" required /></label></div>
    <div className="form-row"><label>Mobile / WhatsApp <span>(optional)</span><input name="phone" type="tel" autoComplete="tel" /></label><label>Enquiry type<select name="topic" defaultValue="Partnership"><option>Volunteering</option><option>Training</option><option>Partnership</option><option>Donation</option><option>General enquiry</option></select></label></div>
    <label>Message<textarea name="message" rows="4" required placeholder="Tell us how we can help." /></label>
    <button type="submit" className="button button-blue">Prepare email <ArrowRight size={16} aria-hidden="true" /></button>
    {ready && <p className="form-status" role="status">Your email app should open with a draft. You can also email {organization.email} directly.</p>}
    <p className="form-caption">Submitting opens your email app. This form does not store your information on this website.</p>
  </form>;
}

export function VolunteerForm() {
  const [ready, setReady] = useState(false);
  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    openEmail('Volunteer application', [
      `Name: ${data.get('name')}`,
      `Mobile / WhatsApp: ${data.get('phone')}`,
      `Email: ${data.get('email')}`,
      `District & State: ${data.get('district')}`,
      `Area of interest: ${data.get('interest')}`,
      `Availability: ${data.get('availability')}`,
    ].join('\n'));
    setReady(true);
  }
  return <form className="contact-form volunteer-form" onSubmit={handleSubmit}>
    <div className="form-row"><label>Full name<input name="name" autoComplete="name" required /></label><label>Mobile / WhatsApp<input name="phone" type="tel" autoComplete="tel" required /></label></div>
    <div className="form-row"><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>District &amp; State<input name="district" required /></label></div>
    <div className="form-row"><label>Area of interest<select name="interest" defaultValue="Digital literacy"><option>Digital literacy</option><option>Education</option><option>Health camp</option><option>Women empowerment</option><option>Survey &amp; research</option><option>Social media</option></select></label><label>Availability<select name="availability" defaultValue="Weekends"><option>Weekends</option><option>Weekdays</option><option>Remote</option></select></label></div>
    <button type="submit" className="button button-blue">Prepare volunteer application <ArrowRight size={16} aria-hidden="true" /></button>
    {ready && <p className="form-status" role="status">Your email app should open with your volunteer application.</p>}
    <p className="form-caption">Your details are sent only when you choose to email the foundation.</p>
  </form>;
}
