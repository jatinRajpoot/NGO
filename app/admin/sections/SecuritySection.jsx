'use client';

import AdminProfile from '../profile/AdminProfile';
import { Lock, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

export default function SecuritySection({ notify }) {
  return (
    <div className="adm-sec">
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Security &amp; Password Management</h2>
          <p>Update administrator credentials, manage session cryptographic signatures, and review portal security controls.</p>
        </div>
      </div>

      {/* Embedded Live Tested AdminProfile Component */}
      <AdminProfile onPasswordChanged={() => notify?.('Password updated successfully.')} />
    </div>
  );
}
