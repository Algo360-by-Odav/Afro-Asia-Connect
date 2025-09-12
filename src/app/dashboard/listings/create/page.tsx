'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; // Ensured correct import path
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Define a type for your form data
interface ListingFormData {
  logo_image_file?: File;
  logo_image_url?: string;
  business_name: string;
  business_category: string;
  country_of_origin: string;
  description: string;
  target_markets: string[];
  contact_email: string;
  contact_phone: string;
  website_url: string;
  gallery_image_urls: string[];
  gallery_image_files: File[];
}

export default function CreateListingPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<ListingFormData>({
    logo_image_file: undefined,
    logo_image_url: '',
    business_name: '',
    business_category: '',
    country_of_origin: '',
    description: '',
    target_markets: [],
    contact_email: '',
    contact_phone: '',
    website_url: '',
    gallery_image_urls: [],
    gallery_image_files: [],
  });
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not loading, and not a seller or not logged in
    const userRole = user?.role || user?.user_type;
    const isSellerRole = userRole === 'seller' || userRole === 'SUPPLIER';
    if (!authLoading && (!user || !isSellerRole)) {
      router.push('/login?redirect=/dashboard/listings/create');
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'target_markets' || name === 'gallery_image_urls') {
      setFormData(prev => ({ ...prev, [name]: value.split(',').map(item => item.trim()).filter(item => item) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setFormData(prev => ({
        ...prev,
        gallery_image_files: [...prev.gallery_image_files, ...files]
      }));
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setGalleryPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery_image_files: prev.gallery_image_files.filter((_, i) => i !== index)
    }));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) { 
      setError('Authentication token not found. Please log in again.'); 
      return; 
    }
    
    setIsSubmitting(true); 
    setError(null); 
    setSuccessMessage(null);

    try {
      console.log('Submitting form data:', formData);
      
      let updatedFormData = { ...formData };
      
      // Upload gallery images if any
      if (formData.gallery_image_files.length > 0) {
        const galleryUrls: string[] = [];
        
        for (const file of formData.gallery_image_files) {
          const galleryFormData = new FormData();
          galleryFormData.append('file', file);
          
          const uploadResponse = await fetch('http://127.0.0.1:3001/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: galleryFormData,
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            galleryUrls.push(uploadData.url);
          } else {
            console.warn('Gallery image upload failed for file:', file.name);
          }
        }
        
        // Combine uploaded URLs with existing URLs
        updatedFormData.gallery_image_urls = [...updatedFormData.gallery_image_urls, ...galleryUrls];
      }
      
      // Remove file objects before sending to API
      const { gallery_image_files, logo_image_file, ...submitData } = updatedFormData;
      
      const response = await fetch('http://127.0.0.1:3001/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const responseData = await response.json();
      console.log('Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.msg || responseData.message || 'Failed to create listing.');
      }

      setSuccessMessage('Listing created successfully! Redirecting...');
      setFormData({
        logo_image_file: undefined,
        logo_image_url: '',
        business_name: '',
        business_category: '',
        country_of_origin: '',
        description: '',
        target_markets: [],
        contact_email: '',
        contact_phone: '',
        website_url: '',
        gallery_image_urls: [],
        gallery_image_files: [],
      });
      setGalleryPreviews([]);
      
      setTimeout(() => {
        router.push('/dashboard/listings');
      }, 2000);

    } catch (err: any) {
      console.error('Submit error:', err);
      if (err.message.includes('Access denied')) {
        setError('Access denied. Your session may be outdated. Please log out and log back in to refresh your permissions.');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while auth is being checked
  if (authLoading) {
    return <div className="p-6 text-center"><p>Loading...</p></div>;
  }

  // If after loading, user is still not available or not a seller, show access denied.
  // This handles the case where useEffect might not have run yet or user is definitively not a seller.
  const userRole = user?.role || user?.user_type;
  const isSellerRole = userRole === 'seller' || userRole === 'SUPPLIER';
  if (!user || !isSellerRole) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-semibold text-red-600">Access Denied</h1>
        <p className="mt-4 text-slate-600">You must be a seller to create listings.</p>
        <Link href="/dashboard" className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // If user is a seller, render the form
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 sm:mb-8 text-center">Create New Listing</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-xl rounded-lg p-6 sm:p-8">
        {error && <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">{error}</div>}
        {successMessage && <div className="p-3 text-sm text-green-700 bg-green-100 border border-green-300 rounded-md">{successMessage}</div>}

        {/* Logo Image Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Logo Image</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e)=>{
              const file=e.target.files?.[0]; if(file){ setFormData(prev=>({...prev, logo_image_file:file, logo_image_url:URL.createObjectURL(file)})); }
            }} 
            className="mt-1 block w-full" 
            aria-label="Upload logo image"
          />
          {formData.logo_image_url && <img src={formData.logo_image_url} alt="Preview" className="mt-2 h-20 object-contain border rounded" />}
        </div>

        <div>
          <label htmlFor="business_name" className="block text-sm font-medium text-slate-700 mb-1">Business/Listing Name</label>
          <input
            type="text"
            name="business_name"
            id="business_name"
            value={formData.business_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="business_category" className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <input
            type="text" // Consider changing to a select dropdown if categories are predefined
            name="business_category"
            id="business_category"
            value={formData.business_category}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="country_of_origin" className="block text-sm font-medium text-slate-700 mb-1">Country of Origin</label>
          <input
            type="text"
            name="country_of_origin"
            id="country_of_origin"
            value={formData.country_of_origin}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            name="description"
            id="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="contact_email" className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
          <input
            type="email"
            name="contact_email"
            id="contact_email"
            value={formData.contact_email}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="contact_phone" className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
          <input
            type="tel"
            name="contact_phone"
            id="contact_phone"
            value={formData.contact_phone}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="website_url" className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
          <input
            type="url"
            name="website_url"
            id="website_url"
            value={formData.website_url}
            onChange={handleChange}
            placeholder="https://"
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="target_markets" className="block text-sm font-medium text-slate-700 mb-1">Target Markets (comma-separated)</label>
          <input
            type="text"
            name="target_markets"
            id="target_markets"
            value={formData.target_markets.join(', ')}
            onChange={handleChange}
            placeholder="Asia, Africa, Europe"
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Gallery Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryUpload}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
          {galleryPreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {galleryPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Gallery preview ${index + 1}`}
                    className="w-full h-24 object-cover border rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">You can select multiple images at once. Click the × to remove images.</p>
        </div>

        <div>
          <label htmlFor="gallery_image_urls" className="block text-sm font-medium text-slate-700 mb-1">Additional Gallery URLs (optional)</label>
          <input
            type="text"
            name="gallery_image_urls"
            id="gallery_image_urls"
            value={formData.gallery_image_urls.join(', ')}
            onChange={handleChange}
            placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">Comma-separated URLs for additional images hosted elsewhere.</p>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting || authLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition duration-150"
          >
            {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
