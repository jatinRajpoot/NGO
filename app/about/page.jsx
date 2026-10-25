import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Quote } from 'lucide-react';
import PageHero from '../components/PageHero';
import { aims, organization, visionPillars } from '../data/site-data';

export const metadata = {
  title: 'About GSDD Foundation',
  description: 'Learn about GSDD Foundation, its mission, vision, goals, 13 aims and founding leadership.',
};

export default function AboutPage() {
  return <>
    <PageHero eyebrow="About GSDD Foundation" title="Opportunity grows when communities can shape their own next step." description="Our work brings people, practical learning and useful information together in support of inclusive community development." image="/images/rural-community.jpg" imageAlt="Women and children gathered in a rural community" actionLabel="Explore our work" actionHref="/core-areas" />
    <section className="section-pad" id="foundation">
      <div className="container about-story-grid">
        <div className="about-story-image"><Image src="/hero-bg.jpg" alt="Children studying and reading together in a village" fill sizes="(max-width: 800px) 100vw, 42vw" /><span className="image-caption">Headquartered in Araria, Bihar</span></div>
        <div className="about-story-copy">
          <p className="eyebrow"><span /> About our foundation</p>
          <h2>Building access, confidence and community opportunity.</h2>
          <p>Global Skills &amp; Digital Development Foundation (GSDD FOUNDATION) is a non-profit organization dedicated to advancing social development, educational awareness, healthcare awareness, digital literacy, skill development, women empowerment, livelihood opportunities, environmental sustainability, and community welfare.</p>
          <p>Our foundation strives to bridge the gap between underserved communities and meaningful opportunities by promoting access to knowledge, essential information, skill-based learning, employment-oriented development, and awareness of applicable government welfare schemes and public services.</p>
          <p>We believe that sustainable development begins with empowered individuals and informed communities. With this vision, we aim to facilitate initiatives that encourage self-reliance, strengthen community participation, promote digital inclusion, and contribute to improving the overall quality of life.</p>
          <p>Through grassroots engagement, field-level initiatives, awareness campaigns, training programmes, digital solutions, and strategic partnerships, GSDD FOUNDATION seeks to address community needs and support inclusive, sustainable, and long-term social progress across India.</p>
          <p>We recognize the importance of collaboration in achieving meaningful development. Therefore, we welcome opportunities to work with NGOs, CSR organizations, corporate partners, educational institutions, healthcare providers, government bodies, community-based organizations, and other development stakeholders who share our commitment to social welfare and inclusive growth.</p>
          <p>Our approach is guided by integrity, inclusivity, accountability, collaboration, and social responsibility. We aspire to build stronger communities by encouraging participation, expanding access to opportunities, and supporting initiatives that create lasting positive change.</p>
        </div>
      </div>
    </section>

    <section className="section-pad mission-vision-section" id="mission">
      <div className="container">
        <div className="section-heading section-heading-centered"><p className="eyebrow"><span /> Our mission</p><h2>Creating opportunities.<br />Empowering communities. Transforming lives.</h2><p>We contribute to sustainable development through education, social welfare, public awareness and inclusive growth.</p></div>
        <div className="mission-copy">
          <p>At GLOBAL SKILLS &amp; DIGITAL DEVELOPMENT FOUNDATION, our mission is to contribute to the sustainable development of society by promoting education, social welfare, community empowerment, public awareness, and inclusive growth.</p>
          <p>We are committed to encouraging meaningful initiatives that address community needs, create awareness, strengthen individual capabilities, and expand access to opportunities for people from diverse backgrounds.</p>
          <p>Through community engagement, educational initiatives, survey and awareness projects, youth empowerment, skill development, and strategic collaboration, we strive to support positive social change and contribute to the overall development of society.</p>
          <p>We aim to build a responsible, inclusive, and people-centred approach to development by encouraging active participation, ethical practices, transparency, and collective responsibility.</p>
          <p>Our mission is to connect people with opportunities, empower communities with knowledge, encourage self-reliance, and promote a culture of service, dignity, equality, and social responsibility.</p>
          <p>We believe that sustainable progress is achieved when individuals, communities, institutions, and organizations work together towards a common purpose. Every initiative represents our commitment to a better future, stronger communities, and a more inclusive society.</p>
          <strong className="statement-line">Our mission is to empower people, strengthen communities, and contribute to meaningful and sustainable social development.</strong>
        </div>
      </div>
    </section>

    <section className="section-pad vision-section" id="vision">
      <div className="container vision-grid">
        <div className="vision-copy">
          <p className="eyebrow"><span /> Our vision</p>
          <h2>Building an inclusive, empowered, and sustainable society.</h2>
          <p>We envision a future in which education, awareness, social responsibility, and equal opportunities serve as the foundation for sustainable community development. We aspire to encourage positive social transformation by supporting initiatives that strengthen communities, empower youth, promote social welfare, and improve access to development opportunities.</p>
          <p>Our vision is to create a society where knowledge inspires progress, collaboration drives innovation, and collective efforts lead to meaningful and lasting change. We aim to encourage active participation from individuals, communities, institutions, and organizations in addressing social challenges and advancing the common good.</p>
          <p>Through integrity, inclusivity, transparency, and responsible action, we seek to contribute to stronger communities and a more equitable future for generations to come.</p>
          <blockquote>“To envision a society where every individual is empowered, every community is strengthened, and every opportunity contributes to a more inclusive, equitable, and sustainable future.”</blockquote>
        </div>
        <div className="vision-pillar-panel">
          <span className="panel-index">Our vision · 5 pillars</span>
          {visionPillars.map(([title, description], index) => <div className="vision-pillar" key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{description}</p></div></div>)}
        </div>
      </div>
    </section>

    <section className="section-pad goal-section" id="goal">
      <div className="container goal-inner"><p className="eyebrow"><span /> Our goal</p><h2>Advancing inclusive growth and sustainable community development.</h2><div className="goal-copy"><p>The goal of Global Skills &amp; Digital Development Foundation is to contribute to the socio-economic development of India by empowering rural and underserved communities through skill development, healthcare awareness, digital inclusion, livelihood enhancement, and access to essential services and opportunities.</p><p>We strive to strengthen individual capabilities, promote self-reliance, facilitate access to relevant information and development opportunities, and encourage community participation in sustainable development initiatives.</p><p>Through strategic collaborations, capacity-building programmes, awareness initiatives, and community-focused interventions, we aim to support inclusive growth, improve livelihood prospects, and foster resilient communities.</p><p>Our long-term goal is to contribute towards building an equitable, digitally empowered, and self-reliant society where individuals have greater opportunities to improve their quality of life and actively participate in the nation’s development.</p></div><p className="goal-statement">Empowering communities, expanding opportunities, and advancing sustainable development across India.</p></div>
    </section>

    <section className="section-pad aims-section" id="aims">
      <div className="container">
        <div className="section-heading section-heading-row"><div><p className="eyebrow"><span /> Our aims</p><h2>Thirteen ways we work toward inclusive social development.</h2></div><p>The foundation aims to improve quality of life by encouraging access to education, healthcare awareness, skill development, digital services, livelihood opportunities and sustainable development.</p></div>
        <div className="aims-grid">{aims.map(([title, description], index) => <article className="aim-card" key={title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
        <p className="aims-summary">Our overall aim is to contribute towards an educated, healthy, digitally empowered, skilled, self-reliant, and inclusive society by expanding access to opportunities and supporting sustainable community development across India.</p>
      </div>
    </section>

    <section className="section-pad leadership-section" id="leadership">
      <div className="container">
        <div className="section-heading section-heading-centered"><p className="eyebrow"><span /> Leadership</p><h2>Founders guiding the work.</h2><p>Founding leadership of {organization.legalName}.</p></div>
        <div className="leadership-grid">
          <article className="leader-card"><div className="leader-avatar">MB</div><div className="leader-info"><span>Founder &amp; Chief Executive Officer</span><h3>Manoj Kumar Bishwas</h3><p>Global Skills &amp; Digital Development Foundation</p></div><Quote size={24} aria-hidden="true" /><blockquote>“True progress begins when rural and underserved communities gain the digital tools, practical skills, and awareness of public services needed to stand on their own feet with dignity.”</blockquote></article>
          <article className="leader-card leader-card-gold"><div className="leader-avatar">AK</div><div className="leader-info"><span>Founder &amp; Managing Director</span><h3>Arvind Kumar</h3><p>Global Skills &amp; Digital Development Foundation</p></div><Quote size={24} aria-hidden="true" /><blockquote>“Through grassroots action in Bihar and across India, our focus is on measurable community transformation—connecting youth, women, and families with education, healthcare awareness, and sustainable livelihoods.”</blockquote></article>
        </div>
        <div className="section-action"><Link className="button button-blue" href="/transparency">View statutory registrations <ArrowRight size={16} aria-hidden="true" /></Link></div>
      </div>
    </section>
  </>;
}
