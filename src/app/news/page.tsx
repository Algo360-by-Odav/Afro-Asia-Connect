'use client';

import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/config/api";

// Utility: simple headline templating (AI-ready placeholder)
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
  const [spotlight, setSpotlight] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all"); // all | featured | latest | industry | country
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(1);
  const [personalizeSpotlight, setPersonalizeSpotlight] = useState(false);
  const [preferredIndustry, setPreferredIndustry] = useState("");
  const [spotlightLoading, setSpotlightLoading] = useState(true);
  const [currentSpotlightIndex, setCurrentSpotlightIndex] = useState(0);
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
        const url = `${API_BASE_URL}/premium-news?${params.toString()}`;
        console.log('Fetching news from:', url);
        const res = await fetch(url, { cache: 'no-store' });
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

  // Load spotlight (3 items max)
  useEffect(() => {
    async function loadSpotlight() {
      setSpotlightLoading(true);
      try {
        const params = new URLSearchParams();
        if (personalizeSpotlight && preferredIndustry) {
          params.set('industryInterest', preferredIndustry);
        }
        const url = `${API_BASE_URL}/premium-news/spotlight${params.toString() ? '?' + params.toString() : ''}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setSpotlight(data.items || []);
        setCurrentSpotlightIndex(0);
      } catch (e) {
        console.warn('Failed to load spotlight', e);
        setSpotlight([]);
      } finally {
        setSpotlightLoading(false);
      }
    }
    loadSpotlight();
  }, [personalizeSpotlight, preferredIndustry]);

  // Auto-scroll spotlight every 5 seconds
  useEffect(() => {
    if (spotlight.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSpotlightIndex(prev => (prev + 1) % spotlight.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [spotlight.length]);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`${API_BASE_URL}/categories`, { cache: 'force-cache' });
        if (!res.ok) return;
        const data = await res.json();
        setCategories((data.items || []).map((c: any) => ({ name: c.name, slug: c.slug })));
      } catch (e) {
        console.warn('Failed to load categories', e);
      }
    }
    loadCategories();
  }, []);

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
          <div className="font-extrabold text-xl">AfroAsiaConnect <span className="text-[#0A2342]">News</span></div>
          <div className="flex-1" />
          <div className="w-full max-w-xl flex items-center gap-2">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search companies, industries, countries…"
              className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0A2342]"
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
              className={`px-4 py-2 rounded-full border ${tab === t.id ? "bg-[#0A2342] text-white" : "bg-white"}`}
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
        {/* Categories bar */}
        {categories.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pb-4 overflow-x-auto">
            <div className="flex gap-2">
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => { setTab('industry'); setIndustry(c.name); }}
                  className="px-3 py-1.5 rounded-full border bg-white text-sm whitespace-nowrap hover:bg-gray-50"
                  title={`Browse ${c.name}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <main className="lg:col-span-8 space-y-4">
          {/* Personalization Controls */}
          <section className="bg-white rounded-2xl border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Personalization</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={personalizeSpotlight}
                  onChange={(e) => setPersonalizeSpotlight(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Personalize spotlight</span>
              </label>
            </div>
            {personalizeSpotlight && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Preferred Industry:</label>
                <select
                  value={preferredIndustry}
                  onChange={(e) => setPreferredIndustry(e.target.value)}
                  className="border rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">Select industry...</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {preferredIndustry && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    ✓ Spotlight personalized for {preferredIndustry}
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Spotlight carousel */}
          {spotlightLoading ? (
            <section className="bg-gradient-to-r from-[#0A2342] to-[#1a3a5c] text-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="h-6 bg-white/20 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-white/20 rounded w-16 animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="min-w-[260px] bg-white/10 rounded-xl p-4 border border-white/15">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-white/20 animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-white/20 rounded mb-1 animate-pulse"></div>
                        <div className="h-3 bg-white/20 rounded w-3/4 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-white/20 rounded animate-pulse"></div>
                      <div className="h-3 bg-white/20 rounded w-5/6 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : spotlight.length > 0 ? (
            <section className="bg-gradient-to-r from-[#0A2342] to-[#1a3a5c] text-white rounded-2xl p-4 shadow-sm relative">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Today's Spotlight</h3>
                <div className="flex items-center gap-2">
                  {personalizeSpotlight && preferredIndustry && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Personalized</span>
                  )}
                  <span className="text-xs opacity-80">{spotlight.length} featured</span>
                </div>
              </div>
              
              {/* Navigation arrows */}
              {spotlight.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentSpotlightIndex(prev => prev === 0 ? spotlight.length - 1 : prev - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors z-10"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentSpotlightIndex(prev => (prev + 1) % spotlight.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors z-10"
                  >
                    →
                  </button>
                </>
              )}
              
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentSpotlightIndex * 100}%)` }}
                >
                  {spotlight.map((s, index) => (
                    <div key={s.id} className="w-full flex-shrink-0 px-2">
                      <div className="bg-white/10 rounded-xl p-4 border border-white/15">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white font-semibold">
                            {(s.company?.name || '?').slice(0,2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{s.company?.name}</div>
                            <div className="text-xs opacity-80 truncate">{s.company?.industry} • {s.company?.location}</div>
                          </div>
                        </div>
                        <p className="text-sm leading-snug opacity-95 line-clamp-3">{s.blurb}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Dots indicator */}
              {spotlight.length > 1 && (
                <div className="flex justify-center gap-2 mt-3">
                  {spotlight.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSpotlightIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentSpotlightIndex ? 'bg-white' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className="bg-gray-100 rounded-2xl p-8 text-center">
              <div className="text-gray-400 text-4xl mb-2">📰</div>
              <h3 className="font-semibold text-gray-600 mb-1">No Spotlight Available</h3>
              <p className="text-sm text-gray-500">Check back later for featured companies.</p>
            </section>
          )}
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
                    <a href={card.profileUrl} className="px-3 py-2 bg-[#0A2342] text-white rounded-xl">View Profile</a>
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

          <section className="bg-[#0A2342]/5 border border-[#0A2342]/20 rounded-2xl p-4">
            <div className="text-sm uppercase tracking-wide text-[#0A2342] mb-1">Sponsored</div>
            <div className="font-semibold mb-2">Feature your company here</div>
            <p className="text-sm text-[#0A2342]/80 mb-3">Upgrade to Premium+ to reserve a fixed spotlight on the News page.</p>
            <a href="/pricing" className="px-3 py-2 bg-[#0A2342] text-white rounded-xl">Upgrade</a>
          </section>
        </aside>
      </div>
    </div>
  );
}
