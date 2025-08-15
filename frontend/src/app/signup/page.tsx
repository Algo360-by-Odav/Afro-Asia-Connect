"use client";

import React from 'react';
import Image from 'next/image';
import AuthForm from '@/app/components/auth/AuthForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <img 
        src="/images/home-background.jpg" 
        alt="Global business image" 
        className="w-full h-full object-cover absolute inset-0" 
      />
      <div className="absolute inset-0 bg-black opacity-30" />

      {/* Centered Form Container */}
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 bg-white/50 backdrop-blur-sm rounded-none p-8 shadow-xl aspect-square">
          <div className="text-center">
            <div className="flex justify-center mb-12">
              <Image 
                src="/afroasiaconnect-logo.png" 
                alt="AfroAsiaConnect Logo" 
                width={512} 
                height={160} 
                priority 
              />
            </div>
          </div>
          {/* AuthForm will default to login; we can toggle to register mode via search param */}
          <AuthForm initialMode="register" />
        </div>
      </div>
    </div>
  );
}
