import React from 'react';
import Link from 'next/link';

interface Section {
  title: string;
  body: string;
}

const sections: Section[] = [
  {
    title: '1. Information We Collect',
    body: `a. Business Information  
• Company name, address, phone number  
• Business category, services/products offered  
• Website and social-media links  
  
b. Personal Information  
• Name, email address, phone number of business representatives  
• Login credentials (encrypted)  
• Profile picture or user bio (optional)  
  
c. Usage Data  
• IP address  
• Device type, browser, and OS  
• Access times, pages visited, referring URL  
  
d. Cookies & Tracking  
We use cookies and similar technologies to enhance user experience, remember login sessions, and track analytics.`,
  },
  {
    title: '2. How We Use Your Information',
    body:
      '• Facilitate connections between businesses\n• Improve directory services and search capabilities\n• Communicate account updates, offers, and news\n• Prevent fraud and enhance security\n• Comply with legal obligations',
  },
  {
    title: '3. Sharing Your Information',
    body:
      'We do not sell personal data. We may share it with:\n• Service providers (maintenance, hosting, analytics)\n• Business partners only with your consent (e.g., featured listings)\n• Legal authorities when required by law or to protect our rights',
  },
  {
    title: '4. Data Retention',
    body:
      'We retain information as long as necessary to fulfil the purposes in this policy and meet legal or regulatory requirements.\nYou may request deletion at any time via privacy@afroasiaconnect.com.',
  },
  {
    title: '5. Security of Your Information',
    body:
      'We use administrative, technical, and physical safeguards, but no electronic transmission or storage method is 100 % secure. Use the Platform at your own risk.',
  },
  {
    title: '6. Your Privacy Rights',
    body:
      'Depending on your region you may:\n• Access, correct, or delete your data\n• Object to or restrict processing\n• Request a portable copy of your data\nContact privacy@afroasiaconnect.com to exercise these rights.',
  },
  {
    title: '7. Third-Party Links',
    body:
      'Our Platform may contain links to third-party websites or tools. We are not responsible for their privacy practices; please review their policies separately.',
  },
  {
    title: '8. Children’s Privacy',
    body:
      'Our services are not intended for individuals under 18. We do not knowingly collect personal data from children.',
  },
  {
    title: '9. Updates to This Policy',
    body:
      'We may update this Policy from time to time. Changes will be posted here with a new “Effective Date.” Continued use signifies acceptance of the changes.',
  },
  {
    title: '10. Contact Us',
    body:
      'Afro Asia Connect\nEmail: privacy@afroasiaconnect.com\nAddress: 65-1, Jalan SP 1, Taman Semabok Perdana, 75050 Melaka',
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <article className="bg-white max-w-4xl mx-auto p-8 md:p-10 rounded-xl shadow-md prose prose-slate">
        <h1 className="text-center">Privacy Policy</h1>
        <p className="text-center text-sm text-slate-500 mb-6">
          Effective Date: 07 Jul 2025&nbsp;&nbsp;|&nbsp;&nbsp;Last Updated: 08 Jul 2025
        </p>
        <p className="mb-8">
          Welcome to Afro Asia Connect (the “Platform”). We are committed to protecting
          your personal information and your right to privacy. This Privacy Policy
          explains how we collect, use, disclose, and safeguard your information when
          you use our web application and services. By using the Platform, you consent
          to the practices described below.
        </p>

        {sections.map(sec => (
          <section key={sec.title} className="mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              {sec.title}
            </h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {sec.body}
            </p>
          </section>
        ))}

        <p className="text-center mt-8">
          <Link href="/" className="text-sky-600 hover:underline">
            Return to Home
          </Link>
        </p>
      </article>
    </div>
  );
}