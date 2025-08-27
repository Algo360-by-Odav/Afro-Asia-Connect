"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Assuming this is the correct path

// Hardcoded plans removed, will be fetched from API;
// const plans = [
  // {
    // name: 'Basic Connect',
    // priceMonthly: 'Free',
    // priceYearly: 'Free',
    // features: [
      // 'Basic Company Profile',
      // 'Limited Directory Access',
      // 'Post up to 1 Request',
      // 'Community Forum Access',
    // ],
    // cta: 'Get Started',
    // bgColor: 'bg-gray-100',
    // textColor: 'text-gray-900',
    // accentColor: 'text-sky-600',
    // buttonClass: 'bg-gray-300 hover:bg-gray-400 text-gray-800',
  // },
  // {
    // name: 'Business Growth',
    // priceMonthly: '$49',
    // priceYearly: '$490',
    // features: [
      // 'Enhanced Company Profile',
      // 'Full Directory Access',
      // 'Post up to 10 Requests',
      // 'Verified Badge',
      // 'Priority Support',
      // 'Access to Exclusive Events',
    // ],
    // cta: 'Upgrade Now',
    // bgColor: 'bg-sky-600',
    // textColor: 'text-white',
    // accentColor: 'text-yellow-400',
    // buttonClass: 'bg-yellow-400 hover:bg-yellow-500 text-sky-800 font-semibold',
    // highlight: true,
  // },
  // {
    // name: 'Enterprise Global',
    // priceMonthly: '$199',
    // priceYearly: '$1990',
    // features: [
      // 'Premium Company Profile',
      // 'API Access for Integrations',
      // 'Unlimited Requests',
      // 'Dedicated Account Manager',
      // 'Custom Analytics & Reports',
      // 'Early Access to New Features',
    // ],
    // cta: 'Upgrade Now',
    // bgColor: 'bg-gray-800',
    // textColor: 'text-white',
    // accentColor: 'text-sky-400',
    // buttonClass: 'bg-sky-500 hover:bg-sky-600 text-white',
  // },
// ];
// ];

interface FetchedPlan {
  id: number;
  name: string;
  price: string; // Comes as string from DECIMAL in backend
  currency: string;
  duration_days: number;
  features: string[];
  description: string | null;
}

// Interface for plans after processing for display (e.g., adding UI specific props)
interface DisplayPlan extends FetchedPlan {
  priceMonthlyDisplay: string;
  priceYearlyDisplay: string;
  cta: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  buttonClass: string;
  highlight?: boolean;
};

