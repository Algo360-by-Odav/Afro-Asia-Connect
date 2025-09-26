'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface VerificationDocument {
  id?: number;
  category: string;
  title: string;
  file: File | null;
  filename?: string;
  uploaded?: boolean;
  required: boolean;
}

interface VerificationRequest {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  documents: any;
  createdAt: string;
}

export default function BusinessVerificationPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([
    {
      category: 'GENERAL_BUSINESS',
      title: 'Business Registration Certificate',
      file: null,
      required: true
    },
    {
      category: 'GENERAL_BUSINESS',
      title: 'Certificate of Incorporation',
      file: null,
      required: true
    },
    {
      category: 'GENERAL_BUSINESS',
      title: 'Business License',
      file: null,
      required: true
    },
    {
      category: 'TRADE',
      title: 'Import/Export License',
      file: null,
      required: false
    },
    {
      category: 'TRADE',
      title: 'Chamber of Commerce Membership',
      file: null,
      required: false
    },
    {
      category: 'COMPLIANCE',
      title: 'Tax Registration Certificate',
      file: null,
      required: true
    },
    {
      category: 'COMPLIANCE',
      title: 'ISO Certifications',
      file: null,
      required: false
    },
    {
      category: 'GOVERNMENT',
      title: 'VAT Registration',
      file: null,
      required: false
    },
    {
      category: 'CONTRACTS',
      title: 'Insurance Certificate',
      file: null,
      required: false
    },
    {
      category: 'CONTRACTS',
      title: 'Bank Reference Letter',
      file: null,
      required: false
    }
  ]);

  useEffect(() => {
    console.log('Verification page - User data:', user);
    console.log('Verification page - Token:', token ? 'Present' : 'Missing');
    
    if (!user || !token) {
      console.log('Redirecting to auth - missing user or token');
      router.push('/auth');
      return;
    }

    // Debug user role information
    console.log('User role:', user.role);
    console.log('User user_type:', user.user_type);
    console.log('User object keys:', Object.keys(user));

    // Allow all authenticated users to access verification (remove role restriction for debugging)
    console.log('User authenticated, proceeding to fetch verification status');
    fetchVerificationStatus();
  }, [user, token]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('/api/verification/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationRequest(data);
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (index: number, file: File | null) => {
    setDocuments(prev => prev.map((doc, i) => 
      i === index ? { ...doc, file } : doc
    ));
  };

  const handleSubmit = async () => {
    const requiredDocs = documents.filter(doc => doc.required);
    const uploadedRequired = requiredDocs.filter(doc => doc.file);

    if (uploadedRequired.length < requiredDocs.length) {
      alert('Please upload all required documents before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      // Upload documents first
      const uploadedDocuments = [];

      for (const doc of documents) {
        if (doc.file) {
          const formData = new FormData();
          formData.append('file', doc.file);
          formData.append('category', doc.category);
          formData.append('title', doc.title);

          const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            uploadedDocuments.push({
              category: doc.category,
              title: doc.title,
              filename: uploadData.filename,
              documentId: uploadData.id
            });
          }
        }
      }

      // Submit verification request
      const verificationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          documents: uploadedDocuments
        }),
      });

      if (verificationResponse.ok) {
        alert('Verification request submitted successfully! We will review your documents within 3-5 business days.');
        fetchVerificationStatus();
      } else {
        throw new Error('Failed to submit verification request');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      alert('Error submitting verification request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'GENERAL_BUSINESS':
        return '🏢';
      case 'TRADE':
        return '🌍';
      case 'COMPLIANCE':
        return '✅';
      case 'GOVERNMENT':
        return '🏛️';
      case 'CONTRACTS':
        return '📄';
      default:
        return '📁';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Business Verification</h1>
              <p className="text-gray-600 mt-2">
                Get verified to build trust with buyers and unlock premium features
              </p>
            </div>
            <div className="text-6xl">🏆</div>
          </div>
        </div>

        {/* Current Status */}
        {verificationRequest && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Status</h2>
            <div className="flex items-center justify-between">
              <div>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(verificationRequest.status)}`}>
                  {verificationRequest.status}
                </span>
                <p className="text-gray-600 mt-2">
                  Submitted on {new Date(verificationRequest.createdAt).toLocaleDateString()}
                </p>
              </div>
              {verificationRequest.status === 'APPROVED' && (
                <div className="text-green-600 text-2xl">✅ Verified</div>
              )}
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="text-green-600 text-xl">✅</div>
              <span className="text-gray-700">Green "Verified" badge on your listings</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-green-600 text-xl">📈</div>
              <span className="text-gray-700">Higher search ranking in directory</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-green-600 text-xl">🤝</div>
              <span className="text-gray-700">Increased buyer trust and confidence</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-green-600 text-xl">⭐</div>
              <span className="text-gray-700">Access to premium platform features</span>
            </div>
          </div>
        </div>

        {/* Document Upload */}
        {(!verificationRequest || verificationRequest.status === 'REJECTED') && (
          <div className="space-y-8">
            {/* Essential Business Documents */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🏢</span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Essential Business Documents</h2>
                  <p className="text-gray-600">Core documents required for all businesses</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {documents.filter(doc => doc.category === 'GENERAL_BUSINESS').map((doc, index) => {
                  const originalIndex = documents.findIndex(d => d === doc);
                  return (
                    <div key={originalIndex} className="border border-gray-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <span className="text-red-600 font-bold">!</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {doc.title}
                              <span className="text-red-500 ml-1">* Required</span>
                            </h3>
                            <p className="text-sm text-gray-600">
                              {doc.title === 'Business Registration Certificate' && 'Official certificate proving your business is legally registered'}
                              {doc.title === 'Certificate of Incorporation' && 'Legal document establishing your company as a corporation'}
                              {doc.title === 'Business License' && 'Government-issued license to operate your specific business type'}
                            </p>
                          </div>
                        </div>
                        {doc.file && (
                          <div className="text-green-600 text-sm font-medium">
                            ✅ {doc.file.name}
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(originalIndex, e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        aria-label={`Upload ${doc.title}`}
                        title={`Upload ${doc.title} - ${
                          doc.title === 'Business Registration Certificate' ? 'Official certificate proving your business is legally registered' :
                          doc.title === 'Certificate of Incorporation' ? 'Legal document establishing your company as a corporation' :
                          doc.title === 'Business License' ? 'Government-issued license to operate your specific business type' :
                          doc.title === 'Tax Registration Certificate' ? 'Certificate showing your business is registered for tax purposes' :
                          doc.title === 'ISO Certifications' ? 'Quality management system certifications (ISO 9001, etc.)' :
                          doc.title === 'VAT Registration' ? 'Value Added Tax registration certificate if applicable' :
                          doc.title === 'Import/Export License' ? 'Required if your business involves international trade' :
                          doc.title === 'Chamber of Commerce Membership' ? 'Membership certificate from local or international chamber' :
                          doc.title === 'Insurance Certificate' ? 'Business liability or professional indemnity insurance' :
                          doc.title === 'Bank Reference Letter' ? 'Letter from your bank confirming your business account and standing' :
                          'Business verification document'
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tax & Compliance Documents */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">✅</span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Tax & Compliance Documents</h2>
                  <p className="text-gray-600">Financial and regulatory compliance documentation</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {documents.filter(doc => doc.category === 'COMPLIANCE' || doc.category === 'GOVERNMENT').map((doc, index) => {
                  const originalIndex = documents.findIndex(d => d === doc);
                  return (
                    <div key={originalIndex} className={`border border-gray-200 rounded-lg p-4 ${doc.required ? 'bg-orange-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.required ? 'bg-orange-100' : 'bg-gray-100'}`}>
                            <span className={doc.required ? 'text-orange-600 font-bold' : 'text-gray-600'}>
                              {doc.required ? '!' : '○'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {doc.title}
                              {doc.required && <span className="text-orange-500 ml-1">* Required</span>}
                              {!doc.required && <span className="text-gray-500 ml-1">Optional</span>}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {doc.title === 'Tax Registration Certificate' && 'Certificate showing your business is registered for tax purposes'}
                              {doc.title === 'ISO Certifications' && 'Quality management system certifications (ISO 9001, etc.)'}
                              {doc.title === 'VAT Registration' && 'Value Added Tax registration certificate if applicable'}
                            </p>
                          </div>
                        </div>
                        {doc.file && (
                          <div className="text-green-600 text-sm font-medium">
                            ✅ {doc.file.name}
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(originalIndex, e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        aria-label={`Upload ${doc.title}`}
                        title={`Upload ${doc.title} - ${
                          doc.title === 'Business Registration Certificate' ? 'Official certificate proving your business is legally registered' :
                          doc.title === 'Certificate of Incorporation' ? 'Legal document establishing your company as a corporation' :
                          doc.title === 'Business License' ? 'Government-issued license to operate your specific business type' :
                          doc.title === 'Tax Registration Certificate' ? 'Certificate showing your business is registered for tax purposes' :
                          doc.title === 'ISO Certifications' ? 'Quality management system certifications (ISO 9001, etc.)' :
                          doc.title === 'VAT Registration' ? 'Value Added Tax registration certificate if applicable' :
                          doc.title === 'Import/Export License' ? 'Required if your business involves international trade' :
                          doc.title === 'Chamber of Commerce Membership' ? 'Membership certificate from local or international chamber' :
                          doc.title === 'Insurance Certificate' ? 'Business liability or professional indemnity insurance' :
                          doc.title === 'Bank Reference Letter' ? 'Letter from your bank confirming your business account and standing' :
                          'Business verification document'
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trade & International Business */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🌍</span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Trade & International Business</h2>
                  <p className="text-gray-600">Documents for import/export and international trade activities</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {documents.filter(doc => doc.category === 'TRADE').map((doc, index) => {
                  const originalIndex = documents.findIndex(d => d === doc);
                  return (
                    <div key={originalIndex} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600">○</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {doc.title}
                              <span className="text-blue-500 ml-1">Optional</span>
                            </h3>
                            <p className="text-sm text-gray-600">
                              {doc.title === 'Import/Export License' && 'Required if your business involves international trade'}
                              {doc.title === 'Chamber of Commerce Membership' && 'Membership certificate from local or international chamber'}
                            </p>
                          </div>
                        </div>
                        {doc.file && (
                          <div className="text-green-600 text-sm font-medium">
                            ✅ {doc.file.name}
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(originalIndex, e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        aria-label={`Upload ${doc.title}`}
                        title={`Upload ${doc.title} - ${
                          doc.title === 'Business Registration Certificate' ? 'Official certificate proving your business is legally registered' :
                          doc.title === 'Certificate of Incorporation' ? 'Legal document establishing your company as a corporation' :
                          doc.title === 'Business License' ? 'Government-issued license to operate your specific business type' :
                          doc.title === 'Tax Registration Certificate' ? 'Certificate showing your business is registered for tax purposes' :
                          doc.title === 'ISO Certifications' ? 'Quality management system certifications (ISO 9001, etc.)' :
                          doc.title === 'VAT Registration' ? 'Value Added Tax registration certificate if applicable' :
                          doc.title === 'Import/Export License' ? 'Required if your business involves international trade' :
                          doc.title === 'Chamber of Commerce Membership' ? 'Membership certificate from local or international chamber' :
                          doc.title === 'Insurance Certificate' ? 'Business liability or professional indemnity insurance' :
                          doc.title === 'Bank Reference Letter' ? 'Letter from your bank confirming your business account and standing' :
                          'Business verification document'
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial & Insurance Documents */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">📄</span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Financial & Insurance Documents</h2>
                  <p className="text-gray-600">Financial credibility and insurance coverage documentation</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {documents.filter(doc => doc.category === 'CONTRACTS').map((doc, index) => {
                  const originalIndex = documents.findIndex(d => d === doc);
                  return (
                    <div key={originalIndex} className="border border-gray-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-green-600">○</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {doc.title}
                              <span className="text-green-500 ml-1">Optional</span>
                            </h3>
                            <p className="text-sm text-gray-600">
                              {doc.title === 'Insurance Certificate' && 'Business liability or professional indemnity insurance'}
                              {doc.title === 'Bank Reference Letter' && 'Letter from your bank confirming your business account and standing'}
                            </p>
                          </div>
                        </div>
                        {doc.file && (
                          <div className="text-green-600 text-sm font-medium">
                            ✅ {doc.file.name}
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(originalIndex, e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        aria-label={`Upload ${doc.title}`}
                        title={`Upload ${doc.title} - ${
                          doc.title === 'Business Registration Certificate' ? 'Official certificate proving your business is legally registered' :
                          doc.title === 'Certificate of Incorporation' ? 'Legal document establishing your company as a corporation' :
                          doc.title === 'Business License' ? 'Government-issued license to operate your specific business type' :
                          doc.title === 'Tax Registration Certificate' ? 'Certificate showing your business is registered for tax purposes' :
                          doc.title === 'ISO Certifications' ? 'Quality management system certifications (ISO 9001, etc.)' :
                          doc.title === 'VAT Registration' ? 'Value Added Tax registration certificate if applicable' :
                          doc.title === 'Import/Export License' ? 'Required if your business involves international trade' :
                          doc.title === 'Chamber of Commerce Membership' ? 'Membership certificate from local or international chamber' :
                          doc.title === 'Insurance Certificate' ? 'Business liability or professional indemnity insurance' :
                          doc.title === 'Bank Reference Letter' ? 'Letter from your bank confirming your business account and standing' :
                          'Business verification document'
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Verification Process Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Verification Process</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h4 className="font-medium text-gray-900">Upload Documents</h4>
                  <p className="text-sm text-gray-600">Submit all required documents</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-yellow-600 font-bold">2</span>
                  </div>
                  <h4 className="font-medium text-gray-900">Admin Review</h4>
                  <p className="text-sm text-gray-600">3-5 business days review</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-600 font-bold">3</span>
                  </div>
                  <h4 className="font-medium text-gray-900">Get Verified</h4>
                  <p className="text-sm text-gray-600">Receive verified badge</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit for Verification</span>
                    <span className="text-xl">🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Pending Status */}
        {verificationRequest?.status === 'PENDING' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification in Progress</h2>
              <p className="text-gray-600">
                Your documents are being reviewed by our team. We'll notify you within 3-5 business days.
              </p>
            </div>
          </div>
        )}

        {/* Approved Status */}
        {verificationRequest?.status === 'APPROVED' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Congratulations!</h2>
              <p className="text-gray-600">
                Your business has been verified. You now have access to all premium features and the verified badge.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
