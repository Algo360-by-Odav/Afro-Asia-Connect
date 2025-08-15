import React from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What is AfroAsiaConnect?',
    answer:
      'AfroAsiaConnect is a B2B platform designed to connect businesses across Africa and Asia, providing tools for listings, events, leads, and more.',
  },
  {
    question: 'How do I create an account?',
    answer:
      'Click the “Sign Up” button at the top-right corner and fill in the short registration form. You will receive an email to verify your account.',
  },
  {
    question: 'Is AfroAsiaConnect free to use?',
    answer:
      'Yes, basic browsing is free. We also offer premium subscription tiers that unlock advanced features such as lead generation tools and enhanced visibility.',
  },
  {
    question: 'How can I upgrade my subscription?',
    answer:
      'Navigate to your Dashboard → Subscription Status, and click “Manage Subscription” to view plans and upgrade securely.',
  },
  {
    question: 'Who can I contact for support?',
    answer:
      'Email our support team at support@afroasiaconnect.com or open a ticket from your dashboard. We aim to respond within 24 hours.',
  },
  {
    question: 'Why is AfroAsiaConnect important for SMEs?',
    answer:
      'Small and medium-sized enterprises often struggle to identify reliable cross-border partners. AfroAsiaConnect centralises verified businesses and simplifies discovery, helping SMEs expand into new markets without large marketing budgets.',
  },
  {
    question: 'What benefits do premium plans provide?',
    answer:
      'Premium subscribers gain higher directory visibility, advanced analytics on profile views, priority placement in search results, and access to our lead-matching engine that sends curated buyer or supplier leads straight to your dashboard.',
  },
  {
    question: 'How does AfroAsiaConnect ensure trust and verification?',
    answer:
      'We manually vet all listings, request official registration documents, and use third-party data sources to validate business legitimacy. Verified profiles display a trust badge so partners can trade with confidence.',
  },
  {
    question: 'Can I network with partners outside my country?',
    answer:
      'Definitely. The platform is designed to connect businesses across all African and Asian regions. Use our advanced filters or attend virtual events to engage with potential partners worldwide.',
  },
  {
    question: 'How will AfroAsiaConnect help me find suppliers or buyers?',
    answer:
      'Beyond the directory search, our upcoming RFQ (Request for Quotation) tool lets you post your requirements. Matching suppliers/buyers are notified instantly, accelerating deal flow.',
  },
];

export default function FAQPage() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Frequently Asked Questions</h1>
        <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
          Find answers to the most common questions about AfroAsiaConnect. Still need help?{' '}
          <Link href="/contact" className="text-sky-600 hover:underline">
            Contact us
          </Link>
          .
        </p>
      </header>

      <div className="space-y-4">
        {faqs.map((item) => (
          <details
            key={item.question}
            className="group bg-white rounded-xl shadow-sm p-5 hover:shadow-sky-200/50 transition-shadow duration-300 open:shadow-sky-200/75"
          >
            <summary className="cursor-pointer list-none flex items-center justify-between font-medium text-slate-800">
              <span>{item.question}</span>
              <svg
                className="w-5 h-5 text-sky-600 group-open:rotate-180 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </summary>
            <p className="mt-3 text-slate-600 leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