export default function PricingPage() {
  const router = useRouter();
  const { user, token, fetchUser } = useAuth();
  const [fetchedPlans, setFetchedPlans] = useState<DisplayPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [subscribingPlanId, setSubscribingPlanId] = useState<number | null>(null);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:3001/api/subscriptions/plans');
        if (!response.ok) {
          throw new Error(`Failed to fetch plans: ${response.statusText}`);
        }
        const data: FetchedPlan[] = await response.json();
        
        // Map fetched plans to DisplayPlan structure, adding UI-specific properties
        // This is a basic mapping, can be made more sophisticated
        // Deduplicate plans by id (or name) in case the backend returns duplicates
        const uniquePlans = Array.from(new Map(data.map(item => [item.name, item])).values());

        const displayData = uniquePlans.map((plan: FetchedPlan, index: number) => {
          const monthlyPrice = parseFloat(plan.price);
          const isFree = monthlyPrice === 0;
          // Simple annual price: 10x monthly for ~16% discount (2 months free)
          // Or handle based on duration_days if plans have different native durations
          const yearlyPrice = isFree ? 0 : monthlyPrice * 10; 

          let uiProps = {
            cta: 'Get Started',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-900',
            accentColor: 'text-sky-600',
            buttonClass: 'bg-gray-300 hover:bg-gray-400 text-gray-800',
            highlight: false,
          };

          if (plan.name === 'Premium Connect') {
            uiProps = {
              cta: 'Choose Plan',
              bgColor: 'bg-sky-600',
              textColor: 'text-white',
              accentColor: 'text-yellow-400',
              buttonClass: 'bg-yellow-400 hover:bg-yellow-500 text-sky-800 font-semibold',
              highlight: true,
            };
          } else if (plan.name === 'Business Pro') {
             uiProps = {
                cta: 'Contact Us', // Or 'Choose Plan' if direct subscription is possible
                bgColor: 'bg-gray-800',
                textColor: 'text-white',
                accentColor: 'text-sky-400',
                buttonClass: 'bg-sky-500 hover:bg-sky-600 text-white',
                highlight: false,
             };
          }

          return {
            ...plan,
            priceMonthlyDisplay: isFree ? 'Free' : `$${monthlyPrice.toFixed(2)}`,
            priceYearlyDisplay: isFree ? 'Free' : `$${yearlyPrice.toFixed(2)}`,
            ...uiProps,
          };
        });

        setFetchedPlans(displayData);
      } catch (err: any) {
        console.error("Error fetching plans:", err);
        setError(err.message);
      }
      setIsLoading(false);
    };

    fetchPlans();
  }, []);

  const handleChoosePlan = async (plan: DisplayPlan) => {
    if (!user || !token) {
      router.push(`/login?redirect=/pricing&planId=${plan.id}`);
      return;
    }

    if (plan.cta === 'Contact Us') {
        console.log(`Contact us about ${plan.name}`);
        router.push('/contact'); 
        return;
    }
    
    setSubscribingPlanId(plan.id);
    setSubscribeError(null);

    try {
      const response = await fetch('http://localhost:3001/api/subscriptions/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: plan.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || 'Failed to subscribe to plan.');
      }
      
      await fetchUser(); 
      router.push('/dashboard/subscription?success=true');

    } catch (err: any) {
      console.error('Subscription error:', err);
      setSubscribeError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubscribingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Flexible Pricing for Every Business
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Choose the plan that best fits your needs and scale with us.
          </p>
          <div className="mt-6">
            <span className={`mr-2 text-lg ${!isAnnual ? 'text-sky-700 font-semibold' : 'text-gray-500'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${isAnnual ? 'bg-sky-600' : 'bg-gray-300'}`}
            >
              <span className="sr-only">Use setting</span>
              <span aria-hidden="true" className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${isAnnual ? 'translate-x-5' : 'translate-x-0'}`}></span>
            </button>
            <span className={`ml-2 text-lg ${isAnnual ? 'text-sky-700 font-semibold' : 'text-gray-500'}`}>Annually (Save 2 months)</span>
          </div>
        </header>

        {isLoading && <div className="text-center col-span-full py-10"><p className="text-xl text-gray-700">Loading pricing plans...</p></div>}
        {error && <div className="text-center col-span-full py-10"><p className="text-xl text-red-600">Error: {error}</p></div>}
        
        {subscribeError && (
          <div className="my-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-center">
            <p>Subscription Error: {subscribeError}</p>
          </div>
        )}

        {!isLoading && !error && fetchedPlans.length === 0 && (
            <div className="text-center col-span-full py-10">
                <p className="text-xl text-gray-700">No pricing plans available at the moment. Please check back later.</p>
            </div>
        )}
        
        {!isLoading && !error && fetchedPlans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {fetchedPlans.map((plan) => (
              <div key={plan.id} className={`rounded-xl shadow-lg p-8 flex flex-col ${plan.bgColor} ${plan.textColor} ${plan.highlight ? 'border-4 border-yellow-400 transform scale-105' : ''}`}>
                <h3 className={`text-2xl font-bold ${plan.highlight ? plan.accentColor : plan.accentColor}`}>{plan.name}</h3>
                <div className="my-4">
                  <span className="text-5xl font-extrabold">{isAnnual ? plan.priceYearlyDisplay : plan.priceMonthlyDisplay}</span>
                  <span className="text-base font-medium">{isAnnual && plan.priceYearlyDisplay !== 'Free' ? '/year' : (plan.priceMonthlyDisplay !== 'Free' ? '/month' : '')}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <svg className={`flex-shrink-0 h-6 w-6 mr-2 ${plan.highlight ? plan.accentColor : plan.accentColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => handleChoosePlan(plan)}
                  disabled={subscribingPlanId === plan.id}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${plan.buttonClass} ${subscribingPlanId === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {subscribingPlanId === plan.id ? 'Processing...' : plan.cta}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto text-left space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Can I change my plan later?</h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time from your account settings.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards and PayPal. For Enterprise plans, we also support bank transfers.</p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Trusted Payment Gateways</h2>
          <div className="flex justify-center items-center space-x-8 flex-wrap">
            <Image src="/images/gateways/stripe-logo.png" alt="Stripe" width={100} height={40} className="h-10 object-contain my-2" />
            <Image src="/images/gateways/paystack-logo.png" alt="Paystack" width={120} height={40} className="h-10 object-contain my-2" />
            <Image src="/images/gateways/flutterwave-logo.png" alt="Flutterwave" width={150} height={40} className="h-10 object-contain my-2" />
            <Image src="/images/gateways/alipay-logo.png" alt="Alipay" width={100} height={40} className="h-10 object-contain my-2" />
            <Image src="/images/gateways/wechatpay-logo.png" alt="WeChat Pay" width={130} height={40} className="h-10 object-contain my-2" />
            <Image src="/images/gateways/klarna-logo.png" alt="Klarna" width={90} height={40} className="h-10 object-contain my-2" />
            <Image src="/images/gateways/paypal-logo.png" alt="PayPal" width={100} height={40} className="h-10 object-contain my-2" />
            <Image src="/images/gateways/wise-logo.png" alt="Wise" width={90} height={40} className="h-10 object-contain my-2" />
            <Image src="/images/gateways/googlepay-logo.png" alt="Google Pay" width={80} height={40} className="h-10 object-contain my-2" />
            <Image src="/images/gateways/applepay-logo.png" alt="Apple Pay" width={80} height={40} className="h-10 object-contain my-2" />
            <Image src="/images/gateways/bank-transfer-icon.png" alt="Bank Transfer" width={70} height={40} className="h-10 object-contain my-2" />
          </div>
        </div>

        <footer className="mt-16 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} AfroAsiaConnect. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
