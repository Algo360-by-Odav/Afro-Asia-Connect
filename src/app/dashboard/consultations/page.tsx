'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { redirect, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import BookConsultationForm from './BookConsultationForm';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const CalendarView = dynamic(() => import('@/app/components/consultations/CalendarView'), { ssr: false });
const WorkingHoursForm = dynamic(() => import('./WorkingHoursForm'), { ssr: false });
const ProviderConfigForm = dynamic(() => import('./ProviderConfigForm'), { ssr: false });
const PastConsultations = dynamic(() => import('./PastConsultations'), { ssr: false });

function ConsultationsPageContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyName = searchParams?.get('company') || 'GlobalTrade Logistics Ltd.';

  if (!isLoading && (!user || user.user_type !== 'service_provider')) {
    redirect('/dashboard');
  }

  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center space-x-4">
        {/* Placeholder logo */}
        <div className="w-16 h-16 bg-slate-200 rounded-md flex-shrink-0" />
        <div>
          <h1 className="text-2xl font-bold">{companyName}</h1>
          <p className="text-slate-600">Services: International Shipping, Customs Clearance, Consulting</p>
          <div className="flex items-center space-x-2 text-sm mt-1">
            <span className="inline-block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Verified Provider</span>
            <span>⭐ 4.9/5</span>
            <span>98% On-time</span>
            <span>🕑 Avg. response: 1h</span>
          </div>
          <div className="mt-3 space-x-2">
            <button
              className="px-4 py-2 bg-sky-600 text-white rounded-md"
              onClick={() => router.push(`/contact?subject=Message%20for%20${encodeURIComponent(companyName)}`)}
            >
              Send Message
            </button>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-md"
              onClick={() => router.push('/post-request') }
            >
              Request Quote
            </button>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">New Booking</h2>
          <BookConsultationForm companyName={companyName} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Your Calendar</h2>
          <CalendarView />
          <h2 className="text-xl font-semibold mt-8 mb-2">Working Hours</h2>
          <WorkingHoursForm />
          <ProviderConfigForm />
          <PastConsultations />
        </div>
      </div>
    </div>
  );
}

export default function ConsultationsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <ConsultationsPageContent />
    </Suspense>
  );
}
