import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      body:
        'By accessing or using the AfroAsiaConnect platform (the “Platform”), you agree to be bound by these Terms and Conditions (the “Terms”). If you do not agree to all of the Terms, you may not access or use the Platform.'
    },
    {
      title: '2. Eligibility',
      body:
        'The Platform is intended for use by legally registered businesses and authorised representatives who are at least 18 years old. By using the Platform, you represent and warrant that you meet these eligibility requirements.'
    },
    {
      title: '3. Account Registration',
      body:
        'To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration and to keep your account information updated. You are responsible for safeguarding your password and all activities that occur under your account.'
    },
    {
      title: '4. Business Listings',
      body:
        'You may create and manage business listings subject to our verification process. You warrant that all information provided is truthful and not misleading. AfroAsiaConnect reserves the right to remove or suspend any listing that violates these Terms or applicable laws.'
    },
    {
      title: '5. Subscription Fees & Payments',
      body:
        'Premium features may require payment of subscription fees. All fees are quoted in U.S. Dollars unless stated otherwise. Payments are processed via our authorised payment partners. Fees are non-refundable except as required by law.'
    },
    {
      title: '6. Content Ownership & Licence',
      body:
        'You retain ownership of the content you upload, but grant AfroAsiaConnect a worldwide, non-exclusive, royalty-free licence to host, display, and distribute such content for the purposes of operating and promoting the Platform.'
    },
    {
      title: '7. Prohibited Activities',
      body:
        'You agree not to: (a) post false or fraudulent information; (b) infringe any third-party rights; (c) transmit viruses or malicious code; (d) engage in spamming, phishing, or other abusive practices; (e) reverse engineer or attempt to gain unauthorised access to the Platform.'
    },
    {
      title: '8. Intellectual Property',
      body:
        'All trademarks, logos, and service marks displayed on the Platform are the property of AfroAsiaConnect or their respective owners. Except for the limited licence granted herein, nothing in these Terms gives you any rights to such intellectual property.'
    },
    {
      title: '9. Privacy',
      body:
        'Our collection and use of personal data are governed by our Privacy Policy, which is incorporated by reference into these Terms. By using the Platform, you consent to the processing of your data as described therein.'
    },
    {
      title: '10. Disclaimers',
      body:
        'The Platform and all content are provided “as is” without warranty of any kind. AfroAsiaConnect does not guarantee the accuracy, completeness, or usefulness of any information nor the performance of any listed business.'
    },
    {
      title: '11. Limitation of Liability',
      body:
        'To the fullest extent permitted by law, AfroAsiaConnect shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues arising out of or related to your use of the Platform.'
    },
    {
      title: '12. Indemnification',
      body:
        'You agree to indemnify and hold AfroAsiaConnect, its affiliates, and their respective officers, directors, and employees harmless from any claims, damages, losses, or expenses arising out of your breach of these Terms or misuse of the Platform.'
    },
    {
      title: '13. Termination',
      body:
        'We may suspend or terminate your access to the Platform at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users or the Platform.'
    },
    {
      title: '14. Governing Law & Dispute Resolution',
      body:
        'For the purposes of the GDPR and Malaysia\'s Personal Data Protection Act 2010 (PDPA), AfroAsiaConnect acts as a Data Controller for its direct relationships with users and as a Data Processor when processing Personal Data on behalf of Premium Subscribers who upload customer or supplier data.'
    },
    {
      title: '15. Modifications',
      body:
        'AfroAsiaConnect reserves the right to modify these Terms at any time. We will post the updated Terms and indicate the “Last Updated” date. Your continued use of the Platform after such changes constitutes acceptance of the revised Terms.'
    },
    {
      title: '16. Contact Us',
      body:
        'If you have any questions about these Terms, please email us at legal@afroasiaconnect.com.'
    },
    // ----- Privacy Policy (incorporated) -----
    {
      title: '17. Privacy Policy Overview',
      body:
        'This Privacy Policy explains how AfroAsiaConnect collects, uses, and protects your personal information in connection with the Platform. By using the Platform, you consent to the data practices described herein.'
    },
    {
      title: '18. Information We Collect',
      body:
        'We collect information you provide directly (such as contact details and listing information) and automatically through cookies and similar technologies (such as IP address, browser type, and pages visited).'
    },
    {
      title: '19. How We Use Your Information',
      body:
        'We use your information to operate the Platform, verify listings, process payments, provide customer support, improve our services, and send important notices or marketing communications (which you can opt out of at any time).'
    },
    {
      title: '20. Cookies & Tracking Technologies',
      body:
        'We use cookies and similar technologies to recognise you on return visits, remember your preferences, and analyse site traffic. You may disable cookies in your browser, but some features of the Platform may not function properly.'
    },
    {
      title: '21. Sharing & Disclosure',
      body:
        'We do not sell your personal data. We may share information with trusted third-party service providers (e.g., payment processors, hosting partners) who are contractually bound to safeguard it, or where required by law.'
    },
    {
      title: '22. International Data Transfers',
      body:
        'Your information may be transferred to—and processed in—countries other than your own. We take appropriate safeguards to protect your data in accordance with applicable laws.'
    },
    {
      title: '23. Data Security',
      body:
        'We implement technical and organisational measures to protect your information against unauthorised access, loss, or alteration. However, no method of transmission over the Internet is entirely secure.'
    },
    {
      title: '24. Your Rights',
      body:
        'For the purposes of the General Data Protection Regulation (GDPR) and Malaysia’s Personal Data Protection Act 2010 (PDPA), AfroAsiaConnect acts as a Data Controller in its direct relationships with users, such as when collecting and managing user account information. AfroAsiaConnect also acts as a Data Processor when handling Personal Data on behalf of Premium Subscribers, such as when those subscribers upload or manage customer or supplier information via the platform.'
    },
    {
      title: '25. Data Retention',
      body:
        'We retain personal data only as long as necessary to fulfil the purposes outlined in this Policy or as required by law.'
    },
    {
      title: '26. Changes to This Privacy Policy',
      body:
        'We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new Policy on the Platform and updating the “Last Updated” date.'
    },

    {
      title: '27. Lawful Basis for Processing',
      body:
        'We process Personal Data on the lawful bases of contract performance, legitimate interests, consent, and compliance with legal obligations.'
    },
    {
      title: '28. Sub-Processors',
      body:
        'A current list of authorised Sub-Processors (e.g., hosting, email, payment providers) is available on request. AfroAsiaConnect shall enter into written agreements with all Sub-Processors imposing data-protection obligations equivalent to those set out herein.'
    },
    {
      title: '29. Security Measures',
      body:
        'AfroAsiaConnect implements appropriate technical and organisational measures (including encryption in transit, access controls, and regular penetration testing) to ensure a level of security appropriate to the risk.'
    },
    {
      title: '30. Personal Data Breach Notification',
      body:
        'In the event of a Personal Data Breach, AfroAsiaConnect will notify affected Customers without undue delay and provide information regarding the nature of the breach, affected data categories, and remediation steps.'
    },
    {
      title: '31. Data Subject Requests',
      body:
        'Where AfroAsiaConnect processes Personal Data on behalf of a Customer, it shall, to the extent legally permitted, assist the Customer in fulfilling its obligation to respond to Data Subject Requests (access, rectification, erasure, etc.).'
    },
    {
      title: '32. Data Retention & Deletion',
      body:
        'Upon termination of services, AfroAsiaConnect will delete or return Personal Data processed on behalf of the Customer, unless retention is required by law.'
    },
    {
      title: '33. Audit Rights',
      body:
        'On reasonable prior notice, Customers may audit AfroAsiaConnect’s compliance with this DPA once per year, either by reviewing third-party certifications or conducting an on-site inspection subject to confidentiality obligations.'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <article className="bg-white max-w-4xl mx-auto p-8 md:p-10 rounded-xl shadow-md prose prose-slate">
        <h1 className="text-center">Terms &amp; Conditions &mdash; Data Processing Agreement (GDPR / PDPA)</h1>
      <p className="text-center text-sm text-slate-500 mb-10">Last Updated: 8 July 2025</p>

      {sections.map((sec) => (
        <section key={sec.title} className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">{sec.title}</h2>
          <p className="text-slate-700 leading-relaxed">{sec.body}</p>
        </section>
      ))}

      <p className="text-sm text-slate-600 mt-12">
        By using the Platform you acknowledge that you have read, understood, and agreed to these Terms. If you do not
        agree, please discontinue use of the Platform.
      </p>

      <p className="text-center mt-8">
        <Link href="/" className="text-sky-600 hover:underline">
          Return to Home
        </Link>
      </p>
      </article>
    </div>
  );
}
