const publicPaths = [
  '', 'about', 'activities', 'campaigns', 'complaints', 'contact', 'core-areas',
  'donate', 'events', 'gallery', 'get-involved', 'internships', 'membership',
  'news', 'privacy-policy', 'projects', 'refund-policy', 'team', 'terms',
  'transparency', 'verify', 'work-sectors',
];

export default function sitemap() {
  return publicPaths.map((pathname) => ({
    url: `https://gsddfoundation.org/${pathname ? `${pathname}/` : ''}`,
  }));
}
