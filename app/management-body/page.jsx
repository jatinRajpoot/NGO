import PageHero from '../components/PageHero';
import { listManagementBody } from '../lib/membership-suite-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Management Body | GSDD Foundation',
  description: 'Governing trustees and leadership directory of Global Skills & Digital Development Foundation.',
};

export default async function ManagementBodyPage() {
  const leaders = await listManagementBody({ publicOnly: true });

  return (
    <>
      <PageHero
        eyebrow="Leadership & Governance"
        title="Foundation management body."
        description="Meet the trustees, coordinators, and advisory committee members guiding GSDD Foundation's programmes."
      />
      <section className="section-pad">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
            {leaders.map((leader) => (
              <article key={leader.id} style={{ background: '#fff', border: '1px solid #e6e2d8', borderRadius: 12, padding: 22 }}>
                <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
                  {leader.designation}
                </span>
                <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>{leader.name}</h2>
                <p style={{ margin: 0, fontSize: 13.5, color: '#475569', lineHeight: 1.65 }}>
                  {leader.about}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
