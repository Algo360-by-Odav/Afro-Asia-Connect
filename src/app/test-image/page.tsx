// src/app/test-image/page.tsx
"use client";

import React from 'react';

export default function TestImagePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Image Page</h1>
        <div className="border-2 border-dashed border-gray-300 p-4 mb-4">
          <img 
            src="/images/auth-background.jpg" 
            alt="Test Image" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="border-2 border-dashed border-gray-300 p-4">
          <div 
            className="w-full h-64 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/images/auth-background.jpg)' }}
          />
        </div>
      </div>
    </div>
  );
}
