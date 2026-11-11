const publicPaths = [
  '', 'about', 'activities', 'campaigns', 'careers', 'complaints', 'contact', 'core-areas',
  'donate', 'events', 'gallery', 'get-involved', 'internships', 'internships/verify-certificate', 'membership',
  'news', 'privacy-policy', 'projects', 'refund-policy', 'team', 'terms',
  'transparency', 'verify', 'visitor-certificate', 'work-sectors',
];

export default function sitemap() {
  return publicPaths.map((pathname) => ({
    url: `https://gsddfoundation.org/${pathname ? `${pathname}/` : ''}`,
  }));
}
