const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

export async function fetchCompanies(query: string = '') {
  const res = await fetch(`${API_BASE}/api/companies?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to fetch companies');
  return res.json();
}

export async function fetchProducts(query: string = '') {
  const res = await fetch(`${API_BASE}/api/products?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}
