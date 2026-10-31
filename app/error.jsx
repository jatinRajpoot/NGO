'use client';

import Link from 'next/link';

export default function ErrorPage({ reset }) {
  return <section className="section-pad public-listing-section">
    <div className="container">
      <div className="empty-state" role="alert">
        <p className="eyebrow">Page unavailable</p>
        <h1>We couldn’t load this page.</h1>
        <p className="empty-state-description">Please try again. If the problem continues, contact the foundation for help.</p>
        <button type="button" className="button button-blue" onClick={reset}>Try again</button>{' '}
        <Link className="text-link" href="/contact">Contact the foundation</Link>
      </div>
    </div>
  </section>;
}
