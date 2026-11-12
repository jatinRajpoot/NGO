import { Calendar, Newspaper } from 'lucide-react';
import PageHero from '../components/PageHero';
import EmptyState from '../components/EmptyState';
import { listNews } from '../lib/posts-store';
import '../components/public-posts.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'News & Updates | GSDD Foundation',
  description: 'Public news and updates from Global Skills & Digital Development Foundation.',
};

function normalizeNewsImageUrl(src) {
  const clean = String(src || '').trim();
  if (!clean) return '';
  if (clean.startsWith('/api/') && !clean.endsWith('/') && !clean.includes('?')) {
    return `${clean}/`;
  }
  return clean;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(iso);
  }
}

export default async function NewsPage() {
  const newsItems = await listNews({ type: 'active' });

  return (
    <>
      <PageHero
        eyebrow="News & updates"
        title="Stories from the foundation."
        description="Verified news and announcements from the foundation will be shared here when available."
      />
      <section className="section-pad public-listing-section">
        <div className="container">
          {newsItems.length === 0 ? (
            <EmptyState
              eyebrow="Latest updates"
              title="No news has been published yet."
              description="Contact the foundation for current information about its work and opportunities to get involved."
              actionLabel="Contact the foundation"
              actionHref="/contact"
            />
          ) : (
            <div className="posts-card-list">
              {newsItems.map((item) => {
                const imgSrc = normalizeNewsImageUrl(item.image?.src);
                return (
                  <article key={item.id} className="post-feed-card">
                    {imgSrc && (
                      <div className="post-card-media">
                        <div className="post-card-hero-btn" style={{ cursor: 'default' }}>
                          <img src={imgSrc} alt={item.title} loading="lazy" />
                        </div>
                      </div>
                    )}
                    <div className="post-card-body">
                      <div className="post-card-meta">
                        <span className="post-type-badge is-news">
                          <Newspaper size={12} aria-hidden="true" /> News &amp; Update
                        </span>
                        <span className="post-card-date">
                          <Calendar size={12} aria-hidden="true" /> {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <h2 className="post-card-title">{item.title}</h2>
                      <p className="post-richtext" style={{ whiteSpace: 'pre-line' }}>
                        {item.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
