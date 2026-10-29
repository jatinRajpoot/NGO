import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: 'not-published' }];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: `Campaign information | GSDD Foundation`, description: `No public campaign details have been published for ${slug}.` };
}

export default function CampaignDetailPage() {
  notFound();
}
