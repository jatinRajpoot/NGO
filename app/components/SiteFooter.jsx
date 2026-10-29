import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { organization, socialLinks } from '../data/site-data';

const usefulLinks = [
  ['About us', '/about'],
  ['Focus areas', '/core-areas'],
  ['Projects', '/projects'],
  ['Photo gallery', '/gallery'],
  ['News & updates', '/news'],
  ['Events', '/events'],
  ['Membership', '/membership'],
  ['Donate', '/donate'],
  ['Contact us', '/contact'],
  ['Transparency', '/transparency'],
];

export default function SiteFooter() {
  return <footer className="site-footer redesigned-site-footer">
    <div className="redesign-footer-contact">
      <div className="home-container redesign-footer-contact-grid">
        <div><MapPin size={20} aria-hidden="true" /><span><strong>Office address</strong><small>{organization.address}</small></span></div>
        <div><Phone size={20} aria-hidden="true" /><span><strong>Contact with us</strong><a href={`tel:${organization.phoneHref}`}>{organization.phone}</a></span></div>
        <div><Mail size={20} aria-hidden="true" /><span><strong>Email</strong><a href={`mailto:${organization.email}`}>{organization.email}</a></span></div>
      </div>
    </div>

    <div className="home-container redesign-footer-main">
      <div className="redesign-footer-about">
        <Link href="/" className="footer-brand">
          <Image src="/logo.png" alt="" width={52} height={52} />
          <span><strong>GSDD FOUNDATION</strong><small>{organization.legalName}</small></span>
        </Link>
        <p>{organization.tagline}</p>
        <p className="redesign-footer-location">A Section 8 organisation based in Raniganj, Araria, Bihar.</p>
      </div>
      <div className="redesign-footer-links">
        <h2>Useful links</h2>
        <div>{usefulLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</div>
      </div>
      <div className="redesign-footer-follow">
        <h2>Follow us</h2>
        <p>Connect with GSDD Foundation through our social channels.</p>
        <div className="footer-socials" aria-label="Social channels">
          {socialLinks.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noreferrer">{social.label}<ArrowUpRight size={12} aria-hidden="true" /></a>)}
        </div>
        <Link className="redesign-footer-join" href="/get-involved">Get involved <ArrowUpRight size={15} aria-hidden="true" /></Link>
      </div>
    </div>

    <div className="redesign-footer-bottom">
      <div className="home-container redesign-footer-bottom-inner">
        <span>© {new Date().getFullYear()} {organization.legalName}</span>
        <span>CIN {organization.cin} · NGO Darpan ID {organization.darpan}</span>
        <nav aria-label="Legal policies">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy-policy">Privacy</Link>
          <Link href="/refund-policy">Refund policy</Link>
        </nav>
      </div>
    </div>
    <p className="home-container redesign-photo-credit">Representative community imagery. Photo credits: <a href="https://unsplash.com/@haseebmodi" target="_blank" rel="noreferrer">Haseeb Modi</a>, <a href="https://unsplash.com/@vitgar" target="_blank" rel="noreferrer">Vitaly Gariev</a>, <a href="https://unsplash.com/@kedige" target="_blank" rel="noreferrer">Vasanth Kedige</a> and <a href="https://unsplash.com/@rohitdey" target="_blank" rel="noreferrer">Rohit Dey</a> via Unsplash. Images illustrate community themes and are not presented as records of foundation-led activities.</p>
  </footer>;
}
