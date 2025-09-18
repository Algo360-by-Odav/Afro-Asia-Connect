/*                                                                                                     
      × should create a new listing (32 ms)                                                                                
      × should return 401 if user is not authenticated (69 ms)                                                             
      × should return 500 if database error occurs (10 ms)                                                                 
    PUT /api/listings/:id                                                                                                  
      × should update a listing if user owns it (2 ms)                                                                     
      × should return 404 if listing to update is not found (21 ms)                                                        
      × should return 401 if user is not authenticated (2 ms)                                                              
      × should return 500 if database error occurs (1 ms)                                                                  
    DELETE /api/listings/:id                                                                                               
      × should delete a listing if user owns it (11 ms)                                                                    
      × should return 404 if listing not found (6 ms)                                                                      
      × should return 500 if database error occurs (5 ms)                                                                  
                                                                                                                           
  ● Listings API › GET /api/listings › should get all listings                                                             
                                                                                                                           
    expect(received).toEqual(expected) // deep equality

    Expected: [{"businessCategory": "Tech", "businessName": "Test Business", "contactEmail": "test@example.com", "contactPhone": "1234567890", "countryOfOrigin": "Testland", "createdAt": "2025-07-13T11:36:17.596Z", "description": "A test business description.", "galleryImageUrls": ["http://example.com/img1.png"], "id": "123", "isActive": true, "isVerified": true, "languagesSpoken": ["English", "Testish"], "logoImageUrl": "http://example.com/logo.png", "productsInfo": [{"images": [], "moq": "10", "name": "Test Product", "specifications": "Specs"}], "subsector": "Software", "targetMarkets": ["Global"], "updatedAt": "2025-07-13T11:36:17.598Z", "userId": "test-user-id", "websiteUrl": "http://example.com"}]
    Received: ""

      111 |       const response = await request(app).get('/api/listings');
      112 |       expect(response.statusCode).toBe(200);
    > 113 |       expect(response.body).toEqual([mockListing]);
          |                             ^
      114 |     });
      115 |
      116 |     it('should return 500 if database error occurs', async () => {

      at Object.toEqual (routes/listings.test.js:113:29)

  ● Listings API › GET /api/listings › should return 500 if database error occurs

    expect(received).toBe(expected) // Object.is equality

    Expected: 500
    Received: 200

      117 |       mockPrisma.businessListing.findMany.mockRejectedValueOnce(new Error('DB error'));
      118 |       const response = await request(app).get('/api/listings');
    > 119 |       expect(response.statusCode).toBe(500);
          |                                   ^
      120 |       expect(response.body.msg).toContain('Server error');
      121 |     });
      122 |   });

      at Object.toBe (routes/listings.test.js:119:35)

  ● Listings API › GET /api/listings/:id › should get a single listing

    expect(received).toBe(expected) // Object.is equality

    Expected: 200
    Received: 404

      126 |       mockPrisma.businessListing.findUnique.mockResolvedValueOnce(mockListing);
      127 |       const response = await request(app).get(`/api/listings/${mockListing.id}`);
    > 128 |       expect(response.statusCode).toBe(200);
          |                                   ^
      129 |       expect(response.body).toEqual(mockListing);
      130 |     });
      131 |

      at Object.toBe (routes/listings.test.js:128:35)

  ● Listings API › GET /api/listings/:id › should return 404 if listing not found

    expect(received).toBe(expected) // Object.is equality

    Expected: 404
    Received: 400

      133 |       mockPrisma.businessListing.findUnique.mockResolvedValueOnce(null);
      134 |       const response = await request(app).get('/api/listings/nonexistentid');
    > 135 |       expect(response.statusCode).toBe(404);
          |                                   ^
      136 |       expect(response.body.msg).toBe('Listing not found.');
      137 |     });
      138 |

      at Object.toBe (routes/listings.test.js:135:35)

  ● Listings API › GET /api/listings/:id › should return 500 if database error occurs

    expect(received).toBe(expected) // Object.is equality

    Expected: 500
    Received: 404

      140 |       mockPrisma.businessListing.findUnique.mockRejectedValueOnce(new Error('DB error'));
      141 |       const response = await request(app).get(`/api/listings/${mockListing.id}`);
    > 142 |       expect(response.statusCode).toBe(500);
          |                                   ^
      143 |       expect(response.body.msg).toContain('Server error');
      144 |     });
      145 |   });

      at Object.toBe (routes/listings.test.js:142:35)

  ● Listings API › POST /api/listings › should create a new listing

    expect(received).toBe(expected) // Object.is equality

    Expected: 201
    Received: 400

      157 |         .post('/api/listings')
      158 |         .send(newListingData);
    > 159 |       expect(response.statusCode).toBe(201);
          |                                   ^
      160 |       expect(response.body).toEqual(expect.objectContaining(newListingData));
      161 |       expect(mockPrisma.businessListing.create).toHaveBeenCalledWith({
      162 |         data: {

      at Object.toBe (routes/listings.test.js:159:35)

  ● Listings API › POST /api/listings › should return 401 if user is not authenticated

    expect(received).toBe(expected) // Object.is equality

    Expected: 401
    Received: 400

      178 |         .post('/api/listings')
      179 |         .send(newListingData);
    > 180 |       expect(response.statusCode).toBe(401);
          |                                   ^
      181 |     });
      182 |
      183 |     it('should return 500 if database error occurs', async () => {

      at Object.toBe (routes/listings.test.js:180:35)

  ● Listings API › POST /api/listings › should return 500 if database error occurs

    expect(received).toBe(expected) // Object.is equality

    Expected: 500
    Received: 400

      186 |         .post('/api/listings')
      187 |         .send(newListingData);
    > 188 |       expect(response.statusCode).toBe(500);
          |                                   ^
      189 |       expect(response.body.msg).toContain('Server error');
      190 |     });
      191 |   });

      at Object.toBe (routes/listings.test.js:188:35)

  ● Listings API › PUT /api/listings/:id › should update a listing if user owns it

    ReferenceError: existingListingId is not defined

      194 |     it('should update a listing if user owns it', async () => {
      195 |       mockPrisma.businessListing.update.mockResolvedValueOnce({
    > 196 |         id: existingListingId,
          |             ^
      197 |         userId: 'test-user-id',
      198 |         ...updateData
      199 |       });

      at Object.existingListingId (routes/listings.test.js:196:13)

  ● Listings API › PUT /api/listings/:id › should return 404 if listing to update is not found

    expect(received).toBe(expected) // Object.is equality

    Expected: 404
    Received: 400

      214 |         .put('/api/listings/nonexistentid999')
      215 |         .send(updateData);
    > 216 |       expect(response.statusCode).toBe(404);
          |                                   ^
      217 |       expect(response.body.msg).toContain('Listing not found or user not authorized');
      218 |     });
      219 |

      at Object.toBe (routes/listings.test.js:216:35)

  ● Listings API › PUT /api/listings/:id › should return 401 if user is not authenticated

    ReferenceError: existingListingId is not defined

      227 |       tempApp.use('/api/listings', freshListingsRouter);
      228 |       const response = await request(tempApp)
    > 229 |         .put(`/api/listings/${existingListingId}`)
          |                               ^
      230 |         .send(updateData);
      231 |       expect(response.statusCode).toBe(401);
      232 |     });

      at Object.existingListingId (routes/listings.test.js:229:31)

  ● Listings API › PUT /api/listings/:id › should return 500 if database error occurs

    ReferenceError: existingListingId is not defined

      235 |       mockPrisma.businessListing.update.mockRejectedValueOnce(new Error('DB update error'));
      236 |       const response = await request(app)
    > 237 |         .put(`/api/listings/${existingListingId}`)
          |                               ^
      238 |         .send(updateData);
      239 |       expect(response.statusCode).toBe(500);
      240 |       expect(response.body.msg).toContain('Server error');

      at Object.existingListingId (routes/listings.test.js:237:31)

  ● Listings API › DELETE /api/listings/:id › should delete a listing if user owns it

    expect(received).toEqual(expected) // deep equality

    - Expected  - 33
    + Received  +  1

      Object {
    -   "businessCategory": "Tech",
    -   "businessName": "Test Business",
    -   "contactEmail": "test@example.com",
    -   "contactPhone": "1234567890",
    -   "countryOfOrigin": "Testland",
    -   "createdAt": "2025-07-13T11:36:17.596Z",
    -   "description": "A test business description.",
    -   "galleryImageUrls": Array [
    -     "http://example.com/img1.png",
    -   ],
    -   "id": "123",
    -   "isActive": true,
    -   "isVerified": true,
    -   "languagesSpoken": Array [
    -     "English",
    -     "Testish",
    -   ],
    -   "logoImageUrl": "http://example.com/logo.png",
    -   "productsInfo": Array [
    -     Object {
    -       "images": Array [],
    -       "moq": "10",
    -       "name": "Test Product",
    -       "specifications": "Specs",
    -     },
    -   ],
    -   "subsector": "Software",
    -   "targetMarkets": Array [
    -     "Global",
    -   ],
    -   "updatedAt": "2025-07-13T11:36:17.598Z",
    -   "userId": "test-user-id",
    -   "websiteUrl": "http://example.com",
    +   "msg": "Listing deleted.",
      }

      248 |         .delete(`/api/listings/${mockListing.id}`);
      249 |       expect(response.statusCode).toBe(200);
    > 250 |       expect(response.body).toEqual(mockListing);
          |                             ^
      251 |       expect(mockPrisma.businessListing.delete).toHaveBeenCalledWith({
      252 |         where: { id: mockListing.id }
      253 |       });

      at Object.toEqual (routes/listings.test.js:250:29)

  ● Listings API › DELETE /api/listings/:id › should return 404 if listing not found

    expect(received).toBe(expected) // Object.is equality

    Expected: 404
    Received: 400

      258 |       const response = await request(app)
      259 |         .delete('/api/listings/nonexistentid');
    > 260 |       expect(response.statusCode).toBe(404);
          |                                   ^
      261 |       expect(response.body.msg).toBe('Listing not found.');
      262 |     });
      263 |

      at Object.toBe (routes/listings.test.js:260:35)

  ● Listings API › DELETE /api/listings/:id › should return 500 if database error occurs

    expect(received).toBe(expected) // Object.is equality

    Expected: 500
    Received: 200

      266 |       const response = await request(app)
      267 |         .delete(`/api/listings/${mockListing.id}`);
    > 268 |       expect(response.statusCode).toBe(500);
          |                                   ^
      269 |       expect(response.body.msg).toContain('Server error');
      270 |     });
      271 |   });

*/
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { uploadFile } from '../../utils/upload';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface ListingFormData {
  logo_image_file?: File; // new file field
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
}

