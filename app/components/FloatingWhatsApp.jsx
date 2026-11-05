'use client';

import { useState } from 'react';
import { Phone, MessageCircle, X, ShieldCheck, ArrowRight, Clock } from 'lucide-react';
import { organization } from '../data/site-data';

export default function FloatingWhatsApp() {
  const [isOpen, setIsOpen] = useState(false);

  const cleanPhone = organization.phoneHref.replace(/\+/g, '');
  
  function getWhatsAppHref(message) {
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  return (
    <div className="floating-whatsapp-container no-print" data-no-translate>
      {isOpen && (
        <div className="floating-whatsapp-popup" role="dialog" aria-modal="true" aria-label="WhatsApp & Helpline Direct Connect">
          <div className="fwa-header">
            <div className="fwa-avatar-row">
              <div className="fwa-avatar">GSDD</div>
              <div>
                <h4>GSDD Foundation</h4>
                <span className="fwa-status">
                  <span className="online-dot" aria-hidden="true" /> Official NGO Support
                </span>
              </div>
            </div>
            <button
              type="button"
              className="fwa-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close WhatsApp chat popup"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="fwa-body">
            <div className="fwa-msg-bubble">
              <p>Namaste! 🙏 Welcome to Global Skills &amp; Digital Development Foundation.</p>
              <p>How can our executive team assist you today?</p>
              <span className="fwa-timestamp"><Clock size={11} aria-hidden="true" /> Typically replies within 15 mins</span>
            </div>

            <div className="fwa-quick-options">
              <span className="fwa-quick-title">Quick Topics:</span>
              <a
                href={getWhatsAppHref('Hello GSDD Foundation, I would like information regarding Membership and Registration.')}
                target="_blank"
                rel="noreferrer"
                className="fwa-option-chip"
              >
                <span>Membership &amp; Registration</span>
                <ArrowRight size={13} aria-hidden="true" />
              </a>

              <a
                href={getWhatsAppHref('Hello GSDD Foundation, I want to make an online donation and receive my 80G tax receipt.')}
                target="_blank"
                rel="noreferrer"
                className="fwa-option-chip"
              >
                <span>Donation &amp; 80G Tax Exemption</span>
                <ArrowRight size={13} aria-hidden="true" />
              </a>

              <a
                href={getWhatsAppHref('Hello GSDD Foundation, I want to verify a document or request a visitor certificate.')}
                target="_blank"
                rel="noreferrer"
                className="fwa-option-chip"
              >
                <span>Certificate Request / Verification</span>
                <ArrowRight size={13} aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="fwa-footer">
            <a
              href={`tel:${organization.phoneHref}`}
              className="fwa-call-btn"
              aria-label="Direct call GSDD helpline"
            >
              <Phone size={15} aria-hidden="true" /> Direct Call: {organization.phone}
            </a>
            <a
              href={getWhatsAppHref('Hello GSDD Foundation, I am reaching out from your website.')}
              target="_blank"
              rel="noreferrer"
              className="fwa-wa-btn"
              aria-label="Start WhatsApp Chat"
            >
              <MessageCircle size={16} aria-hidden="true" /> Start WhatsApp Chat
            </a>
          </div>
        </div>
      )}

      <div className="floating-triggers">
        <a
          href={`tel:${organization.phoneHref}`}
          className="floating-call-trigger"
          aria-label="Direct Phone Call to GSDD Foundation Helpline"
          title="Direct Phone Call"
        >
          <Phone size={20} aria-hidden="true" />
        </a>

        <button
          type="button"
          className="floating-wa-trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Open Direct WhatsApp Chat and Assistance"
          title="Direct WhatsApp Chat"
        >
          <MessageCircle size={26} aria-hidden="true" />
          <span className="pulse-ring" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
