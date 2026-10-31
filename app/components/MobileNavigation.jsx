'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export default function MobileNavigation({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const detailsRef = useRef(null);
  const summaryRef = useRef(null);
  const navRef = useRef(null);
  const pathname = usePathname();

  // Close drawer when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle escape key & focus restoration
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        summaryRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle click outside to dismiss
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event) {
      if (detailsRef.current && !detailsRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  // Focus trap / keyboard cycling within mobile navigation when open
  const handleKeyDown = useCallback(
    (event) => {
      if (!isOpen || event.key !== 'Tab') return;

      const details = detailsRef.current;
      const summary = summaryRef.current;
      if (!details || !summary) return;

      // Get all focusable elements inside details that are visible
      const focusables = Array.from(
        details.querySelectorAll(
          'summary, a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => {
        // Must not be within another closed details element
        const ancestorDetails = el.closest('details:not([open])');
        if (ancestorDetails && ancestorDetails !== details &&
            !(el.tagName === 'SUMMARY' && el.parentElement === ancestorDetails)) {
          return false;
        }
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
      });

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    [isOpen]
  );

  // Close when an anchor link is clicked inside nav
  function handleNavClick(event) {
    const anchor = event.target?.closest?.('a');
    if (anchor) {
      setIsOpen(false);
    }
  }

  function handleToggle(event) {
    setIsOpen(event.currentTarget.open);
  }

  return (
    <details
      ref={detailsRef}
      className="mobile-nav"
      open={isOpen}
      onToggle={handleToggle}
      onKeyDown={handleKeyDown}
    >
      <summary
        ref={summaryRef}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
      >
        <span className="mobile-nav-line" aria-hidden="true" />
        <span className="mobile-nav-line" aria-hidden="true" />
        <span className="mobile-nav-line" aria-hidden="true" />
        <span className="sr-only">{isOpen ? 'Close menu' : 'Menu'}</span>
      </summary>
      <nav
        id="mobile-nav-panel"
        ref={navRef}
        aria-label="Mobile navigation"
        onClick={handleNavClick}
      >
        {children}
      </nav>
    </details>
  );
}
