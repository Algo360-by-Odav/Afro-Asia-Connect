'use client';

import React, { useEffect, useMemo, useState } from "react";

function makeHeadline(c: any) {
  const templates = [
    `${c.name} strengthens ${c.industry} links across ${c.region} markets`,
    `${c.name} expands ${c.productFocus} supply from ${c.country} to Asia`,
    `${c.name} boosts cross-border trade efficiency with premium services`,
  ];
  return templates[c.name.length % templates.length];
}

const badges = {
  premium: "bg-yellow-100 text-yellow-800",
  featured: "bg-blue-100 text-blue-800",
};

export default function NewsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all"); // all | featured | latest | industry | country
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (industry) params.set("industry", industry);
      if (country) params.set("country", country);
      if (tab === "featured") params.set("featured", "1");

      try {
        console.log('Fetching news from:', `/api/premium-news?${params.toString()}`);
        const res = await fetch(`/api/premium-news?${params.toString()}`);
        console.log('Response status:', res.status);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log('API response data:', data);
        setItems(data.items || []);
      } catch (error) {
        console.error('Error loading news:', error);
        setItems([]);
      }

      setLoading(false);
      setPage(1);
    }
    load();
  }, [q, industry, country, tab]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page]);

  const industries = useMemo(() => Array.from(new Set(items.map(i => i.industry))).sort(), [items]);
  const countries = useMemo(() => Array.from(new Set(items.map(i => i.country))).sort(), [items]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="font-extrabold text-xl">AfroAsiaConnect <span className="text-blue-600">News</span></div>
          <div className="flex-1" />
          <div className="w-full max-w-xl flex items-center gap-2">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search companies, industries, countries…"
              className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={() => setQ("")} className="px-3 py-2 border rounded-xl">Clear</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-3 flex items-center gap-2 overflow-x-auto">
          {[
            { id: "all", label: "All" },
            { id: "featured", label: "Featured" },
            { id: "latest", label: "Latest" },
            { id: "industry", label: "By Industry" },
            { id: "country", label: "By Country" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full border ${tab === t.id ? "bg-blue-600 text-white" : "bg-white"}`}
            >{t.label}</button>
          ))}
          {/* Conditional filters */}
          {tab === "industry" && (
            <select 
              value={industry} 
              onChange={e => setIndustry(e.target.value)} 
              className="ml-2 border rounded-xl px-3 py-2"
              title="Filter by industry"
            >
              <option value="">All industries</option>
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          )}
          {tab === "country" && (
            <select 
              value={country} 
              onChange={e => setCountry(e.target.value)} 
              className="ml-2 border rounded-xl px-3 py-2"
              title="Filter by country"
            >
              <option value="">All countries</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <main className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Loading news…</div>
          ) : paged.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No news found.</div>
          ) : (
            paged.map(card => (
              <article key={card.id} className="bg-white rounded-2xl border shadow-sm p-4 flex gap-4">
                <img src={card.logo} alt={card.name} className="w-20 h-20 rounded-xl object-cover border" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate">{card.name}</h3>
                    {card.isFeatured && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${badges.featured}`}>Featured</span>
                    )}
                    {card.plan === "premium" && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${badges.premium}`}>Premium</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{card.industry} • {card.country}</p>
                  <h4 className="text-base font-medium mb-1">{makeHeadline(card)}</h4>
                  <p className="text-sm text-gray-700 line-clamp-2">{card.blurb}</p>

                  <div className="mt-3 flex items-center gap-2">
                    <a href={card.profileUrl} className="px-3 py-2 bg-blue-600 text-white rounded-xl">View Profile</a>
                    <a href={card.contactUrl || card.profileUrl} className="px-3 py-2 border rounded-xl">Contact</a>
                  </div>
                </div>
              </article>
            ))
          )}

          {/* Pagination */}
          {items.length > pageSize && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-500">Page {page} of {Math.ceil(items.length / pageSize)}</span>
              <div className="space-x-2">
                <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-2 border rounded-xl disabled:opacity-50">Prev</button>
                <button disabled={page >= Math.ceil(items.length / pageSize)} onClick={() => setPage(p => p + 1)} className="px-3 py-2 border rounded-xl disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-4">
          <section className="bg-white rounded-2xl border p-4">
            <h5 className="font-semibold mb-3">Trending Companies</h5>
            <ul className="space-y-2">
              {items.slice(0, 5).sort((a,b) => (b.views||0)-(a.views||0)).map(t => (
                <li key={t.id} className="flex items-center gap-3">
                  <img src={t.logo} alt={t.name} className="w-10 h-10 rounded-lg object-cover border" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.name}</div>
                    <div className="text-xs text-gray-600 truncate">{t.industry} • {t.country}</div>
                  </div>
                  <a href={t.profileUrl} className="text-xs px-2 py-1 border rounded-lg">View</a>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="text-sm uppercase tracking-wide text-blue-700 mb-1">Sponsored</div>
            <div className="font-semibold mb-2">Feature your company here</div>
            <p className="text-sm text-blue-800 mb-3">Upgrade to Premium+ to reserve a fixed spotlight on the News page.</p>
            <a href="/pricing" className="px-3 py-2 bg-blue-600 text-white rounded-xl">Upgrade</a>
          </section>
        </aside>
      </div>
    </div>
  );
}
