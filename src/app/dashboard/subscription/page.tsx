'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { CheckCircle, XCircle, AlertTriangle, Star, CalendarClock, ExternalLink } from 'lucide-react';

const PlanFeatureItem: React.FC<{ feature: string }> = ({ feature }) => (
  <li className="flex items-center text-slate-600">
    <CheckCircle size={18} className="text-green-500 mr-2 flex-shrink-0" />
    <span>{feature}</span>
  </li>
);

export default function SubscriptionPage() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return <div className="p-6 text-center"><p>Loading subscription details...</p></div>;
  }

  if (!user) {
    // This case should ideally be handled by middleware or a higher-level component
    // redirecting to login if no user and not loading.
    return (
      <div className="p-6 text-center">
        <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
        <h1 className="text-xl font-semibold text-slate-700">Please log in to view your subscription.</h1>
        <Link href="/login?redirect=/dashboard/subscription" className="mt-4 inline-block px-6 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
          Go to Login
        </Link>
      </div>
    );
  }

  const { 
    subscription_plan_name,
    subscription_status,
    subscription_plan_features,
    subscription_expires_at 
  } = user as any;

  const isActiveSub = subscription_plan_name && subscription_status === 'active';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8 text-center">Your Subscription</h1>

      {isActiveSub ? (
        <div className="bg-white shadow-xl rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-sky-700 flex items-center">
              <Star size={24} className="mr-2 text-yellow-500" /> {subscription_plan_name}
            </h2>
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700 capitalize">
              {subscription_status}
            </span>
          </div>

          {subscription_plan_features && subscription_plan_features.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-700 mb-2">Plan Features:</h3>
              <ul className="space-y-2">
                {subscription_plan_features.map((feature: any, index: number) => (
                  <PlanFeatureItem key={index} feature={feature} />
                ))}
              </ul>
            </div>
          )}

          {subscription_expires_at && (
            <div className="mb-8 p-4 bg-slate-50 rounded-md flex items-center">
              <CalendarClock size={20} className="text-slate-500 mr-3" />
              <div>
                <p className="text-sm text-slate-600 font-medium">Renews/Expires on:</p>
                <p className="text-lg text-slate-800 font-semibold">{formatDate(subscription_expires_at)}</p>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <Link href="/pricing" className="inline-flex items-center px-6 py-3 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700 transition duration-150 shadow-sm hover:shadow-md">
              Manage Subscription or View Other Plans <ExternalLink size={18} className="ml-2" />
            </Link>
          </div>

        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-lg p-8 text-center">
          <XCircle size={48} className="mx-auto text-slate-400 mb-4" />
          <h2 className="text-2xl font-semibold text-slate-700 mb-3">
            {subscription_plan_name ? `Your ${subscription_plan_name} plan is ${subscription_status || 'not active'}.` : 'You are currently on the Free Plan.'}
          </h2>
          <p className="text-slate-600 mb-6">
            Upgrade to a premium plan to unlock more features and benefits.
          </p>
          <Link href="/pricing" className="inline-flex items-center px-8 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition duration-150 shadow-sm hover:shadow-md">
            View Pricing Plans <ExternalLink size={18} className="ml-2" />
          </Link>
        </div>
      )}
    </div>
  );
}
