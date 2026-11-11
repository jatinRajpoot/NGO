import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminSession } from '../../../lib/admin-auth';
import {
  SOFTWARE_SECTIONS,
  getSoftwareSettings,
  isPanelUnlocked,
} from '../../../lib/admin-system-store';
import SoftwareUpdateSection from '../../sections/SoftwareUpdateSection';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Software Configuration | GSDD Admin',
  robots: { index: false, follow: false },
};

export default async function SoftwareSectionPage({ params }) {
  const { section } = await params;
  if (!SOFTWARE_SECTIONS.includes(section)) {
    notFound();
  }

  const authed = await getAdminSession();
  if (!authed) {
    redirect('/admin/login/');
  }

  const unlocked = await isPanelUnlocked();
  if (!unlocked) {
    redirect('/admin/');
  }

  const allSettings = await getSoftwareSettings();
  const initialData =
    section === 'reset-website' ? { lastResetAt: allSettings.lastResetAt } : allSettings[section];

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 20px' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/admin/" style={{ color: '#2563eb', fontWeight: 600, fontSize: 13 }}>
          &larr; Back to Admin Dashboard
        </Link>
      </div>
      <SoftwareUpdateSection
        initialSection={section}
        initialUnlocked={true}
        initialData={initialData}
      />
    </div>
  );
}
