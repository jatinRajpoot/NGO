'use client';

export default function MobileNavigation({ children }) {
  function closeAfterNavigation(event) {
    if (event.target?.closest?.('a')) {
      event.currentTarget.closest('details')?.removeAttribute('open');
    }
  }

  return (
    <details className="mobile-nav">
      <summary aria-label="Toggle navigation menu">
        <span className="mobile-nav-line" aria-hidden="true" />
        <span className="mobile-nav-line" aria-hidden="true" />
        <span className="mobile-nav-line" aria-hidden="true" />
        <span className="sr-only">Menu</span>
      </summary>
      <nav aria-label="Mobile navigation" onClick={closeAfterNavigation}>
        {children}
      </nav>
    </details>
  );
}
