import EmptyState from '../components/EmptyState';
import PageHero from '../components/PageHero';
import PhotoGallery from '../components/PhotoGallery';
import { listGalleryPhotos } from '../lib/gallery-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Photo Gallery | GSDD Foundation',
  description: 'Browse photographs in the GSDD Foundation media gallery.',
};

export default async function GalleryPage({ searchParams }) {
  let photos = [];
  let isUnavailable = false;

  try {
    photos = await listGalleryPhotos();
    if (!Array.isArray(photos)) {
      photos = [];
    }
  } catch (error) {
    console.error('Failed to load gallery photos:', error);
    isUnavailable = true;
    photos = [];
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const pageParameter = resolvedSearchParams.page;
  const rawPage = typeof pageParameter === 'string' && /^\d+$/.test(pageParameter)
    ? Number(pageParameter) : 1;
  const initialPage = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const photosByDate = new Map();

  for (const photo of photos) {
    if (!photo || !photo.src) continue;

    let dateKey = 'undated';
    let dateLabel = 'Other moments';

    if (typeof photo.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(photo.date.trim())) {
      dateKey = photo.date.trim();
      const [year, month, day] = dateKey.split('-').map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day));
      dateLabel = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'UTC',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(dateObj);
    }

    if (!photosByDate.has(dateKey)) {
      photosByDate.set(dateKey, {
        dateLabel,
        photos: [],
      });
    }

    photosByDate.get(dateKey).photos.push({
      id: photo.id || photo.src,
      src: photo.src,
      alt: photo.alt || `Gallery photograph from ${dateLabel}`,
      date: photo.date,
    });
  }

  const dates = [...photosByDate.entries()]
    .sort(([a], [b]) => {
      if (a === 'undated') return 1;
      if (b === 'undated') return -1;
      return b.localeCompare(a);
    })
    .map(([dateKey, group]) => ({ dateKey, ...group }));

  const photoCount = photos.length;
  const heroDescription = isUnavailable
    ? 'Photographs from the foundation’s media collection.'
    : photoCount === 1
    ? '1 photograph from the foundation’s media collection. Scroll to explore the gallery.'
    : photoCount > 0
    ? `${photoCount} photographs from the foundation’s media collection. Scroll to explore the gallery.`
    : 'Photographs from the foundation’s media collection.';

  return (
    <>
      <PageHero
        eyebrow="Photo gallery"
        title="A window into our community."
        description={heroDescription}
        image="/media/community-gathering.jpg"
        imageAlt="Community members gathered together"
      />
      <section className="gallery-page">
        <div className="container gallery-page-inner">
          {isUnavailable ? (
            <EmptyState
              eyebrow="Media gallery"
              title="Gallery temporarily unavailable"
              description="The photo collection could not be loaded at this time. Please check back shortly."
              actionLabel="Return to home"
              actionHref="/"
            />
          ) : photoCount === 0 ? (
            <EmptyState
              eyebrow="Media gallery"
              title="No photographs published yet"
              description="There are currently no photos in the media gallery. Please check back soon for updates from our programmes."
              actionLabel="Explore focus areas"
              actionHref="/core-areas"
            />
          ) : (
            <>
              <div className="gallery-page-intro">
                <p className="eyebrow">
                  <span /> Shared moments
                </p>
                <h2>People, places and shared experiences.</h2>
                <p>Photos are grouped by date. Scroll down to explore the collection.</p>
              </div>
              <PhotoGallery dates={dates} initialPage={initialPage} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
