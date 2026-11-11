const publicPaths = [
  '', 'about', 'activities', 'campaigns', 'complaints', 'contact', 'core-areas',
  'donate', 'events', 'forgot-password', 'gallery', 'general-members', 'get-involved', 'internships',
  'management-body', 'member-verification', 'membership',
  'news', 'privacy-policy', 'projects', 'refund-policy', 'team', 'terms',
  'transparency', 'verify', 'visitor-certificate', 'work-sectors',
];

export default function sitemap() {
  return publicPaths.map((pathname) => ({
    url: `https://gsddfoundation.org/${pathname ? `${pathname}/` : ''}`,
  }));
}
