import ListingDetailClient from './ListingDetailClient';

export async function generateStaticParams() {
  // Return common listing IDs for static export
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
    { id: '7' },
    { id: '8' },
    { id: '9' },
    { id: '10' }
  ];
}

export const dynamic = 'force-static';

export default function ListingDetailPage() {
  return <ListingDetailClient />;
}
