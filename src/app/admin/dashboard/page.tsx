'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>Production build placeholder</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            This page has been temporarily simplified to unblock the production build.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDashboard;
