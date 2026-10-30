import { redirect } from 'next/navigation';
import { getAdminSession } from '../lib/admin-auth';
import AdminDashboard from './dashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Dashboard | GSDD Foundation',
  description: 'GSDD Foundation operations dashboard.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const isAuthenticated = await getAdminSession();
  if (!isAuthenticated) {
    redirect('/admin/login/');
  }

  return <AdminDashboard />;
}
