"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  return (
    <section className="bg-[var(--background-light-gray)] py-20 md:py-32 w-full">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-8 bg-clip-text bg-gradient-to-r from-sky-400 to-sky-600">
          Connect, Trade, and Grow with AfroAsiaConnect
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto font-medium">
          Discover businesses, services, and opportunities across African and Asian markets. Your premier B2B directory.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <form
            className="flex items-center"
            onSubmit={(e) => {
              e.preventDefault();
              if (search.trim()) router.push(`/search?query=${encodeURIComponent(search)}`);
            }}
          >
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find your next business partner..."
              className="w-full px-5 py-3 text-gray-700 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)] focus:border-transparent"
            />
            <button 
              type="submit" 
              className="bg-[var(--cta-emerald)] text-white px-6 py-3 rounded-r-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150"
            >
              Search
            </button>
          </form>
        </div>

        {/* Quick Filters Placeholder */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4">
          <button className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition duration-150">
            Technology
          </button>
          <button className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition duration-150">
            Agriculture
          </button>
          <button className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition duration-150">
            Manufacturing
          </button>
          <button className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition duration-150">
            Consultancy
          </button>
          <button className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition duration-150">
            Logistics & Supply Chain
          </button>
          <button className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition duration-150">
            Trade & Export
          </button>
          <button className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition duration-150">
            Healthcare
          </button>
        </div>
      </div>
    </section>
  );
}
