"use client";

import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { API_BASE_URL } from '@/config/api';
import EditServiceForm from '@/app/components/services/EditServiceForm';

export default function EditServicePage() {
  const { user, token, isLoading } = useAuth();
  const params = useParams();
  const [service, setService] = useState<any>(null);

  if (!isLoading && (!user || user.user_type !== 'service_provider')) {
    redirect('/dashboard');
  }

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/services/${params?.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          redirect('/dashboard/services');
        }
        const data = await response.json();
        setService(data);
      } catch (error) {
        redirect('/dashboard/services');
      }
    };

    fetchService();
  }, [params?.id, token]);

  if (isLoading || !service) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Service</h1>
      <EditServiceForm service={service} />
    </div>
  );
}
