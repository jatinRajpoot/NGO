'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { organization } from '../data/site-data';

function Field({ field, formId }) {
  const id = `${formId}-${field.name}`;
  const label = <>{field.label}{field.optional && <span> (optional)</span>}</>;
  if (field.type === 'textarea') {
    return <label htmlFor={id}>{label}<textarea id={id} name={field.name} rows={field.rows || 4} required={!field.optional} placeholder={field.placeholder} /></label>;
  }
  if (field.type === 'select') {
    return <label htmlFor={id}>{label}<select id={id} name={field.name} defaultValue={field.options[0]} required={!field.optional}>
      {field.options.map((option) => <option key={option}>{option}</option>)}
    </select></label>;
  }
  return <label htmlFor={id}>{label}<input id={id} name={field.name} type={field.type || 'text'} autoComplete={field.autoComplete} required={!field.optional} placeholder={field.placeholder} /></label>;
}

export default function EmailDraftForm({ formId, subject, submitLabel, groups, note }) {
  const [prepared, setPrepared] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const lines = groups.flatMap((group) => [
      `${group.legend}:`,
      ...group.fields.map((field) => `${field.label}: ${values.get(field.name) || 'Not provided'}`),
      '',
    ]);
    const url = `mailto:${organization.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    setPrepared(true);
    window.location.href = url;
  }

  return <>
    <form className="contact-form visitor-form" onSubmit={handleSubmit}>
      {groups.map((group) => <fieldset className="visitor-form-group" key={group.legend}>
        <legend>{group.legend}</legend>
        {group.fields.map((field) => <Field field={field} formId={formId} key={field.name} />)}
      </fieldset>)}
      <button type="submit" className="button button-blue">{submitLabel}<ArrowRight size={16} aria-hidden="true" /></button>
      {prepared && <p className="form-status" role="status">Your email app should open with a draft. Review and send it there. This website has not received or stored your message, and no submission reference has been created.</p>}
      <p className="form-caption">{note} The form prepares an email to {organization.email}; nothing is sent until you choose to send it from your email app.</p>
    </form>
  </>;
}
