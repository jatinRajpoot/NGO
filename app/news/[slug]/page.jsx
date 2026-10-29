import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: 'not-published' }];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: 'News article | GSDD Foundation', description: `No public article has been published for ${slug}.` };
}

export default function NewsDetailPage() {
  notFound();
}
