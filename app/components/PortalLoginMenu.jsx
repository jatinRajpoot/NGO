'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowDown } from 'lucide-react';
import Link from 'next/link';

const loginRoles = [
  { label: 'Management Login', href: '/admin/' },
  { label: 'Coordinator Login' },
];

export default function PortalLoginMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const detailsRef = useRef(null);
  const summaryRef = useRef(null);
  const menuRef = useRef(null);
  const pathname = usePathname() || '/';

  const isAdminActive = pathname.startsWith('/admin');

  // Close on pathname change
  useEffect(() => {
    setIsOpen(false);
    setIsDismissed(false);
  }, [pathname]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (detailsRef.current && !detailsRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsDismissed(false);
      }
    }

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen]);

  function handleToggle(event) {
    setIsOpen(event.currentTarget.open);
    if (event.currentTarget.open) {
      setIsDismissed(false);
    }
  }

  function handleSummaryKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      }
      setIsDismissed(false);
      setTimeout(() => {
        const firstFocusable = menuRef.current?.querySelector('a, button:not([disabled])');
        firstFocusable?.focus();
      }, 0);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      setIsDismissed(true);
      summaryRef.current?.focus();
    }
  }

  function handleMenuKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      setIsDismissed(true);
      summaryRef.current?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const focusables = Array.from(
        menuRef.current?.querySelectorAll('a, button:not([disabled])') || []
      );
      const currentIndex = focusables.indexOf(document.activeElement);
      if (event.key === 'ArrowDown') {
        const nextIndex = (currentIndex + 1) % focusables.length;
        focusables[nextIndex]?.focus();
      } else {
        if (currentIndex <= 0) {
          summaryRef.current?.focus();
        } else {
          focusables[currentIndex - 1]?.focus();
        }
      }
    }
  }

  function handleBlur(event) {
    if (!detailsRef.current?.contains(event.relatedTarget)) {
      setIsOpen(false);
      setIsDismissed(false);
    }
  }

  return (
    <details
      ref={detailsRef}
      className="nav-item nav-dropdown portal-login-menu"
      open={isOpen}
      onToggle={handleToggle}
      onBlur={handleBlur}
      onMouseLeave={() => setIsDismissed(false)}
    >
      <summary
        ref={summaryRef}
        className="nav-link"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-current={isAdminActive ? 'page' : undefined}
        onKeyDown={handleSummaryKeyDown}
      >
        Login <ArrowDown size={12} strokeWidth={2.5} aria-hidden="true" />
      </summary>
      <div
        ref={menuRef}
        className="nav-dropdown-menu portal-login-options"
        style={{ display: isOpen && !isDismissed ? 'grid' : 'none' }}
        role="menu"
        aria-label="Portal logins"
        onKeyDown={handleMenuKeyDown}
      >
        {loginRoles.map(({ label, href }) => {
          const isItemActive = href && (pathname === href || pathname.startsWith(href));
          return (
            <div className="portal-login-option" key={label} role="none">
              {href ? (
                <Link
                  href={href}
                  role="menuitem"
                  aria-current={isItemActive ? 'page' : undefined}
                  className={isItemActive ? 'active' : undefined}
                  onClick={() => {
                    setIsOpen(false);
                    setIsDismissed(false);
                  }}
                >
                  {label}
                </Link>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  disabled
                  aria-disabled="true"
                >
                  {label}
                </button>
              )}
              {!href && <span className="portal-coming-soon">Coming soon</span>}
            </div>
          );
        })}
      </div>
    </details>
  );
}
