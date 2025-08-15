'use client';

import Link from "next/link";
import { Suspense } from 'react';

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getResults(query: string) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";
  const [companiesRes, productsRes] = await Promise.all([
    fetch(`${API_BASE}/api/companies?q=${encodeURIComponent(query)}`),
    fetch(`${API_BASE}/api/products?q=${encodeURIComponent(query)}`),
  ]);
  if (!companiesRes.ok || !productsRes.ok) {
    throw new Error("Failed to fetch search results");
  }
  const [companies, products] = await Promise.all([
    companiesRes.json(),
    productsRes.json(),
  ]);
  return { companies, products };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.query || "";
  const { companies, products } = await getResults(query);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Search results for "{query}"</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Companies</h2>
        {companies.length === 0 ? (
          <p>No matching companies.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((c: any) => (
              <li key={c.id} className="border p-4 rounded-md bg-white/60 backdrop-blur-sm">
                <h3 className="text-xl font-medium mb-1">{c.name}</h3>
                <p className="text-sm text-gray-700 mb-2">{c.industry}</p>
                <p className="text-sm text-gray-600">{c.location}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Products</h2>
        {products.length === 0 ? (
          <p>No matching products.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p: any) => (
              <li key={p.id} className="border p-4 rounded-md bg-white/60 backdrop-blur-sm">
                <h3 className="text-xl font-medium mb-1">{p.title}</h3>
                <p className="text-sm text-gray-700 mb-2">{p.category}</p>
                <p className="text-sm text-gray-600">Supplier: {p.company?.name}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8">
        <Link href="/" className="text-sky-600 hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
