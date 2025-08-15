'use client';

import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import CreateServiceForm from '@/app/components/services/CreateServiceForm';

export default function CreateServicePage() {
  const { user, isLoading } = useAuth();

  if (!isLoading && (!user || user.user_type !== 'service_provider')) {
    redirect('/dashboard');
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Service</h1>
      <CreateServiceForm />
    </div>
  );
}
