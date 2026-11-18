// Use the same Next.js verification and authenticated account APIs as the site.
async function request(url, options) {
  const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin', ...options });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}
function certificate(document) {
  return { ...document, id: document.code, issue_date: document.date, is_verified_official: true };
}
export const apiClient = {
  async getCertificate(id) {
    const data = await request(`/api/certificates/verify/?code=${encodeURIComponent(id)}`);
    return data.verified && data.document ? { certificate: certificate(data.document) } : {};
  },
  async verifyCertificate({ id, code }) {
    const data = await request('/api/certificates/verify/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code || id }) });
    return { is_authentic: Boolean(data.verified), certificate: data.verified && data.document ? certificate(data.document) : null };
  },
  async getCertificatesByEmail(email) {
    const data = await request('/api/member/me/');
    if (!data.member || data.member.email.toLowerCase() !== email.trim().toLowerCase()) throw new Error('Sign in to your own account to view certificates');
    return { certificates: data.member.certificates || [] };
  },
};
