import ListingDetailClient from './ListingDetailClient';

export async function generateStaticParams() {
  // Return empty array for static export - pages will be generated on demand
  return [];
}

export default function ListingDetailPage() {
  return <ListingDetailClient />;
}
