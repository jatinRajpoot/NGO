'use client';

import { ExternalLink, Youtube, Linkedin, Facebook, Instagram, Send, MessageCircle } from 'lucide-react';
import { socialLinks } from '../data/site-data';

const iconMap = {
  'Facebook': Facebook,
  'Instagram': Instagram,
  'YouTube': Youtube,
  'LinkedIn': Linkedin,
  'Telegram': Send,
  'WhatsApp Channel': MessageCircle,
};

export default function SocialMediaBar({ className = '', title = 'Connect with us on Social Media' }) {
  return (
    <div className={`social-media-bar ${className}`}>
      {title && (
        <div className="social-media-title">
          <span>{title}</span>
          <small>Follow GSDD Foundation updates, stories & community activities</small>
        </div>
      )}
      <div className="social-links-grid" role="list">
        {socialLinks.map((social) => {
          const Icon = iconMap[social.label] || ExternalLink;
          return (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className={`social-pill social-${social.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              aria-label={`Visit GSDD Foundation on ${social.label} (opens in new tab)`}
              role="listitem"
            >
              <Icon size={18} aria-hidden="true" />
              <span className="social-pill-label">{social.label}</span>
              <ExternalLink size={13} className="external-indicator" aria-hidden="true" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
