import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MapPin } from 'lucide-react';
import PageHero from '../components/PageHero';
import ProjectGallery from '../components/ProjectGallery';
import { projects } from '../data/site-data';

export const metadata = {
  title: 'Projects & Activities | GSDD Foundation',
  description: 'Explore GSDD Foundation’s planned field initiatives in digital literacy, women’s livelihoods, public service awareness and preventive health.',
};

export default function ProjectsPage() {
  return <>
    <PageHero eyebrow="Projects & activities" title="Field initiatives shaped around local priorities." description="Flagship initiatives are being prepared across digital empowerment, women’s livelihoods, government scheme awareness, and preventive health." image="/hero-bg.jpg" imageAlt="Children learning together in a village" actionLabel="Partner with us" actionHref="/get-involved#partnerships" />
    <section className="section-pad projects-section">
      <div className="container">
        <div className="section-heading section-heading-row"><div><p className="eyebrow"><span /> Flagship field initiatives</p><h2>From awareness to practical support.</h2></div><p>Program descriptions below outline proposed areas of work and planned locations. They do not claim completed or currently operating projects.</p></div>
        <div className="projects-grid">
          {projects.map((project) => <article className="project-card" key={project.number}>
            <div className="project-card-image"><Image src={project.image} alt="" fill sizes="(max-width: 700px) 100vw, 50vw" /><span className="project-number">{project.number}</span><span className="project-status">Program direction</span></div>
            <div className="project-card-copy"><span className="project-area">{project.area}</span><h3>{project.title}</h3><p className="project-location"><MapPin size={14} aria-hidden="true" /> {project.location}</p><p>{project.objective}</p><Link className="text-link" href="/get-involved#partnerships">{project.cta} <ArrowRight size={15} aria-hidden="true" /></Link></div>
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
