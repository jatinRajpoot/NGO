import EmptyState from '../components/EmptyState';
import PageHero from '../components/PageHero';

export const metadata = {
  title: 'Events | GSDD Foundation',
  description: 'Upcoming public events from Global Skills & Digital Development Foundation.',
};

export default function EventsPage() {
  return <>
    <PageHero eyebrow="Events" title="Meet, learn and take part." description="Public event details and registration information will be shared here when available." />
    <section className="section-pad public-listing-section">
      <div className="container"><EmptyState eyebrow="Upcoming events" title="No upcoming events are listed." description="There are no published dates, venues, fees or registration links at this time. Contact the foundation if you would like to ask about future events." actionLabel="Ask the foundation" actionHref="/contact" /></div>
    </section>
  </>;
}
