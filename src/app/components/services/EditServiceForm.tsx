"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config/api';

interface EditServiceFormProps {
  service: any;
  onUpdated?: () => void;
}

export default function EditServiceForm({ service, onUpdated }: EditServiceFormProps) {
  const { token } = useAuth();
  const router = useRouter();

  interface ServiceFormData {
    service_name: string;
    service_category: string;
    description: string;
    price: string;
    is_active: boolean;
    website: string;
    linkedin: string;
    yearFounded: string;
    whatsapp: string;
  }
  const [formData, setFormData] = useState<ServiceFormData>({
    service_name: service.serviceName,
    service_category: service.serviceCategory,
    description: service.description || '',
    price: service.price?.toString() || '',
    is_active: service.isActive,
    website: service.user?.company?.website || '',
    linkedin: service.user?.company?.linkedin || '',
    yearFounded: service.user?.company?.yearFounded?.toString() || '',
    whatsapp: service.user?.company?.whatsapp || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      service_name: service.serviceName,
      service_category: service.serviceCategory,
      description: service.description || '',
      price: service.price?.toString() || '',
      is_active: service.isActive,
      website: service.user?.company?.website || '',
      linkedin: service.user?.company?.linkedin || '',
      yearFounded: service.user?.company?.yearFounded?.toString() || '',
      whatsapp: service.user?.company?.whatsapp || '',
    });
  }, [service]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as any;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Not authenticated');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update service');
      }
      if (onUpdated) onUpdated();
      router.push('/dashboard/services');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-red-100 text-red-800 text-sm">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Service Name
        </label>
        <input
          type="text"
          name="service_name"
          value={formData.service_name}
          onChange={handleChange}
          required
          className="w-full border border-slate-300 rounded-md px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Category
        </label>
        <input
          type="text"
          name="service_category"
          value={formData.service_category}
          onChange={handleChange}
          required
          className="w-full border border-slate-300 rounded-md px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full border border-slate-300 rounded-md px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Price (optional)
        </label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          min="0"
          step="0.01"
          className="w-full border border-slate-300 rounded-md px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
        <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email (read-only)</label>
        <input type="email" value={service.user.email} disabled className="w-full bg-slate-100 border border-slate-300 rounded-md px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn</label>
        <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Established (Year)</label>
        <input type="number" name="yearFounded" value={formData.yearFounded} onChange={handleChange} min="1900" max="2099" className="w-full border border-slate-300 rounded-md px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
        <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          id="is_active"
          className="h-4 w-4 text-sky-600 border-slate-300 rounded"
        />
        <label htmlFor="is_active" className="text-sm text-slate-700">
          Active
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Updating...' : 'Update Service'}
      </button>
    </form>
  );
}
