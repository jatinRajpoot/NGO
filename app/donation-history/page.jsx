'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, Loader2, Printer } from 'lucide-react';
import PageHero from '../components/PageHero';

export default function PublicDonationHistoryPage() {
  const [query, setQuery] = useState('');
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const loadDonations = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/donations/?q=${encodeURIComponent(q)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setDonations(data.donations || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDonations('');
  }, [loadDonations]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadDonations(query);
  };

  return (
    <>
      <PageHero
        eyebrow="Public Transparency Ledger"
        title="Donation history & receipts."
        description="Search verified public donation receipts by Receipt Number, Donor Name, or Programme Purpose."
      />
      <section className="section-pad">
        <div className="container">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, maxWidth: 520, marginBottom: 24 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search receipt no (GSDD-RCP-...) or donor name..."
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1' }}
            />
            <button type="submit" className="button button-blue">
              <Search size={15} /> Search
            </button>
          </form>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} className="spin" /></div>
          ) : donations.length === 0 ? (
            <p style={{ color: '#64748b' }}>No matching verified donation records found.</p>
          ) : (
            <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: 12 }}>Receipt No</th>
                    <th style={{ padding: 12 }}>Donor Name</th>
                    <th style={{ padding: 12 }}>Purpose</th>
                    <th style={{ padding: 12 }}>Amount</th>
                    <th style={{ padding: 12 }}>Method</th>
                    <th style={{ padding: 12 }}>Date</th>
                    <th style={{ padding: 12 }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 12 }}><strong>{d.receiptNo}</strong></td>
                      <td style={{ padding: 12 }}>{d.donorName}</td>
                      <td style={{ padding: 12 }}>{d.purpose}</td>
                      <td style={{ padding: 12 }}><strong>Rs. {Number(d.amount).toLocaleString('en-IN')}</strong></td>
                      <td style={{ padding: 12 }}>{d.method}</td>
                      <td style={{ padding: 12 }}>{d.date}</td>
                      <td style={{ padding: 12 }}>
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(d)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedReceipt && (
            <div
              role="dialog"
              aria-modal="true"
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(15,23,42,0.7)',
                padding: 16,
              }}
              onClick={() => setSelectedReceipt(null)}
            >
              <div
                style={{ width: 'min(520px, 100%)', background: '#fff', borderRadius: 12, padding: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>OFFICIAL DONATION RECEIPT</h2>
                <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>
                  Global Skills &amp; Digital Development Foundation (CIN: U88900BR2026NPL086114)
                </p>
                <div style={{ display: 'grid', gap: 8, fontSize: 13, marginBottom: 18 }}>
                  <div><strong>Receipt No:</strong> {selectedReceipt.receiptNo}</div>
                  <div><strong>Donor:</strong> {selectedReceipt.donorName}</div>
                  <div><strong>Amount:</strong> Rs. {Number(selectedReceipt.amount).toLocaleString('en-IN')}</div>
                  <div><strong>Purpose:</strong> {selectedReceipt.purpose}</div>
                  <div><strong>Payment Method:</strong> {selectedReceipt.method}</div>
                  <div><strong>Date:</strong> {selectedReceipt.date}</div>
                  <div><strong>Verification Status:</strong> {selectedReceipt.status}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedReceipt(null)}
                    style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    Close
                  </button>
                  <button type="button" className="button button-blue" onClick={() => window.print()}>
                    <Printer size={15} /> Print Receipt
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
