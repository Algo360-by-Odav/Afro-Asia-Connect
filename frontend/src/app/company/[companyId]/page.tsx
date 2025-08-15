"use client";

import React, { useState } from 'react';

interface CompanyProfilePageProps {
  params: Promise<{
    companyId: string;
  }>;
}

import ProfileTopSection from '@/app/components/company-profile/ProfileTopSection';
import ProfileMainContent from '@/app/components/company-profile/ProfileMainContent';
import ProfileSidebar from '@/app/components/company-profile/ProfileSidebar';

export default function CompanyProfilePage({ params: paramsPromise }: CompanyProfilePageProps) {
  const params = React.use(paramsPromise);
  const companyId = params.companyId;
  const [activeTab, setActiveTab] = useState('overview');

  // Mock company data - replace with actual data fetching later
  const mockCompanyData = {
    id: companyId,
    name: `Dynamic Solutions Ltd. (ID: ${companyId})`,
    bannerUrl: `https://picsum.photos/seed/${companyId}banner/1200/300`,
    logoUrl: `https://picsum.photos/seed/${companyId}logo/150/150`,
    location: 'Nairobi, Kenya',
    mapEmbed: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d255282.35853749292!2d36.7073082944901!3d-1.302860277367383!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1172d84d49a7%3A0xf7cf0254b297924c!2sNairobi%2C%20Kenya!5e0!3m2!1sen!2sus!4v1678886753025!5m2!1sen!2sus" width="100%" height="200" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
    sector: 'Information Technology',
    subSector: 'Software Development',
    overview: {
      description: 'Dynamic Solutions Ltd. is a leading provider of innovative software solutions, specializing in custom application development and IT consulting. We empower businesses to achieve their goals through technology.',
      certifications: ['ISO 9001:2015', 'Microsoft Gold Partner'],
      languages: ['English', 'Swahili', 'French']
    },
    products: [
      { id: 'p1', name: 'ERP Pro Suite', imageUrl: `https://picsum.photos/seed/${companyId}prod1/400/300`, description: 'Comprehensive ERP solution for large enterprises.' },
      { id: 'p2', name: 'CRM Connect', imageUrl: `https://picsum.photos/seed/${companyId}prod2/400/300`, description: 'Cloud-based CRM for managing customer relations.' },
      { id: 'p3', name: 'Data Analytics Platform', imageUrl: `https://picsum.photos/seed/${companyId}prod3/400/300`, description: 'Advanced analytics for data-driven decisions.' },
    ],
    contact: {
      email: `info@dynamicsolutions-${companyId}.com`,
      phone: '+254 700 123 456',
      website: `www.dynamicsolutions-${companyId}.com`
    },
    tradeCapacity: {
      exportRegions: { Africa: 60, Asia: 25, Europe: 10, Other: 5 },
      employees: '150+',
      annualTurnover: 'USD 5M - 10M',
      yearsInBusiness: 12,
      keyMarkets: ['East Africa', 'South Asia']
    },
    rating: 4.5,
    trustScore: 88,
    joinDate: '2020-01-15',
    lastSeen: '2024-07-25T10:30:00Z'
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ProfileTopSection company={mockCompanyData} />

      <div className="container py-8 mx-auto">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main Content Area (70%) */}
          <div className="w-full lg:w-2/3 xl:w-3/4">
            <ProfileMainContent company={mockCompanyData} activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Sidebar (30%) */}
          <div className="w-full lg:w-1/3 xl:w-1/4">
            <ProfileSidebar company={mockCompanyData} onContactNowClick={() => setActiveTab('contact')} />
          </div>
        </div>
      </div>
    </div>
  );
}
