// Centralized API Client connecting Next.js Frontend to Flask + MySQL Backend

const API_BASE = typeof window !== 'undefined'
  ? '' // In the browser, relative path uses Next.js rewrites to proxy to Flask backend
  : (process.env.FLASK_API_URL || 'http://127.0.0.1:5000');

export const apiClient = {
  // 1. Certificates & Statutory Recipient Hub
  async getCertificate(id) {
    const res = await fetch(`${API_BASE}/api/v1/certificates/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Certificate lookup failed: ${res.status}`);
    return await res.json();
  },

  async searchCertificates(query) {
    const res = await fetch(`${API_BASE}/api/v1/certificates?search=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Certificate search failed: ${res.status}`);
    return await res.json();
  },

  async getCertificatesByEmail(email) {
    const res = await fetch(`${API_BASE}/api/v1/certificates?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error(`Certificate email lookup failed: ${res.status}`);
    return await res.json();
  },

  async verifyCertificate(payload) {
    const res = await fetch(`${API_BASE}/api/v1/certificates/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  // 2. Members Management & ID Cards
  async getMembers() {
    const res = await fetch(`${API_BASE}/api/v1/members`);
    if (!res.ok) throw new Error(`Members fetch failed: ${res.status}`);
    return await res.json();
  },

  async registerMember(payload) {
    const res = await fetch(`${API_BASE}/api/v1/members/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async getMemberIdCard(memberId) {
    const res = await fetch(`${API_BASE}/api/v1/members/${encodeURIComponent(memberId)}/id-card`);
    if (!res.ok) throw new Error(`Member ID card fetch failed: ${res.status}`);
    return await res.json();
  },

  // 3. Donors & 80G Statutory Donations
  async donate(payload) {
    const res = await fetch(`${API_BASE}/api/v1/donors/donate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async getDonorHistory(email) {
    const res = await fetch(`${API_BASE}/api/v1/donors/history?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error(`Donor history failed: ${res.status}`);
    return await res.json();
  },

  async updateRecurringStatus(donationId, status) {
    const res = await fetch(`${API_BASE}/api/v1/donors/recurring/${encodeURIComponent(donationId)}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return await res.json();
  },

  // 4. Team Members & Directory
  async getTeamMembers() {
    const res = await fetch(`${API_BASE}/api/v1/team/members`);
    if (!res.ok) throw new Error(`Team fetch failed: ${res.status}`);
    return await res.json();
  },

  async updateTeamPhoto(id, photoUrl) {
    const res = await fetch(`${API_BASE}/api/v1/team/members/${encodeURIComponent(id)}/update-photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_url: photoUrl }),
    });
    return await res.json();
  },
};
