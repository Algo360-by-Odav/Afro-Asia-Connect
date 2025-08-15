import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="bg-slate-50 min-h-screen flex justify-center items-start py-8 px-4 sm:px-6 lg:px-8">
      <article className="bg-white w-full max-w-4xl p-8 md:p-10 rounded-xl shadow-md prose prose-slate text-gray-800 prose-headings:text-slate-900">
        <h1 className="text-center">About Us</h1>
        <p>
          <strong>AfroAsiaConnect</strong> is a premier B2B directory platform designed to bridge trade,
          investment, and industrial collaboration between Africa and Asia. Headquartered in Malaysia,
          our mission is to connect businesses, promote cross-border partnerships, and empower entrepreneurs
          across emerging and established markets.
        </p>

        <p>
          We provide a dynamic and trusted platform where verified companies, exporters, importers,
          manufacturers, service providers, and investors can discover new opportunities, showcase their
          brands, and build lasting business relationships.
        </p>

        <p>
          Whether you're a local SME looking to expand globally or a multinational seeking reliable partners,
          AfroAsiaConnect simplifies your business journey through:
        </p>
        <ul>
          <li>Verified business listings</li>
          <li>Smart matchmaking and lead generation</li>
          <li>Premium profile tools</li>
          <li>Access to trade fairs, expos, and industry events</li>
        </ul>

        <p>
          Backed by a team of passionate professionals and trade experts, we are committed to advancing
          economic growth, innovation, and sustainable development by promoting transparent, inclusive,
          and digitally powered trade networks between two of the world’s fastest-growing regions.
        </p>

        <h2 className="mt-10">🌍 Our Vision</h2>
        <p>
          To be the most trusted digital hub for Afro-Asian business connectivity, driving inclusive
          economic growth through strategic partnerships and market access.
        </p>

        <h2 className="mt-8">🤝 Our Mission</h2>
        <ul>
          <li>To enable seamless B2B collaboration across borders</li>
          <li>To provide reliable digital infrastructure for trade and investment</li>
          <li>To foster transparency, trust, and access to global markets</li>
        </ul>

        <p className="mt-8 font-semibold text-center">
          Join AfroAsiaConnect today and become part of a growing network of forward-thinking businesses
          building the future of intercontinental commerce.
        </p>

        <p className="text-center mt-10">
          <Link href="/" className="text-sky-600 hover:underline">
            Return to Home
          </Link>
        </p>
      </article>
    </div>
  );
}
