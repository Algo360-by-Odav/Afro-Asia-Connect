'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Edit3, Trash2, ToggleLeft, ToggleRight, PlusCircle } from 'lucide-react';

interface Service {
  id: string;
  serviceName: string;
  serviceCategory: string;
  isActive: boolean;
  user?: { companies?: { name?: string }[] };
}

interface FetchServicesResponse {
  services: Service[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export default function ManageServicesPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchServices = useCallback(async (page = 1) => {
    if (!user || user.user_type !== 'service_provider' || !token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/services/my-services?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch services.' }));
        throw new Error(errorData.message || 'Failed to fetch services');
      }
      const data: FetchServicesResponse = await response.json();
      setServices(data.services as any);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (!authLoading) {
      if (user && user.user_type === 'service_provider') {
        fetchServices(currentPage);
      } else if (user && user.user_type !== 'service_provider') {
        setError('Access Denied: This page is for service providers only.');
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [authLoading, user, fetchServices, currentPage]);

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    if (!token) return;

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete service.');
      fetchServices(currentPage);
      alert('Service deleted successfully.');
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    }
  };

  const toggleServiceStatus = async (service: Service) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      if (!response.ok) throw new Error('Failed to update service status.');
      fetchServices(currentPage);
      alert('Service status updated.');
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 text-center">
        <p>Loading services...</p>
      </div>
    );
  }

  if (user && user.user_type !== 'service_provider') {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Access Denied: Service providers only.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Services</h1>
        <Link
          href="/dashboard/services/create"
          className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-all duration-200"
        >
          <PlusCircle size={18} className="mr-2" /> Add New Service
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 text-sm text-red-800 bg-red-100 rounded-md">{error}</div>
      )}

      {services.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-600 text-lg">You haven't created any services yet.</p>
          <Link
            href="/dashboard/services/create"
            className="mt-4 inline-block px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Create Your First Service
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {service.user?.companies?.[0]?.name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {service.serviceCategory}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/services/${service.id}`}
                        title="View Public Page"
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                      >
                        <Eye size={18} className="hover:scale-110 transition-transform duration-200" />
                      </Link>
                      <Link
                        href={`/dashboard/services/edit/${service.id}`}
                        title="Edit Service"
                        className="text-yellow-600 hover:text-yellow-800 transition-colors duration-200"
                      >
                        <Edit3 size={18} className="hover:scale-110 transition-transform duration-200" />
                      </Link>
                      <button
                        onClick={() => toggleServiceStatus(service)}
                        title="Toggle Status"
                        className="text-green-600 hover:text-green-800 transition-colors duration-200"
                      >
                        <ToggleRight size={18} className="hover:scale-110 transition-transform duration-200" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        title="Delete Service"
                        className="text-red-600 hover:text-red-800 transition-colors duration-200"
                      >
                        <Trash2 size={18} className="hover:scale-110 transition-transform duration-200" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={() => fetchServices(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => fetchServices(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}



