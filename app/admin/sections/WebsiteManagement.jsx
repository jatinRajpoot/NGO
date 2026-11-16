'use client';

import { useEffect, useState } from 'react';
import GalleryManager from '../GalleryManager';
import BeneficiariesSupportSection from './BeneficiariesSupportSection';
import DonationManagement from './DonationManagement';
import AdminUnavailable from './AdminUnavailable';

export default function WebsiteManagement({ notify, initialTab = 'gallery' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);
  return <div className="adm-sec">
    <div className="adm-sec-header"><div className="adm-sec-title-wrap"><h2>Website Management</h2><p>Manage the photo gallery and access received enquiries and donations.</p></div></div>
    <div className="adm-tabs" role="tablist" aria-label="Website management">
      {[['gallery', 'Photo Gallery'], ['enquiries', 'Visitor Enquiries'], ['donations', 'Visitor Donations'], ['pages', 'Page Content'], ['social', 'Social Links']].map(([id, title]) =>
        <button type="button" role="tab" aria-selected={activeTab === id} key={id} className={`adm-tab${activeTab === id ? ' active' : ''}`} onClick={() => setActiveTab(id)}>{title}</button>)}
    </div>
    {activeTab === 'gallery' && <GalleryManager />}
    {activeTab === 'enquiries' && <BeneficiariesSupportSection initialSection="enquiries" notify={notify} />}
    {activeTab === 'donations' && <DonationManagement notify={notify} />}
    {activeTab === 'pages' && <AdminUnavailable title="Page content" message="Editing website page content is currently unavailable in this dashboard." />}
    {activeTab === 'social' && <AdminUnavailable title="Social links" message="Editing public social links is currently unavailable in this dashboard." />}
  </div>;
}
