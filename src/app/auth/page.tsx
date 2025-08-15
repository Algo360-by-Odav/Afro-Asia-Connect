// src/app/auth/page.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import AuthForm from '../components/auth/AuthForm';

export default function AuthPage() {
  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <img 
        src="/images/login-bg-placeholder.jpg" 
        alt="Login background placeholder" 
        className="w-full h-full object-cover absolute inset-0"
      />
      <div className="absolute inset-0 bg-black opacity-30"></div>

      {/* Centered Form Container */}
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 bg-white/50 backdrop-blur-sm rounded-none p-8 shadow-xl aspect-square">
          <div className="text-center">
            <div className="flex justify-center mb-12">
              <Image 
                src="/images/afroasiaconnect-logo.png" 
                alt="Company Logo Placeholder" 
                width={512} 
                height={160} 
                priority 
              />
            </div>
          </div>
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
