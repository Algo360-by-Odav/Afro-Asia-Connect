PS C:\Users\FVMY\CascadeProjects\AfroAsiaConnect> git commit -m "Netlify: publish .next instead of out for Next.js build"
[master b8b2866] Netlify: publish .next instead of out for Next.js build
 1 file changed, 2 insertions(+), 1 deletion(-)
PS C:\Users\FVMY\CascadeProjects\AfroAsiaConnect> git push
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 4 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 392 bytes | 392.00 KiB/s, done.
Total 3 (delta 2), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (2/2), completed with 2 local objects.
To https://github.com/Algo360-by-Odav/Afro-Asia-Connect.git
   da072fa..b8b2866  master -> master
PS C:\Users\FVMY\CascadeProjects\AfroAsiaConnect> 'use client';

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
