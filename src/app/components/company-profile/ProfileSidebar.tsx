// src/app/components/company-profile/ProfileSidebar.tsx
"use client";

import React from 'react';
import { ChatBubbleLeftEllipsisIcon, StarIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline'; // Using outline icons

// Define a more specific type for company data if possible, or use 'any' for now
interface CompanyData {
  id: string;
  name: string;
  rating: number;
  trustScore: number;
  joinDate: string;
  lastSeen: string;
  // Add other relevant fields from mockCompanyData as needed
}

interface ProfileSidebarProps {
  company: CompanyData;
  onContactNowClick: () => void;
}

export default function ProfileSidebar({ company, onContactNowClick }: ProfileSidebarProps) {
  // Helper to format date string (basic example)
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateString; // return original if invalid
    }
  };

  return (
    <aside className="space-y-6">
      {/* Contact Now Button */}
      <button 
        type="button"
        onClick={onContactNowClick}
        className="flex items-center justify-center w-full px-6 py-3 font-semibold text-white transition-colors duration-150 rounded-md bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75"
      >
        <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-2" />
        Contact Now
      </button>

      {/* Company Rating/Trust Score */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="mb-3 text-lg font-semibold text-gray-700">Company Standing</h3>
        <div className="flex items-center mb-2">
          <StarIcon className="w-5 h-5 mr-1 text-yellow-400" />
          <span className="font-medium text-gray-600">Rating: {company.rating}/5</span>
        </div>
        <div className="mb-2">
          <span className="font-medium text-gray-600">Trust Score: {company.trustScore}%</span>
          <div className="w-full mt-1 bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-sky-500 h-2.5 rounded-full"
              style={{ width: `${company.trustScore}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Join Date, Last Seen */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="mb-3 text-lg font-semibold text-gray-700">Activity</h3>
        <div className="flex items-center mb-2 text-sm text-gray-600">
          <CalendarDaysIcon className="w-5 h-5 mr-2 text-gray-400" />
          <span>Joined: {formatDate(company.joinDate)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="w-5 h-5 mr-2 text-gray-400" />
          <span>Last Seen: {formatDate(company.lastSeen)}</span>
        </div>
      </div>

      {/* Placeholder for other sidebar items like 'Report this company' or 'Save to list' */}
      <div className="p-3 text-sm text-center text-gray-400 border border-dashed rounded-md border-gray-300 bg-gray-50">
        Additional sidebar actions coming soon.
      </div>
    </aside>
  );
}
