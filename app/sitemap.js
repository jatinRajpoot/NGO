const publicPaths = [
  '', 'about', 'achievements', 'activities', 'activity-post', 'autopay-donate', 'autopay-donate/status',
  'campaigns', 'complaints', 'contact', 'core-areas', 'donate', 'donation-history', 'events', 'gallery',
  'get-involved', 'internships', 'membership', 'news', 'press-release', 'privacy-policy', 'projects',
  'refund-policy', 'team', 'terms',
  'transparency', 'verify', 'visitor-certificate', 'work-sectors',
];

export default function sitemap() {
  return publicPaths.map((pathname) => ({
    url: `https://gsddfoundation.org/${pathname ? `${pathname}/` : ''}`,
  }));
}
