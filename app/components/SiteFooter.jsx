import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Heart, Mail, MapPin, Phone } from 'lucide-react';
import { organization, socialLinks } from '../data/site-data';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main container">
        <div className="footer-brand-block">
          <Link href="/" className="footer-brand">
            <Image src="/logo.png" alt="" width={53} height={53} />
            <span><strong>GSDD FOUNDATION</strong><small>GLOBAL SKILLS &amp; DIGITAL DEVELOPMENT FOUNDATION</small></span>
          </Link>
          <p>{organization.tagline}</p>
          <p className="footer-legal-name">{organization.legalName}</p>
          <Link className="button button-outline-light footer-cta" href="/get-involved"><Heart size={15} aria-hidden="true" /> Join the work</Link>
        </div>
        <div className="footer-links-column">
          <h2>Explore</h2>
          <Link href="/about">About the foundation</Link>
          <Link href="/core-areas">Our core areas</Link>
          <Link href="/work-sectors">12 work sectors</Link>
          <Link href="/projects">Projects &amp; activities</Link>
          <Link href="/transparency">Transparency</Link>
        </div>
        <div className="footer-links-column">
          <h2>Connect</h2>
          <a href={`mailto:${organization.email}`}><Mail size={14} aria-hidden="true" /> {organization.email}</a>
          <a href={`tel:${organization.phoneHref}`}><Phone size={14} aria-hidden="true" /> {organization.phone}</a>
          <span className="footer-address"><MapPin size={14} aria-hidden="true" /> {organization.address}</span>
          <div className="footer-socials" aria-label="Social channels">
            {socialLinks.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}>{social.label}</a>)}
          </div>
        </div>
        <div className="footer-links-column footer-compliance">
          <h2>Transparency</h2>
          <p>Registration details, governance documents and audit filings.</p>
          <Link href="/transparency">See records and request documents <ArrowUpRight size={14} aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="footer-bottom container">
        <span>© {new Date().getFullYear()} {organization.legalName}</span>
        <nav aria-label="Legal policies">
          <Link href="/privacy-policy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refund-policy">Refund policy</Link>
        </nav>
        <span>Raniganj, Araria, Bihar, India</span>
      </div>
      <div className="photo-credit container">
        Illustrative community photographs: <a href="https://unsplash.com/@haseebmodi" target="_blank" rel="noreferrer">Haseeb Modi</a>, <a href="https://unsplash.com/@vitgar" target="_blank" rel="noreferrer">Vitaly Gariev</a>, <a href="https://unsplash.com/@kedige" target="_blank" rel="noreferrer">Vasanth Kedige</a> and <a href="https://unsplash.com/@rohitdey" target="_blank" rel="noreferrer">Rohit Dey</a> via Unsplash.
      </div>
    </footer>
  );
}
