import PaymentPageClient from './PaymentPageClient';

export async function generateStaticParams() {
  // Return empty array for static export - pages will be generated on demand
  return [];
}

export default function PaymentPage() {
  return <PaymentPageClient />;
}
