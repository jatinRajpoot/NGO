import MemberPortalEnhancements from '../components/MemberPortalEnhancements';

export default function MemberLayout({ children }) {
  return (
    <>
      {children}
      <MemberPortalEnhancements />
    </>
  );
}
