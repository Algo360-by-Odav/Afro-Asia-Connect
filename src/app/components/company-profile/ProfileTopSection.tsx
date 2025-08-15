// src/app/components/company-profile/ProfileTopSection.tsx
"use client";

import React from 'react';

// Define a more specific type for company data if possible, or use 'any' for now
interface CompanyData {
  id: string;
  name: string;
  bannerUrl: string;
  logoUrl: string;
  location: string;
  sector: string;
  subSector: string;
}

interface ProfileTopSectionProps {
  company: CompanyData;
}

export default function ProfileTopSection({ company }: ProfileTopSectionProps) {
  return (
    <div className="bg-white shadow-md">
      {/* Banner Image */}
      <div 
        className="h-48 bg-center bg-cover md:h-64 lg:h-80"
        style={{ backgroundImage: `url(${company.bannerUrl})` }}
      >
        {/* You can add an overlay or content on the banner if needed */}
      </div>

      <div className="container px-4 py-6 mx-auto md:flex md:items-end md:-mt-16">
        {/* Logo */}
        <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
          <img 
            src={company.logoUrl} 
            alt={`${company.name} Logo`} 
            className="object-contain w-32 h-32 p-2 bg-white border-4 border-white rounded-lg shadow-lg md:w-40 md:h-40 lg:w-48 lg:h-48"
          />
        </div>

        {/* Company Info */}
        <div className="mt-4 text-center md:mt-0 md:text-left">
          <h1 className="mb-1 text-2xl font-bold text-gray-800 md:text-3xl lg:text-4xl">{company.name}</h1>
          <div className="flex items-center justify-center mb-1 md:justify-start">
            {/* TODO: Replace [FLAG] with actual flag component/image */}
            <span className="mr-2 text-xl">[FLAG]</span> 
            <p className="text-gray-600">{company.location}</p>
          </div>
          <p className="text-sm text-gray-500">{company.sector} / {company.subSector}</p>
        </div>
      </div>
      {/* Static Map Placeholder Section */}
      <div className="container px-4 py-6 mx-auto">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="mb-3 text-xl font-semibold text-gray-700">Location Map</h2>
          <div className="overflow-hidden bg-gray-200 rounded aspect-video">
            <img 
              src={`https://picsum.photos/seed/${company.id}map/800/450`} 
              alt={`Map placeholder for ${company.name}`}
              className="object-cover w-full h-full"
            />
          </div>
          <p className="mt-2 text-xs text-center text-gray-500">Static map placeholder. Interactive map coming soon.</p>
        </div>
      </div>
    </div>
  );
}
