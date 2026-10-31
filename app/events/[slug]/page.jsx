import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: 'not-published' }];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: 'Event information | GSDD Foundation', description: `No public event details have been published for ${slug}.` };
}

export default function EventDetailPage() {
  notFound();
}
