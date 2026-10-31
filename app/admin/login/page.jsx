import { redirect } from 'next/navigation';
import { getAdminSession } from '../../lib/admin-auth';
import LoginForm from './LoginForm';
import './login.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Sign In | GSDD Foundation',
  description: 'Sign in to access the GSDD Foundation administration dashboard.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage() {
  const isAuthenticated = await getAdminSession();
  if (isAuthenticated) {
    redirect('/admin/');
  }

  return (
    <div className="admin-login-root">
      <LoginForm />
    </div>
  );
}
