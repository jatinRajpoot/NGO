'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { organization } from '../data/site-data';

const MAILTO_URL_LIMIT = 1900;
const fieldMaxLengths = { text: 120, email: 254, tel: 20, textarea: 1000 };
const errorTextStyle = { color: '#B42318' };
const errorBannerStyle = { color: '#8F1D14', background: '#FDF0EF', borderLeftColor: '#B42318' };

function fieldErrorText(id, message) {
  return <span id={id} className="form-caption" style={errorTextStyle}>{message}</span>;
}

function Field({ field, formId, error }) {
  const id = `${formId}-${field.name}`;
  const errorId = `${id}-error`;
  const label = <>{field.label}{field.optional && <span> (optional)</span>}</>;
  const invalidProps = error
    ? { 'aria-invalid': true, 'aria-describedby': errorId }
    : {};
  if (field.type === 'textarea') {
    return <label htmlFor={id}>{label}
      <textarea id={id} name={field.name}
        rows={field.rows || 4} maxLength={field.maxLength ?? fieldMaxLengths.textarea}
        required={!field.optional} placeholder={field.placeholder} {...invalidProps} />
      {error && fieldErrorText(errorId, error)}
    </label>;
  }
  if (field.type === 'select') {
    return <label htmlFor={id}>{label}
      <select id={id} name={field.name} defaultValue={field.options[0]} required={!field.optional} {...invalidProps}>
        {field.options.map((option) => <option key={option}>{option}</option>)}
      </select>
      {error && fieldErrorText(errorId, error)}
    </label>;
  }
  return <label htmlFor={id}>{label}
    <input id={id} name={field.name}
      type={field.type || 'text'} autoComplete={field.autoComplete}
      maxLength={field.maxLength ?? fieldMaxLengths[field.type || 'text']}
      required={!field.optional} placeholder={field.placeholder} {...invalidProps} />
    {error && fieldErrorText(errorId, error)}
  </label>;
}

export default function EmailDraftForm({ formId, subject, submitLabel, groups, note }) {
  const [prepared, setPrepared] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [summary, setSummary] = useState('');
  const allFields = groups.flatMap((group) => group.fields);

  function clearMessages() {
    setPrepared(false);
    setFieldErrors({});
    setSummary('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const nextErrors = {};
    const valueByName = new Map(allFields.map((field) => {
      const raw = values.get(field.name);
      const value = typeof raw === 'string' ? raw.trim() : '';
      if (!field.optional && !value) {
        nextErrors[field.name] = `${field.label} is required.`;
      } else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        nextErrors[field.name] = 'Enter a valid email address, such as name@example.com.';
      }
      return [field.name, value];
    }));
    if (Object.keys(nextErrors).length > 0) {
      setPrepared(false);
      setFieldErrors(nextErrors);
      setSummary('Please complete the highlighted fields.');
      const firstInvalid = allFields.find((field) => nextErrors[field.name]);
      form.elements[firstInvalid.name]?.focus();
      return;
    }
    const lines = groups.flatMap((group) => [
      `${group.legend}:`,
      ...group.fields.map((field) => `${field.label}: ${valueByName.get(field.name) || 'Not provided'}`),
      '',
    ]);
    const url = `mailto:${organization.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    if (url.length > MAILTO_URL_LIMIT) {
      setPrepared(false);
      setSummary(`These details are too long for one email draft. Please shorten the longer fields, or email ${organization.email} directly.`);
      return;
    }
    setFieldErrors({});
    setSummary('');
    setPrepared(true);
    window.location.href = url;
  }

  return <>
    <form className="contact-form visitor-form" onSubmit={handleSubmit} onInput={clearMessages}>
      {groups.map((group) => <fieldset className="visitor-form-group" key={group.legend}>
        <legend>{group.legend}</legend>
        {group.fields.map((field) => <Field field={field} formId={formId} error={fieldErrors[field.name]} key={field.name} />)}
      </fieldset>)}
      <button type="submit" className="button button-blue">{submitLabel}<ArrowRight size={16} aria-hidden="true" /></button>
      {summary && <p className="form-status" role="alert" style={errorBannerStyle}>{summary}</p>}
      {prepared && !summary && <p className="form-status" role="status">Your email app should open with a draft. Review and send it there. If it does not open, you can email {organization.email} directly. This website has not received or stored your message, and no submission reference has been created.</p>}
      <p className="form-caption">{note} The form prepares an email to {organization.email}; nothing is sent until you choose to send it from your email app.</p>
    </form>
  </>;
}
