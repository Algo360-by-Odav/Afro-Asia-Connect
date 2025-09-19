'use client';

import React from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function SupabaseStatus() {
  if (isSupabaseConfigured) {
    return null; // Don't show anything when properly configured
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-md">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-yellow-800">
            Supabase Configuration Required
          </h3>
          <p className="text-xs text-yellow-700 mt-1">
            Real-time messaging features are disabled. Please configure Supabase environment variables in Netlify.
          </p>
          <div className="mt-2 text-xs text-yellow-600">
            <p>Required variables:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
