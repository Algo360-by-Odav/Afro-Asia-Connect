'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Mail, User, Briefcase, CalendarDays, Eye } from 'lucide-react';

interface Lead {
  id: string;
  listing_id: string; // ID of the listing the lead is for
  business_name?: string; // Name of the business listing (ideally from backend join)
  inquirer_name: string;
  inquirer_email: string;
  message: string;
  status: 'new' | 'read' | 'contacted' | 'archived'; // Example statuses
  created_at: string; // ISO date string
}

export default function ViewLeadsPage() {
  const { user, token, isLoading: authLoading, fetchUser } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    const userRole = user?.role || user?.user_type;
    const isSellerRole = userRole === 'seller' || userRole === 'SUPPLIER' || userRole === 'supplier';
    if (!user || !isSellerRole || !token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leads/my-leads', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch leads.'}));
        throw new Error(errorData.message || 'Failed to fetch leads');
      }
      const data: Lead[] = await response.json();
      setLeads(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (!authLoading) {
        const userRole = user?.role || user?.user_type;
        const isSellerRole = userRole === 'seller' || userRole === 'SUPPLIER' || userRole === 'supplier';
        
        // If user has customer role but email suggests seller, try to refresh user data
        if (userRole === 'customer' && user?.email === 'testseller123@gmail.com') {
          console.log('🔄 Detected testseller123@gmail.com with customer role, attempting to refresh user data...');
          fetchUser();
          return;
        }
        
        if (user && isSellerRole) {
            fetchLeads();
        } else if (user && !isSellerRole) {
            setError('Access Denied: This page is for sellers only.');
            setIsLoading(false);
        } else {
            setIsLoading(false); 
        }
    }
  }, [authLoading, user, fetchLeads, fetchUser]);

  // Placeholder for future action
  // const handleViewLeadDetails = (leadId: string) => {
  //   console.log('View details for lead:', leadId);
  //   // router.push(`/dashboard/leads/${leadId}`);
  // };

  if (authLoading || isLoading) {
    return <div className="p-6 text-center"><p>Loading leads...</p></div>;
  }

  const userRole = user?.role || user?.user_type;
  const isSellerRole = userRole === 'seller' || userRole === 'SUPPLIER' || userRole === 'supplier';
  
  if (user && !isSellerRole) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-semibold text-red-600">Access Denied</h1>
        <p className="mt-4 text-slate-600">You must be a seller to view leads.</p>
        <p className="mt-2 text-sm text-gray-500">Current user role: {userRole}</p>
        <button 
          onClick={() => {
            console.log('🔄 Refreshing user data...');
            fetchUser();
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh User Data
        </button>
        <button 
          onClick={() => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
            window.location.reload();
          }}
          className="mt-4 ml-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Cache & Reload
        </button>
        <Link href="/dashboard" className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
          Go to Dashboard
        </Link>
      </div>
    );
  }
  
  if (error) {
    return <div className="p-6 text-center text-red-600"><p>Error: {error}</p></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Your Leads</h1>
        {/* Add any primary actions here if needed, e.g., filter button */}
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
            <Mail size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600 text-lg font-semibold">No leads found.</p>
            <p className="text-slate-500 text-sm mt-1">Potential customers will appear here once they inquire about your listings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-sky-700">
                    Lead for: {lead.business_name || 'Listing ID: ' + lead.listing_id}
                  </h2>
                  <p className="text-sm text-slate-500 flex items-center mt-1">
                    <User size={14} className="mr-1.5 text-slate-400" /> {lead.inquirer_name} (<a href={`mailto:${lead.inquirer_email}`} className="text-sky-600 hover:underline">{lead.inquirer_email}</a>)
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap truncate h-10 leading-5">
                {lead.message}
              </p>
              <div className="mt-3 flex justify-between items-center text-xs text-slate-500">
                <span className="flex items-center">
                  <CalendarDays size={14} className="mr-1.5 text-slate-400" /> 
                  Received: {new Date(lead.created_at).toLocaleDateString()} {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {/* <button 
                  onClick={() => handleViewLeadDetails(lead.id)} 
                  className="flex items-center text-sky-600 hover:text-sky-800 font-medium"
                >
                  <Eye size={14} className="mr-1" /> View Details
                </button> */}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Pagination could be added here if the API supports it */}
    </div>
  );
}
