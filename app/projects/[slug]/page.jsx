import Link from 'next/link';
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';
import PageHero from '../../components/PageHero';
import { projects } from '../../data/site-data';

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  return {
    title: project ? `${project.title} | GSDD Foundation` : 'Programme not found | GSDD Foundation',
    description: project?.objective || 'No public programme details are available for this address.',
  };
}

export default async function ProjectDetailPage({ params }) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);

  if (!project) notFound();

  return <>
    <PageHero eyebrow="Illustrative programme concept" title={project.title} description={project.objective} image={project.image} imageAlt="Illustrative image for this programme concept" actionLabel={project.cta} actionHref="/get-involved#partnerships" />
    <section className="section-pad project-detail-section">
      <div className="container project-detail-layout">
        <div className="project-detail-main">
          <p className="eyebrow"><span /> {project.area}</p>
          <h2>What this concept describes</h2>
          <p>{project.objective}</p>
          <p>This concept is illustrative and based on a stated focus area. It does not confirm an approved, active, funded, or completed project.</p>
          <Link className="text-link" href="/projects"><ArrowLeft size={15} aria-hidden="true" /> Back to projects</Link>
        </div>
        <aside className="project-detail-facts" aria-label="Public programme information">
          <span className="project-detail-status">Illustrative concept</span>
          <h3>Public information</h3>
          <p><MapPin size={16} aria-hidden="true" /> Project location has not been supplied.</p>
          <dl><div><dt>Approved project details</dt><dd>Not supplied</dd></div><div><dt>Dates and progress</dt><dd>Not supplied</dd></div><div><dt>Funding and utilisation</dt><dd>No public figures supplied</dd></div></dl>
          <p className="form-caption">No beneficiary details or internal financial records are displayed.</p>
          <Link className="button button-outline-blue" href="/contact">Ask about this programme <ArrowRight size={15} aria-hidden="true" /></Link>
        </aside>
      </div>
    </section>
  </>;
}
