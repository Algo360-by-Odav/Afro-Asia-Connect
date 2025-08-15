'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { redirect, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import RequestServiceForm from './RequestServiceForm';

function ServiceRequestsPageContent() {
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const companyName = searchParams?.get('company') || 'the provider';

  if (!isLoading && (!user || user.user_type !== 'service_provider')) {
    redirect('/dashboard');
  }

  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Request a Service from: <span className="text-sky-700">{companyName}</span></h1>
        <p className="text-slate-600">Let us know what you need, and we’ll get back to you shortly.</p>
      </header>
      <RequestServiceForm companyName={companyName} />
    </div>
  );
}

export default function ServiceRequestsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <ServiceRequestsPageContent />
    </Suspense>
  );
}