const initialFormData: ListingFormData = {
  logo_image_file: undefined,
  business_name: '',
  business_category: '',
  description: '',
  country_of_origin: '',
  target_markets: [],
  contact_email: '',
  contact_phone: '',
  website_url: '',
  logo_image_url: '',
  gallery_image_urls: [],
};

// Sample categories - in a real app, these might come from an API or config
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

const CreateListingForm: React.FC = () => {
  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const url = await uploadFile(e.target.files[0]);
        setFormData(prev => ({ ...prev, logo_image_url: url }));
      } catch {
        toast.error('Logo upload failed');
      }
    }
  };
  const [formData, setFormData] = useState<ListingFormData>(initialFormData);
  // Error and success states can be removed if toasts handle all feedback
  // const [error, setError] = useState<string | null>(null);
  // const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth(); // To prefill email, and check if user is seller
  const router = useRouter();

  // Prefill contact email if user is logged in
  useState(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, contact_email: user.email }));
    }
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (
    e: ChangeEvent<HTMLSelectElement>,
    fieldName: 'target_markets' | 'gallery_image_urls'
  ) => {
    const options = e.target.options;
    const value: string[] = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    // For gallery_image_urls, this would be more complex (e.g., file uploads or separate inputs)
    // (logo upload handled separately)

    if (fieldName === 'target_markets') {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    } else if (fieldName === 'gallery_image_urls') {
        // This is a placeholder for actual image URL handling
        setFormData(prev => ({ ...prev, [fieldName]: value })); 
    }
  };
  
  const handleArrayInputChange = (e: ChangeEvent<HTMLInputElement>, fieldName: 'target_markets' | 'gallery_image_urls') => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, [fieldName]: value.split(',').map(item => item.trim()).filter(item => item) }));
  };


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // setError(null); // Handled by toast
    // setSuccess(null); // Handled by toast

    if (!user || user.user_type !== 'seller') {
      toast.error('Only sellers can create listings. Please ensure you are logged in as a seller.');
      setIsLoading(false);
      return;
    }

    try {
      // if there's a file, use FormData
      let response;
      if (formData.logo_image_file) {
        const fd = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (key === 'logo_image_file' && value instanceof File) {
            fd.append('logo_image', value);
          } else if (Array.isArray(value)) {
            fd.append(key, JSON.stringify(value));
          } else if (value !== undefined) {
            fd.append(key, value as any);
          }
        });
        response = await fetch('/api/listings', { method: 'POST', body: fd });
      } else {
        response = await fetch('/api/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      if (!response.ok) throw new Error('Failed to create listing');
      toast.success('Listing created successfully! Redirecting...');
      // Reset form or redirect
      setTimeout(() => {
        router.push('/dashboard/my-listings'); // Redirect to listings page
      }, 2000); // Delay for user to see success message

    } catch (err: any) {
      toast.error(err.message || 'Failed to create listing.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 shadow-xl rounded-lg border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">Create New Business Listing</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="business_name" className={labelClass}>Business Name*</label>
          <input type="text" name="business_name" id="business_name" value={formData.business_name} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="business_category" className={labelClass}>Business Category*</label>
          <select name="business_category" id="business_category" value={formData.business_category} onChange={handleChange} required className={inputClass}>
            <option value="">Select a category</option>
            {businessCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>Description</label>
        <textarea name="description" id="description" rows={4} value={formData.description} onChange={handleChange} className={inputClass}></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="country_of_origin" className={labelClass}>Country of Origin</label>
          <input type="text" name="country_of_origin" id="country_of_origin" value={formData.country_of_origin} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="target_markets" className={labelClass}>Target Markets (comma-separated)</label>
          <input type="text" name="target_markets" id="target_markets" value={formData.target_markets.join(', ')} onChange={(e) => handleArrayInputChange(e, 'target_markets')} className={inputClass} placeholder="e.g., Asia, Europe, North America" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="contact_email" className={labelClass}>Contact Email*</label>
          <input type="email" name="contact_email" id="contact_email" value={formData.contact_email} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="contact_phone" className={labelClass}>Contact Phone</label>
          <input type="tel" name="contact_phone" id="contact_phone" value={formData.contact_phone} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="website_url" className={labelClass}>Website URL</label>
        <input type="url" name="website_url" id="website_url" value={formData.website_url} onChange={handleChange} className={inputClass} placeholder="https://example.com" />
      </div>

      {/* Logo Image Upload */}
      <div>
        <label className={labelClass}>Logo Image</label>
        <input 
          type="file" 
          accept="image/*" 
          aria-label="Upload logo image"
          title="Upload logo image for your listing"
          onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setFormData(prev => ({ ...prev, logo_image_file: file }));
            const url = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, logo_image_url: url }));
          }
        }} className={inputClass} />
        {formData.logo_image_url && <img src={formData.logo_image_url} alt="Logo Preview" className="mt-2 h-20 w-auto object-contain border rounded"/>}
      </div>

      <div>
        <label htmlFor="gallery_image_urls" className={labelClass}>Gallery Image URLs (comma-separated)</label>
        <input type="text" name="gallery_image_urls" id="gallery_image_urls" value={formData.gallery_image_urls.join(', ')} onChange={(e) => handleArrayInputChange(e, 'gallery_image_urls')} className={inputClass} placeholder="url1, url2, url3"/>
        {/* TODO: Add a more robust image upload/preview for gallery */}
        <div className="mt-2 flex space-x-2 overflow-x-auto">
            {formData.gallery_image_urls.map((url, index) => url && (
                <img key={index} src={url} alt={`Gallery image ${index + 1}`} className="h-20 w-auto object-contain border rounded"/>
            ))}
        </div>
      </div>

      <div className="pt-5">
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Creating Listing...' : 'Create Listing'}
        </button>
      </div>
    </form>
  );
};

export default CreateListingForm;
