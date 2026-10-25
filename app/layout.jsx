import './globals.css';
import { MessageCircle } from 'lucide-react';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import { organization } from './data/site-data';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: organization.legalName,
  alternateName: organization.shortName,
  url: 'https://gsddfoundation.org',
  email: organization.email,
  telephone: organization.phone,
  description: organization.tagline,
  address: {
    '@type': 'PostalAddress',
    streetAddress: organization.address,
    addressLocality: 'Raniganj, Araria',
    addressRegion: 'Bihar',
    addressCountry: 'IN',
  },
  identifier: [
    { '@type': 'PropertyValue', propertyID: 'CIN', value: organization.cin },
    { '@type': 'PropertyValue', propertyID: 'NITI Aayog NGO Darpan ID', value: organization.darpan },
    { '@type': 'PropertyValue', propertyID: 'Section 12A', value: organization.tax12a },
    { '@type': 'PropertyValue', propertyID: 'Section 80G', value: organization.tax80g },
    { '@type': 'PropertyValue', propertyID: 'PAN', value: organization.pan },
    { '@type': 'PropertyValue', propertyID: 'TAN', value: organization.tan },
    { '@type': 'PropertyValue', propertyID: 'MSME / Udyam', value: organization.udyam },
  ],
};

export const metadata = {
  metadataBase: new URL('https://gsddfoundation.org'),
  title: 'GSDD Foundation | Empowering People. Developing Skills.',
  description: 'Global Skills & Digital Development Foundation supports education, skill development, digital inclusion, health awareness, women’s empowerment and community welfare.',
  icons: { icon: '/logo.png', apple: '/logo.png' },
  openGraph: {
    title: 'GSDD Foundation',
    description: 'Empowering People. Developing Skills. Transforming Communities.',
    siteName: 'GSDD Foundation',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c') }} />
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <a className="floating-whatsapp" href="https://wa.me/919546752915" target="_blank" rel="noreferrer" aria-label="Chat with GSDD Foundation on WhatsApp"><MessageCircle size={21} aria-hidden="true" /><span>Chat with us</span></a>
      </body>
    </html>
  );
}
