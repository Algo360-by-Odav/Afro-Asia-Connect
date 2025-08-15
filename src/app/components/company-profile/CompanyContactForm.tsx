// src/app/components/company-profile/CompanyContactForm.tsx
"use client";

import React, { useState } from 'react';

interface CompanyContactFormProps {
  companyName: string;
  companyEmail: string; // To prefill or use as submission target
}

export default function CompanyContactForm({ companyName, companyEmail }: CompanyContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: `Inquiry for ${companyName}`,
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Contact Form Submitted:');
    console.log('To Company:', companyName, `(${companyEmail})`);
    console.log('Form Data:', formData);
    // Here you would typically send the data to a backend API
    alert('Message sent (logged to console)! Thank you for your inquiry.');
    // Optionally reset form
    setFormData({
      name: '',
      email: '',
      subject: `Inquiry for ${companyName}`,
      message: '',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">Your Name</label>
        <input 
          type="text" 
          name="name" 
          id="name" 
          value={formData.name} 
          onChange={handleChange} 
          required 
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">Your Email</label>
        <input 
          type="email" 
          name="email" 
          id="email" 
          value={formData.email} 
          onChange={handleChange} 
          required 
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="subject" className="block mb-1 text-sm font-medium text-gray-700">Subject</label>
        <input 
          type="text" 
          name="subject" 
          id="subject" 
          value={formData.subject} 
          onChange={handleChange} 
          required 
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="message" className="block mb-1 text-sm font-medium text-gray-700">Message</label>
        <textarea 
          name="message" 
          id="message" 
          rows={4} 
          value={formData.message} 
          onChange={handleChange} 
          required 
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div>
        <button 
          type="submit" 
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        >
          Send Message
        </button>
      </div>
    </form>
  );
}
