import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import PageHero from '../components/PageHero';
import ProjectGallery from '../components/ProjectGallery';
import { projects } from '../data/site-data';

export const metadata = {
  title: 'Projects | GSDD Foundation',
  description: 'Explore illustrative project concepts based on the stated focus areas of Global Skills & Digital Development Foundation.',
};

export default function ProjectsPage() {
  return <>
    <PageHero eyebrow="Projects" title="Ideas for community-centred work." description="Explore illustrative programme concepts based on the foundation’s stated focus areas. No approved or operating project details were supplied for publication." image="/hero-bg.jpg" imageAlt="Children learning together in a village" actionLabel="Discuss a partnership" actionHref="/get-involved#partnerships" />
    <section className="section-pad projects-section">
      <div className="container">
        <div className="section-heading section-heading-row"><div><p className="eyebrow"><span /> Illustrative concepts</p><h2>From awareness to practical support.</h2></div><p>These are illustrative concepts, not verified or approved projects. Programme names, locations, dates, progress, budgets and public funding figures have not been supplied.</p></div>
        <div className="projects-grid">
          {projects.map((project) => <article className="project-card" key={project.number}>
            <div className="project-card-image"><Image src={project.image} alt="Illustrative image for this programme concept" fill sizes="(max-width: 700px) 100vw, 50vw" /><span className="project-number">{project.number}</span><span className="project-status project-status-concept">Illustrative concept</span></div>
            <div className="project-card-copy"><span className="project-area">{project.area}</span><h3>{project.title}</h3><p>{project.objective}</p><Link className="text-link" href={`/projects/${project.slug}`}>View concept details <ArrowRight size={15} aria-hidden="true" /></Link></div>
          </article>)}
        </div>
      </div>
    </section>
    <section className="section-pad gallery-section">
      <div className="container">
        <div className="section-heading section-heading-row"><div><p className="eyebrow"><span /> Moments of transformation</p><h2>Focus areas in pictures.</h2></div><p>Browse illustrative images by program theme, then follow official channels for GSDD Foundation updates.</p></div>
        <ProjectGallery />
        <div className="gallery-social-links"><a href="https://www.youtube.com/@gsddfoundation" target="_blank" rel="noreferrer">Official YouTube updates <ArrowRight size={15} aria-hidden="true" /></a><a href="https://www.instagram.com/gsddfoundation" target="_blank" rel="noreferrer">Official Instagram <ArrowRight size={15} aria-hidden="true" /></a></div>
      </div>
    </section>
  </>;
}
