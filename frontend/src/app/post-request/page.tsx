"use client";

import React, { useState } from 'react';

export default function PostRequestPage() {
  const [formData, setFormData] = useState({
    productNeeded: '',
    description: '',
    quantity: '',
    deliveryTime: '',
    country: '',
    budget: '',
    attachment: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      const files = (e.target as HTMLInputElement).files;
      setFormData(prevState => ({ ...prevState, [name]: files ? files[0] : null }));
    } else {
      setFormData(prevState => ({ ...prevState, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement actual form submission logic (e.g., API call)
    console.log('Form data submitted:', formData);
    alert('Your request has been submitted (check console for data).');
    // Reset form or redirect user
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Post a Request (Buyers)
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Simple form to post a trade inquiry.
          </p>
        </header>

        <div className="bg-white shadow-xl rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="productNeeded" className="block text-sm font-medium text-gray-700">Product Needed</label>
              <input type="text" name="productNeeded" id="productNeeded" required value={formData.productNeeded} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" placeholder="e.g., Organic Cotton T-Shirts, Grade A Saffron" />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea id="description" name="description" rows={4} required value={formData.description} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" placeholder="Provide detailed specifications, quality requirements, certifications needed, etc."></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                <input type="text" name="quantity" id="quantity" required value={formData.quantity} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" placeholder="e.g., 1000 units, 50kg" />
              </div>
              <div>
                <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700">Delivery Time</label>
                <input type="text" name="deliveryTime" id="deliveryTime" required value={formData.deliveryTime} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" placeholder="e.g., Within 2 weeks, By End of Month" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country (Your Location)</label>
                <input type="text" name="country" id="country" required value={formData.country} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" placeholder="e.g., Nigeria, India" />
              </div>
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700">Budget (Optional)</label>
                <input type="text" name="budget" id="budget" value={formData.budget} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" placeholder="e.g., $5,000 - $10,000 USD" />
              </div>
            </div>

            <div>
              <label htmlFor="attachment" className="block text-sm font-medium text-gray-700">Upload Attachment (Optional)</label>
              <input type="file" name="attachment" id="attachment" onChange={handleChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" />
            </div>

            <div>
              <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                Submit Request
              </button>
            </div>
          </form>
        </div>

        <footer className="mt-12 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} AfroAsiaConnect. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
