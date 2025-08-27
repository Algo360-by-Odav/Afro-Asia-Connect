'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import Link from 'next/link';
import { toast } from 'react-toastify';

// For now, let's define the Listing interface here, ideally this would be shared
interface Listing {
  id: number;
  business_name: string;
  business_category: string;
  description: string;
  country_of_origin: string;
  target_markets: string[];
  contact_email: string;
  contact_phone?: string;
  website_url?: string;
  logo_image_url?: string;
  gallery_image_urls?: string[];
  is_active: boolean;
  // user_id is not directly editable but good to have in a full interface
  user_id?: number; 
  created_at?: string;
  updated_at?: string;
}

const businessCategories = [
  'Textiles & Apparel',
  'Electronics & Electrical Goods',
  'Agriculture & Food Products',
  'Machinery & Industrial Supplies',
  'Automotive Parts & Vehicles',
  'Home Goods & Furniture',
  'Beauty & Personal Care',
  'Construction & Real Estate',
  'Services (Consulting, IT, etc.)',
  'Other'
];

const EditListingFormPlaceholder = ({ listingData, onSubmit, onCancel }: { listingData: Listing, onSubmit: (formData: Partial<Listing>) => void, onCancel: () => void }) => {
  // This will be replaced by the actual form implementation
  const [formData, setFormData] = useState<Partial<Listing>>(listingData);

  useEffect(() => {
    setFormData(listingData);
  }, [listingData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name;

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: target.value }));
    }
  };

  const handleArrayInputChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'target_markets' | 'gallery_image_urls') => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, [fieldName]: value.split(',').map(item => item.trim()).filter(item => item) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 shadow-xl rounded-lg">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">Edit Listing: <span className='text-indigo-600'>{listingData.business_name}</span></h2>
      
      {/* Business Name */}
      <div>
        <label htmlFor="business_name" className={labelClass}>Business Name*</label>
        <input type="text" name="business_name" id="business_name" value={formData.business_name || ''} onChange={handleChange} required className={inputClass} />
      </div>

      {/* Business Category */}
      <div>
        <label htmlFor="business_category" className={labelClass}>Business Category*</label>
        <select name="business_category" id="business_category" value={formData.business_category || ''} onChange={handleChange} required className={inputClass}>
          <option value="">Select a category</option>
          {businessCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClass}>Description</label>
        <textarea name="description" id="description" rows={4} value={formData.description || ''} onChange={handleChange} className={inputClass}></textarea>
      </div>

      {/* Country of Origin & Target Markets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="country_of_origin" className={labelClass}>Country of Origin</label>
          <input type="text" name="country_of_origin" id="country_of_origin" value={formData.country_of_origin || ''} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="target_markets" className={labelClass}>Target Markets (comma-separated)</label>
          <input type="text" name="target_markets" id="target_markets" value={(formData.target_markets || []).join(', ')} onChange={(e) => handleArrayInputChange(e, 'target_markets')} className={inputClass} placeholder="e.g., Asia, Europe" />
        </div>
      </div>
      
      {/* Contact Email & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="contact_email" className={labelClass}>Contact Email*</label>
          <input type="email" name="contact_email" id="contact_email" value={formData.contact_email || ''} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="contact_phone" className={labelClass}>Contact Phone</label>
          <input type="tel" name="contact_phone" id="contact_phone" value={formData.contact_phone || ''} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      {/* Website URL */}
      <div>
        <label htmlFor="website_url" className={labelClass}>Website URL</label>
        <input type="url" name="website_url" id="website_url" value={formData.website_url || ''} onChange={handleChange} className={inputClass} placeholder="https://example.com" />
      </div>

      {/* Logo Image URL */}
      <div>
        <label htmlFor="logo_image_url" className={labelClass}>Logo Image URL</label>
        <input type="url" name="logo_image_url" id="logo_image_url" value={formData.logo_image_url || ''} onChange={handleChange} className={inputClass} placeholder="https://example.com/logo.png" />
        {formData.logo_image_url && <img src={formData.logo_image_url} alt="Logo Preview" className="mt-2 h-20 w-auto object-contain border rounded"/>}
      </div>

      {/* Gallery Image URLs */}
      <div>
        <label htmlFor="gallery_image_urls" className={labelClass}>Gallery Image URLs (comma-separated)</label>
        <input type="text" name="gallery_image_urls" id="gallery_image_urls" value={(formData.gallery_image_urls || []).join(', ')} onChange={(e) => handleArrayInputChange(e, 'gallery_image_urls')} className={inputClass} placeholder="url1, url2, url3"/>
        <div className="mt-2 flex space-x-2 overflow-x-auto">
            {(formData.gallery_image_urls || []).map((url, index) => url && (
                <img key={index} src={url} alt={`Gallery image ${index + 1}`} className="h-20 w-auto object-contain border rounded"/>
            ))}
        </div>
      </div>

      {/* Is Active Checkbox */}
      <div className="flex items-center pt-4">
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          checked={formData.is_active || false}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
          Listing is Active
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-8">
        <button type="button" onClick={onCancel} className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
          Cancel
        </button>
        <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading, token } = useAuth();
  
  const listingId = params?.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loadingData, setLoadingData] = useState(true); // For fetching data
  const [submitting, setSubmitting] = useState(false); // For form submission
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/login?redirect=/listings/' + listingId + '/edit');
      return;
    }
    if (!listingId) {
        setError('Listing ID not found in URL.');
        setLoadingData(false);
        return;
    }

    const fetchListing = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const response = await fetch(`/api/listings/${listingId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Listing not found.');
          } else {
            const errorData = await response.json();
            throw new Error(errorData.msg || `Error: ${response.status}`);
          }
        }
        const data = await response.json();
        // Check if the current user is the owner of the listing
        // This check should ideally be more robust, perhaps by including user_id in the fetched listing data
        // or relying on the backend to deny access if not owner (which it does for PUT)
        // For now, we assume if data is fetched, it's viewable. The PUT will enforce ownership.
        setListing(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch listing details.');
      }
      setLoadingData(false);
    };

    fetchListing();
  }, [listingId, authLoading, token, router]);

  const handleUpdateListing = async (formData: Partial<Listing>) => {
    if (!listingId || !token) return;
    setSubmitting(true);

    const payload: Partial<Listing> = {
        business_name: formData.business_name,
        business_category: formData.business_category,
        description: formData.description,
        country_of_origin: formData.country_of_origin,
        target_markets: formData.target_markets,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website_url: formData.website_url,
        logo_image_url: formData.logo_image_url,
        gallery_image_urls: formData.gallery_image_urls,
        is_active: formData.is_active,
    };

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Error: ${response.status}`);
      }
      toast.success('Listing updated successfully!');
      router.push('/dashboard/my-listings'); 
    } catch (err: any) {
      toast.error(err.message || 'Failed to update listing.');
      // setSubmitError(err.message || 'Failed to update listing.'); // Replaced by toast
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="text-xl text-gray-700 ml-4">Loading listing for editing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">Error</h1>
          <p className="text-red-500 mb-6">{error}</p>
          <Link href="/dashboard/my-listings" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Back to My Listings
          </Link>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto text-center">
                <h1 className="text-2xl font-semibold text-gray-700 mb-4">Listing Not Found</h1>
                <p className="text-gray-500 mb-6">The listing you are trying to edit could not be found, or you may not have permission to edit it.</p>
                <Link href="/dashboard/my-listings" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Back to My Listings
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-3xl">
        <header className="mb-8">
          <Link href="/dashboard/my-listings" className="text-sm text-blue-600 hover:text-blue-800">
            &larr; Back to My Listings
          </Link>
        </header>
        {/* submitError display is now handled by react-toastify */}
        <EditListingFormPlaceholder 
            listingData={listing} 
            onSubmit={handleUpdateListing} 
            onCancel={() => router.push('/dashboard/my-listings')} 
        />
        {submitting && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                <p className="text-white ml-3">Submitting changes...</p>
            </div>
        )}
      </div>
    </div>
  );
}
