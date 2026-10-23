import './globals.css';

export const metadata = {
  title: 'Global Skills & Digital Development Foundation (GSDD FOUNDATION)',
  description: 'Empowering People. Developing Skills. Transforming Communities. Section 8 Non-Profit Organization, Govt. Registered & Darpan Verified.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
