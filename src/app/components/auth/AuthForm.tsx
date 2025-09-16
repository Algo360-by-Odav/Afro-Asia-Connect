// src/app/components/auth/AuthForm.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/api';
import { LockClosedIcon, EnvelopeIcon, UserIcon, BuildingOffice2Icon, BriefcaseIcon } from '@heroicons/react/24/outline'; // Example icons

type AuthMode = 'login' | 'register';

interface AuthFormProps {
  initialMode?: 'login' | 'register';
}

function AuthFormContent({ initialMode = 'login' }: AuthFormProps) {
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'; // Replace with your actual Client ID or use env var
  const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_API_URL}/auth/callback/google`; // Replace with your actual Redirect URI or use env var

  const handleGoogleSignIn = () => {
    console.log('Attempting Google Sign In...');
    // Generate a state parameter for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('oauth_state', state);

    // Store the original redirect URL if present, to be used after successful OAuth
    const currentRedirectParam = searchParams?.get('redirect');
    if (currentRedirectParam) {
      localStorage.setItem('oauth_final_redirect', currentRedirectParam);
    }

    const scope = 'openid email profile';
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`;

    window.location.href = googleAuthUrl;
  };

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const { login, user, isLoading: authContextIsLoading } = useAuth(); // Get isLoading from AuthContext
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    accountType: 'buyer', // Default account type
    agreeToTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log('**************************************************');
    console.log('[AuthForm] TOP OF handleSubmit. Mode:', mode, 'Time:', new Date().toLocaleTimeString());
    console.log('**************************************************');
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (mode === 'register' && !formData.agreeToTerms) {
      alert('You must agree to the terms and conditions to register.');
      setIsLoading(false);
      return;
    }

    const endpoint = mode === 'login' ? `${API_BASE_URL}/auth/login` : `${API_BASE_URL}/auth/register`;
    const body = mode === 'login' ? 
      { email: formData.email, password: formData.password } : 
      { email: formData.email, password: formData.password, full_name: formData.email.split('@')[0], phone_number: formData.phone || null };

    try {
      console.log('[AuthForm] handleSubmit: Attempting to login with email:', formData.email);
      console.log('[AuthForm] API endpoint:', endpoint);
      console.log('[AuthForm] Request body:', JSON.stringify(body));
      
      // Allow more time for backend cold starts (Render free tier can take ~20s to wake)
      const doRequest = async (): Promise<Response> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout
        try {
          const resp = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          return resp;
        } finally {
          clearTimeout(timeoutId);
        }
      };

      let response = await doRequest();
      // If fetch was aborted, quickly retry once after a short backoff
      if (!response.ok && response.status === 504) {
        await new Promise((r) => setTimeout(r, 800));
        response = await doRequest();
      }

      console.log('[AuthForm] Response received. Status:', response.status, 'OK:', response.ok);
      
      const data = await response.json();
      console.log('[AuthForm] Response data:', data);

      if (!response.ok) {
        if (response.status === 501) {
          setError('API route not implemented on this site yet. Please enable Next.js API handlers or set an external API URL.');
          setIsLoading(false);
          return;
        }
        setError(data.msg || `An error occurred during ${mode}.`);
        setIsLoading(false);
        return;
      }

      if (mode === 'login') {
        // Backend login returns { success: true, data: { token: string, user: UserData } }
        // The AuthContext's login function expects (token, userData)
        console.log('[AuthForm] handleSubmit: API call successful, data received:', data);
        console.log('[AuthForm] Full data object:', JSON.stringify(data, null, 2));
        console.log('[AuthForm] data.data:', data.data);
        console.log('[AuthForm] data.data?.user:', data.data?.user);
        console.log('[AuthForm] data.data?.token:', data.data?.token);
        console.log('**************************************************');
        console.log('[AuthForm] IMMEDIATELY BEFORE AuthContext.login. User data to send:', data.data?.user, 'Token:', data.data?.token, 'Time:', new Date().toLocaleTimeString());
        console.log('**************************************************');
        console.log('**************************************************');
        await login(data.data?.token, data.data?.user); // Call AuthContext's login
        console.log('[AuthForm] handleSubmit: AuthContext.login call completed.');

        // Add small delay to allow React state to update before redirecting
        await new Promise(resolve => setTimeout(resolve, 200));

        // Explicitly handle navigation after login state is set by AuthContext
        const redirectParamValue = searchParams?.get('redirect');
        console.log('[AuthForm] handleSubmit post-login. Raw searchParams.get(\'redirect\'):', redirectParamValue);
        console.log('[AuthForm] handleSubmit post-login. User isAdmin:', data.data?.user?.isAdmin);

        // Use window.location for more reliable redirect
        if (redirectParamValue) {
          console.log(`[AuthForm] handleSubmit: Attempting to redirect to redirectParamValue: ${redirectParamValue}`);
          window.location.href = redirectParamValue;
        } else if (data.data?.user?.isAdmin) {
          console.log('[AuthForm] handleSubmit: No redirectParam. User is admin. Attempting to redirect to /dashboard/events');
          window.location.href = '/dashboard/events';
        } else {
          console.log('[AuthForm] handleSubmit: No redirectParam. User is not admin. Attempting to redirect to /dashboard');
          window.location.href = '/dashboard';
        }
        console.log('[AuthForm] handleSubmit: Redirection logic finished.');
      } else {
        // Handle registration success (e.g., show message, auto-login, or redirect to login)
        alert('Registration successful! Please log in.');
        setMode('login'); // Switch to login mode after successful registration
      }
    } catch (err) {
      console.error(`[AuthForm] handleSubmit CATCH block during ${mode}. Error message:`, (err instanceof Error ? err.message : String(err)), 'Full error object:', err);
      
      if ((err as Error).name === 'AbortError') {
        setError('Server took too long to respond. Please try again in a moment.');
      } else if ((err as Error).message === 'Failed to fetch') {
        setError('Unable to connect to server. Please ensure the backend is running.');
      } else {
        setError(`An unexpected error occurred. Please try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  };



  const toggleMode = () => {
    setMode(prevMode => (prevMode === 'login' ? 'register' : 'login'));
    // Reset form fields when toggling, or handle state persistence if needed
    setFormData({
      email: '',
      password: '',
      accountType: 'buyer',
      agreeToTerms: false,
    });
  };

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-800">
          {mode === 'login' ? 'Welcome Back!' : 'Create Your Account'}
        </h2>
        <p className="text-sm text-gray-600">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button onClick={toggleMode} className="font-medium text-sky-600 hover:text-sky-500 focus:outline-none">
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md">{error}</div>}
        <div>
          <label htmlFor="email" className="sr-only">Email address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <EnvelopeIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="block w-full py-3 pl-10 pr-3 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              placeholder="Email address"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <LockClosedIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              {...(mode === 'login' ? { autoComplete: 'current-password' } : { autoComplete: 'new-password' })}
              required
              value={formData.password}
              onChange={handleChange}
              className="block w-full py-3 pl-10 pr-3 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        {mode === 'register' && (
          <>
            <div>
              <label htmlFor="accountType" className="sr-only">Account Type</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <BriefcaseIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                </div>
                <select
                  id="accountType"
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleChange}
                  required
                  className="block w-full py-3 pl-10 pr-3 text-gray-700 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                >
                  <option value="buyer">Buyer/Importer</option>
                  <option value="seller">Seller/Exporter</option>
                  <option value="service_provider">Service Provider</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
              />
              <label htmlFor="agreeToTerms" className="block ml-2 text-sm text-gray-900">
                I agree to the{' '}
                <a href="/terms" target="_blank" className="font-medium text-sky-600 hover:text-sky-500">
                  Terms and Conditions
                </a>
              </label>
            </div>
          </>
        )}

        <div>
          <button 
            type="submit" 
            className="w-full py-4 px-6 text-lg font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200"
          >
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-gray-50">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 mt-6 sm:grid-cols-2">
          <div>
            <button
               type="button"
               onClick={handleGoogleSignIn}
               className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 whitespace-nowrap shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
             >
               <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" aria-hidden="true">
                 <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.4-34.1-4.1-50.3H272v95.1h146.9c-6.4 34.6-25.7 63.9-54.8 83.5v68h88.5c51.9-47.9 81.9-118.6 81.9-196.3z"/>
                 <path fill="#34A853" d="M272 544.3c73.8 0 135.8-24.4 181-66.2l-88.5-68c-24.6 16.5-56 26.2-92.5 26.2-71 0-131.1-48-152.6-112l-89.3 69c45.5 90.1 138.6 151 241.9 151z"/>
                 <path fill="#FBBC04" d="M119.4 322.3c-10.1-29.8-10.1-62.5 0-92.3l-89.3-69c-39.3 77.4-39.3 169.2 0 246.6l89.3-69z"/>
                 <path fill="#EA4335" d="M272 107.7c39.9-.6 78.4 14.2 107.5 41.3l80.3-80.3C412.9 24.9 344.9 0 272 0 168.7 0 75.6 60.8 30.1 150.9l89.3 69C140.9 155.7 201 107.7 272 107.7z"/>
               </svg>
               Google
             </button>
          </div>

          <div>
            <button
               type="button"
               onClick={() => console.log('Sign in with LinkedIn')}
               className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#0A66C2] py-3 text-sm font-semibold text-white whitespace-nowrap shadow-sm transition hover:bg-[#055aaf] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:ring-offset-2"
             >
               <svg className="h-5 w-5" viewBox="0 0 448 512" aria-hidden="true" fill="currentColor">
                 <path d="M100.28 448H7.4V148.9h92.88zm-46.44-341C24.13 107 0 82.9 0 51.5S24.13-4 53.84-4 107.7 20.1 107.7 51.5 83.55 107 53.84 107zM447.9 448h-92.6V302.4c0-34.7-.7-79.2-48.23-79.2-48.24 0-55.63 37.7-55.63 76.7V448h-92.8V148.9h89.2v40.8h1.3c12.4-23.5 42.6-48.3 87.7-48.3 93.8 0 111.1 61.8 111.1 142.3V448z"/>
               </svg>
               LinkedIn
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthForm({ initialMode = 'login' }: AuthFormProps) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <AuthFormContent initialMode={initialMode} />
    </Suspense>
  );
}
