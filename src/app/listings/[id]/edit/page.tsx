import EditListingClient from './EditListingClient';

export async function generateStaticParams() {
  // Return empty array for static export - pages will be generated on demand
  return [];
}

export const dynamic = 'force-static';
export const dynamicParams = false;

export default function EditListingPage() {
  return <EditListingClient />;
}
