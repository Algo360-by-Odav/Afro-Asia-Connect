import CompanyProfileClient from './CompanyProfileClient';

export async function generateStaticParams() {
  return [{ companyId: 'demo' }];
}

export const dynamic = 'force-static';

export default function CompanyProfilePage() {
  return <CompanyProfileClient />;
}