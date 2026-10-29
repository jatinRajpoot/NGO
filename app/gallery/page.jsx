import { readdirSync } from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import PageHero from '../components/PageHero';

export const metadata = {
  title: 'Photo Gallery | GSDD Foundation',
  description: 'Browse photographs in the GSDD Foundation media gallery.',
};

const mediaDirectory = path.join(process.cwd(), 'Media');
const imageNames = readdirSync(mediaDirectory)
  .filter((name) => /^IMG-\d{8}-WA\d+\.jpg$/i.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const photosByDate = imageNames.reduce((groups, name, index) => {
  const dateMatch = name.match(/^IMG-(\d{4})(\d{2})(\d{2})-WA(\d+)\.jpg$/i);
  if (!dateMatch) return groups;

  const [, year, month, day, photoNumber] = dateMatch;
  const dateKey = `${year}-${month}-${day}`;
  if (!groups.has(dateKey)) {
    groups.set(dateKey, {
      date: new Date(Number(year), Number(month) - 1, Number(day)),
      photos: [],
    });
  }

  groups.get(dateKey).photos.push({
    src: `/media/gallery/${name.replace(/\.jpg$/i, '.webp')}`,
    alt: `Photo ${photoNumber} from ${Number(day)} ${new Date(Number(year), Number(month) - 1).toLocaleString('en-IN', { month: 'long' })} ${year}`,
    label: `Photo ${String(index + 1).padStart(3, '0')}`,
  });
  return groups;
}, new Map());

export default function GalleryPage() {
  const dates = [...photosByDate.entries()].sort(([a], [b]) => b.localeCompare(a));

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
        {dates.map(([dateKey, group]) => <section className="gallery-date-group" key={dateKey} aria-labelledby={`gallery-date-${dateKey}`}>
          <div className="gallery-date-heading">
            <h3 id={`gallery-date-${dateKey}`}>{group.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            <span>{group.photos.length} photos</span>
          </div>
          <div className="gallery-page-grid">
            {group.photos.map((photo) => <figure className="gallery-page-card" key={photo.src}>
              <div className="gallery-page-image">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
                />
              </div>
              <figcaption>{photo.label}</figcaption>
            </figure>)}
          </div>
        </section>)}
      </div>
    </section>
  </>;
}
