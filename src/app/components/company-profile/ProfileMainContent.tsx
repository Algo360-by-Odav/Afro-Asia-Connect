// src/app/components/company-profile/ProfileMainContent.tsx
"use client";

import React from 'react';
import CompanyContactForm from './CompanyContactForm';

// Define a more specific type for company data if possible, or use 'any' for now
interface CompanyData {
  id: string;
  name: string;
  overview: {
    description: string;
    certifications: string[];
    languages: string[];
  };
  products: Array<{ id: string; name: string; imageUrl: string; description: string; }>;
  contact: { email: string; phone: string; website: string; };
  tradeCapacity: {
    exportRegions: Record<string, number>;
    employees: string;
    annualTurnover: string;
    yearsInBusiness: number;
    keyMarkets: string[];
  };
  // Add other relevant fields from mockCompanyData as needed
}

interface ProfileMainContentProps {
  company: CompanyData;
  activeTab: string;
  onTabChange: (tabName: string) => void;
}

export default function ProfileMainContent({ company, activeTab, onTabChange }: ProfileMainContentProps) {

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <h3 className="mb-3 text-xl font-semibold">Company Overview</h3>
            <p className="mb-4 whitespace-pre-line">{company.overview.description}</p>
            <h4 className="mb-2 font-semibold">Certifications:</h4>
            <ul className="mb-4 list-disc list-inside">
              {company.overview.certifications.map(cert => <li key={cert}>{cert}</li>)}
            </ul>
            <h4 className="mb-2 font-semibold">Languages Spoken:</h4>
            <ul className="list-disc list-inside">
              {company.overview.languages.map(lang => <li key={lang}>{lang}</li>)}
            </ul>
          </div>
        );
      case 'products':
        return (
          <div>
            <h3 className="mb-4 text-xl font-semibold">Products/Services</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {company.products.map(product => (
                <div key={product.id} className="p-4 border rounded-lg shadow-sm bg-gray-50">
                  <img src={product.imageUrl} alt={product.name} className="object-cover w-full mb-3 rounded h-44" />
                  <h4 className="mb-1 font-semibold">{product.name}</h4>
                  <p className="text-sm text-gray-600">{product.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'contact':
        return (
          <div>
            <h3 className="mb-4 text-lg font-semibold">Contact Information</h3>
            <div className="mb-6 space-y-1">
              <p><span className="font-medium">Email:</span> {company.contact.email}</p>
              <p><span className="font-medium">Phone:</span> {company.contact.phone}</p>
              <p><span className="font-medium">Website:</span> <a href={company.contact.website} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">{company.contact.website}</a></p>
            </div>
            <hr className="my-6"/>
            <h3 className="mb-4 text-lg font-semibold">Send a Message to {company.name}</h3>
            <CompanyContactForm companyName={company.name} companyEmail={company.contact.email} />
          </div>
        );
      case 'trade':
        return (
          <div>
            <h3 className="mb-3 text-xl font-semibold">Trade Capacity</h3>
            <p><strong>Employees:</strong> {company.tradeCapacity.employees}</p>
            <p><strong>Annual Turnover:</strong> {company.tradeCapacity.annualTurnover}</p>
            <p><strong>Years in Business:</strong> {company.tradeCapacity.yearsInBusiness}</p>
            <p className="mt-2 mb-1 font-semibold">Key Markets:</p>
            <ul className="list-disc list-inside">
              {company.tradeCapacity.keyMarkets.map(market => <li key={market}>{market}</li>)}
            </ul>
            <p className="mt-2 mb-1 font-semibold">Export Regions:</p>
            <ul className="list-disc list-inside">
              {Object.entries(company.tradeCapacity.exportRegions).map(([region, percent]) => (
                <li key={region}>{region}: {percent}%</li>
              ))}
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8" aria-label="Tabs">
          <button 
            onClick={() => onTabChange('overview')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => onTabChange('products')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'products' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Products/Services
          </button>
          <button 
            onClick={() => onTabChange('contact')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'contact' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Contact
          </button>
          <button 
            onClick={() => onTabChange('trade')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'trade' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Trade Capacity
          </button>
        </nav>
      </div>
      <div>
        {renderContent()}
      </div>
    </div>
  );
}
