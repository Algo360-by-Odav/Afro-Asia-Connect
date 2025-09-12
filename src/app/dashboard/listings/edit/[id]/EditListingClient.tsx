/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface ListingFormState {
  business_name: string;
  business_category: string;
  description: string;
  country_of_origin: string;
  target_markets: string[];
  contact_email: string;
  contact_phone: string;
  website_url: string;
  logo_image_url: string;
  gallery_image_urls: string[];
  gallery_image_files: File[];
}

interface ListingData {
  id: number;
  userId: number;
  businessName: string;
  businessCategory: string;
  description: string;
  countryOfOrigin: string;
  targetMarkets: string[];
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  logoImageUrl: string;
  galleryImageUrls: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EditListingClient() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [listing, setListing] = useState<ListingFormState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (id && token) {
      const fetchListing = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`http://127.0.0.1:3001/api/listings/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || `Failed to fetch listing: ${response.status}`);
          }
          const data: ListingData = await response.json();
          setListing({
            business_name: data.businessName || '',
            business_category: data.businessCategory || '',
            description: data.description || '',
            country_of_origin: data.countryOfOrigin || '',
            target_markets: data.targetMarkets || [],
            contact_email: data.contactEmail || '',
            contact_phone: data.contactPhone || '',
            website_url: data.websiteUrl || '',
            logo_image_url: data.logoImageUrl || '',
            gallery_image_urls: data.galleryImageUrls || [],
            gallery_image_files: [],
          });
        } catch (err: any) {
          console.error('Fetch listing error:', err);
          setError(err.message || 'An unknown error occurred while fetching the listing.');
        }
        setLoading(false);
      };
      fetchListing();
    }
  }, [id, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!listing) return;
    const { name, value } = e.target;
    if (name === 'target_markets' || name === 'gallery_image_urls') {
      setListing({ ...listing, [name]: value.split(',').map(item => item.trim()).filter(item => item) });
    } else {
      setListing({ ...listing, [name]: value });
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
      setListing(prev => prev ? { ...prev, logo_image_url: previewUrl } : null);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGalleryFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setGalleryPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingGalleryImage = (index: number) => {
    setListing(prev => {
      if (!prev) return null;
      const updatedUrls = prev.gallery_image_urls.filter((_, i) => i !== index);
      return { ...prev, gallery_image_urls: updatedUrls };
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!listing || !id || !token) {
      setSubmitError('Form data or authentication token is missing.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let updatedListing = { ...listing };
      
      // If a new logo file was selected, upload it first
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        const uploadResponse = await fetch('http://127.0.0.1:3001/api/upload/logo', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          updatedListing.logo_image_url = uploadData.url;
        } else {
          console.warn('Logo upload failed, proceeding with existing logo');
        }
      }
      
      // Upload gallery images if any
      if (galleryFiles.length > 0) {
        const galleryUrls: string[] = [];
        
        for (const file of galleryFiles) {
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
        updatedListing.gallery_image_urls = [...updatedListing.gallery_image_urls, ...galleryUrls];
      }
      
      // Remove file objects before sending to API
      const { gallery_image_files, ...submitData } = updatedListing;

      const response = await fetch(`http://127.0.0.1:3001/api/listings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Failed to update listing: ${response.status}`);
      }
      alert('Listing updated successfully!');
      router.push('/dashboard/listings');
    } catch (err: any) {
      console.error('Update listing error:', err);
      setSubmitError(err.message || 'An unknown error occurred while updating the listing.');
    }
    setIsSubmitting(false);
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><p className="text-lg">Loading listing details...</p></div>;
  if (error) return <div className="flex flex-col justify-center items-center h-screen"><p className="text-red-500 text-lg">Error: {error}</p><Link href="/dashboard/listings" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Back to Listings</Link></div>;
  if (!listing) return <div className="flex justify-center items-center h-screen"><p className="text-lg">Listing not found or unable to load.</p></div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Edit Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 shadow-lg rounded-lg">
        <div>
          <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <input type="text" name="business_name" id="business_name" value={listing.business_name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="business_category" className="block text-sm font-medium text-gray-700 mb-1">Business Category</label>
          <input type="text" name="business_category" id="business_category" value={listing.business_category} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" id="description" value={listing.description} onChange={handleChange} required rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>
        <div>
          <label htmlFor="country_of_origin" className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
          <input type="text" name="country_of_origin" id="country_of_origin" value={listing.country_of_origin} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
          <input type="email" name="contact_email" id="contact_email" value={listing.contact_email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="target_markets" className="block text-sm font-medium text-gray-700 mb-1">Target Markets (comma-separated)</label>
          <input type="text" name="target_markets" id="target_markets" value={listing.target_markets.join(', ')} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        
        <div>
          <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
          <input type="tel" name="contact_phone" id="contact_phone" value={listing.contact_phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        
        <div>
          <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
          <input type="url" name="website_url" id="website_url" value={listing.website_url} onChange={handleChange} placeholder="https://" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo Image</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleLogoChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {(logoPreview || listing.logo_image_url) && (
            <div className="mt-2">
              <img 
                src={logoPreview || listing.logo_image_url} 
                alt="Logo preview" 
                className="h-20 w-20 object-contain border rounded-md"
              />
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gallery Images</label>
          
          {/* Existing Gallery Images */}
          {listing.gallery_image_urls.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Current Gallery Images:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
                {listing.gallery_image_urls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Gallery image ${index + 1}`}
                      className="w-full h-24 object-cover border rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingGalleryImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* New Gallery Images Upload */}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryUpload}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          
          {/* New Gallery Previews */}
          {galleryPreviews.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">New Images to Upload:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {galleryPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`New gallery preview ${index + 1}`}
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
            </div>
          )}
          
          <p className="mt-1 text-xs text-gray-500">You can select multiple images at once. Click the × to remove images.</p>
        </div>
        
        <div>
          <label htmlFor="gallery_image_urls" className="block text-sm font-medium text-gray-700 mb-1">Additional Gallery URLs (optional)</label>
          <input type="text" name="gallery_image_urls" id="gallery_image_urls" value={listing.gallery_image_urls.join(', ')} onChange={handleChange} placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          <p className="mt-1 text-xs text-gray-500">Comma-separated URLs for additional images hosted elsewhere.</p>
        </div>

        {submitError && <p className="text-red-500 text-sm">{submitError}</p>}

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Link href="/dashboard/listings" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Cancel
          </Link>
          <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
