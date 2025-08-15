import { API_BASE_URL } from '@/config/api';

export async function getServiceProviderData(id: string) {
  const response = await fetch(`${API_BASE_URL}/services/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch service');
  }

  return response.json();
}
