import { readdirSync } from 'node:fs';
import path from 'node:path';
import PhotoGallery from '../components/PhotoGallery';
import PageHero from '../components/PageHero';

export const metadata = {
  title: 'Photo Gallery | GSDD Foundation',
  description: 'Browse photographs in the GSDD Foundation media gallery.',
};

const mediaDirectory = path.join(process.cwd(), 'public', 'media', 'gallery');
const imageNames = readdirSync(mediaDirectory)
  .filter((name) => /^IMG-\d{8}-WA\d+\.webp$/i.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const photosByDate = imageNames.reduce((groups, name) => {
  const dateMatch = name.match(/^IMG-(\d{4})(\d{2})(\d{2})-WA(\d+)\.webp$/i);
  if (!dateMatch) return groups;

  const [, year, month, day] = dateMatch;
  const dateKey = `${year}-${month}-${day}`;
  if (!groups.has(dateKey)) {
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    groups.set(dateKey, {
      dateLabel: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      photos: [],
    });
  }

  groups.get(dateKey).photos.push({
    src: `/media/gallery/${name}`,
    alt: `Gallery photograph from ${groups.get(dateKey).dateLabel}`,
  });
  return groups;
}, new Map());

export default function GalleryPage() {
  const dates = [...photosByDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, group]) => ({ dateKey, ...group }));

  return <>
    <PageHero
      eyebrow="Photo gallery"
      title="A window into our community."
      description={`${imageNames.length} photographs from the foundation’s media collection. Scroll to explore the gallery.`}
      image="/media/community-gathering.jpg"
      imageAlt="Community members gathered together"
    />
    <section className="gallery-page">
      <div className="container gallery-page-inner">
        <div className="gallery-page-intro">
          <p className="eyebrow"><span /> Shared moments</p>
          <h2>People, places and shared experiences.</h2>
          <p>Photos are grouped by the date in their filenames. Scroll down to load more.</p>
        </div>
        <PhotoGallery dates={dates} />
      </div>
    </section>
  </>;
}
