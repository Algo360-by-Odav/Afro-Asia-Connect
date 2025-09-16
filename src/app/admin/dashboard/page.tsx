'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import OverviewPanel from './components/OverviewPanel';

function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>Lightweight placeholder layout (modular panels)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              The admin UI is being restored in modular panels to keep builds stable. Overview is active below.
            </p>
          </CardContent>
        </Card>

        {/* Panels */}
        <OverviewPanel />
      </div>
    </div>
  );
}

export default AdminDashboard;
