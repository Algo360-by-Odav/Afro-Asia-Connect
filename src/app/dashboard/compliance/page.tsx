'use client';

import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config/api';

// Helper function to get expiry status
function getExpiryStatus(expiryDate: string | null) {
  if (!expiryDate) return { status: 'none', color: '', text: '' };
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 0) return { status: 'expired', color: 'bg-red-100 text-red-800', text: 'Expired' };
  if (daysUntil <= 1) return { status: 'critical', color: 'bg-red-100 text-red-800', text: `${daysUntil}d` };
  if (daysUntil <= 7) return { status: 'warning', color: 'bg-orange-100 text-orange-800', text: `${daysUntil}d` };
  if (daysUntil <= 30) return { status: 'notice', color: 'bg-yellow-100 text-yellow-800', text: `${daysUntil}d` };
  return { status: 'good', color: 'bg-green-100 text-green-800', text: 'Valid' };
}

// category list constant outside to keep ref stable
const CATEGORY_OPTIONS = [
  { key: 'GENERAL_BUSINESS', label: 'General Business Documents' },
  { key: 'TRADE', label: 'Trade Documents' },
  { key: 'COMPLIANCE', label: 'Compliance Certificates' },
  { key: 'GOVERNMENT', label: 'Government & Regulatory' },
  { key: 'CONTRACTS', label: 'Service Contracts / Templates' },
];

export default function CompliancePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // hooks must be unconditional; redirect in effect
  const [activeCat, setActiveCat] = useState(CATEGORY_OPTIONS[0].key);
  const [docs, setDocs] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [expiry, setExpiry] = useState('');
  const [mainTab, setMainTab] = useState<'MY' | 'RECEIVED'>('MY');
  const [receivedDocs, setReceivedDocs] = useState<any[]>([]);
  const [shareDocId, setShareDocId] = useState<number | null>(null);
  const [shareTarget, setShareTarget] = useState('');
  const [shareExpiry, setShareExpiry] = useState('');
  const [complianceScore, setComplianceScore] = useState<any>(null);
  const [replaceDocId, setReplaceDocId] = useState<number | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [showVersions, setShowVersions] = useState<number | null>(null);
  const [versions, setVersions] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && (!user || user.user_type !== 'service_provider')) {
      router.push('/dashboard');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    if (mainTab === 'MY') {
      fetch(`${API_BASE_URL}/documents?ownerId=${user.id}&category=${activeCat}`)
        .then((r) => r.json())
        .then(setDocs);
    } else {
      fetch(`${API_BASE_URL}/document-shares/received/list?userId=${user.id}`, { credentials: 'include' })
        .then((r) => r.json())
        .then((data) => {
          console.log('Received docs API response:', data);
          if (Array.isArray(data)) {
            setReceivedDocs(data);
          } else {
            console.warn('Received docs API returned non-array:', data);
            setReceivedDocs([]);
          }
        })
        .catch((err) => {
          console.error('Received docs fetch error:', err);
          setReceivedDocs([]);
        });
    }
  }, [user, activeCat, showUpload, mainTab, shareDocId]);

  // Fetch compliance score
  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE_URL}/compliance/score?userId=${user.id}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) {
          console.error('Compliance score fetch failed:', r.status);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setComplianceScore(data);
      })
      .catch((err) => {
        console.error('Compliance score error:', err);
      });
  }, [user, docs]);

  function handleUpload() {
    if (!file) return;
    const fd = new FormData();
    fd.append('ownerId', String(user!.id));
    fd.append('category', activeCat);
    fd.append('title', title || file.name);
    if (expiry) fd.append('expiry', expiry);
    fd.append('file', file);
    fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      body: fd,
    }).then(() => {
      setShowUpload(false);
      setFile(null);
      setTitle('');
      setExpiry('');
    });
  }

  function handleReplace() {
    if (!replaceDocId || !replaceFile) return;
    const fd = new FormData();
    fd.append('ownerId', String(user!.id));
    fd.append('file', replaceFile);
    fetch(`${API_BASE_URL}/documents/${replaceDocId}/replace`, {
      method: 'POST',
      body: fd,
    }).then(() => {
      setReplaceDocId(null);
      setReplaceFile(null);
      // Refresh docs list
      if (mainTab === 'MY') {
        fetch(`${API_BASE_URL}/documents?ownerId=${user!.id}&category=${activeCat}`)
          .then((r) => r.json())
          .then(setDocs);
      }
    });
  }

  function viewVersions(docId: number) {
    setShowVersions(docId);
    fetch(`${API_BASE_URL}/documents/${docId}/versions?ownerId=${user!.id}`)
      .then((r) => r.json())
      .then(setVersions);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Documents & Compliance Hub</h1>
          <p className="text-slate-600 max-w-xl">Securely upload, view, and share trade-related documents with your partners.</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Compliance Score Widget */}
          {complianceScore && (
            <div className="bg-white border rounded-lg p-4 min-w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Compliance Score</span>
                <span className={`text-2xl font-bold ${
                  complianceScore.overallScore >= 80 ? 'text-green-600' :
                  complianceScore.overallScore >= 60 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {complianceScore.overallScore}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full ${
                    complianceScore.overallScore >= 80 ? 'bg-green-600' :
                    complianceScore.overallScore >= 60 ? 'bg-orange-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${complianceScore.overallScore}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {complianceScore.totalFound} of {complianceScore.totalRequired} required documents
              </p>
            </div>
          )}
          <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={() => setShowUpload(true)}>
            + Upload Document
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="border-b mb-4 flex space-x-4 overflow-x-auto">
        {['MY', 'RECEIVED'].map((t) => (
          <button
            key={t}
            className={`py-2 px-4 ${mainTab === t ? 'border-b-2 border-indigo-600 font-medium' : 'text-slate-500'}`}
            onClick={() => setMainTab(t as any)}
          >
            {t === 'MY' ? 'My Documents' : 'Shared with Me'}
          </button>
        ))}
      </div>

      {/* Category tabs only when viewing own docs */}
      {mainTab === 'MY' && (
        <div className="border-b mb-4 flex space-x-4 overflow-x-auto">
          {CATEGORY_OPTIONS.map((c) => (
            <button
              key={c.key}
              className={`py-2 whitespace-nowrap ${activeCat === c.key ? 'border-b-2 border-indigo-600 font-medium' : 'text-slate-500'}`}
              onClick={() => setActiveCat(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="px-2 py-1">Title</th>
            <th className="px-2 py-1">Uploaded</th>
            <th className="px-2 py-1">Expiry</th>
            <th className="px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(mainTab === 'MY' ? docs : receivedDocs).map((d: any) => (
            <tr key={d.id} className="border-t">
              <td className="px-2 py-1">
                <a href={`/uploads/${d.filename || d.document?.filename}`} target="_blank" className="text-sky-600 underline">
                  {d.title || d.document?.title}
                </a>
              </td>
              <td className="px-2 py-1">{new Date((d.createdAt || d.document?.createdAt)).toLocaleDateString()}</td>
              <td className="px-2 py-1">
                {(d.expiry || d.document?.expiry) ? (
                  <div className="flex items-center space-x-2">
                    <span>{new Date(d.expiry || d.document?.expiry).toLocaleDateString()}</span>
                    {(() => {
                      const status = getExpiryStatus(d.expiry || d.document?.expiry);
                      return status.status !== 'none' && status.status !== 'good' ? (
                        <span className={`px-2 py-1 text-xs rounded ${status.color}`}>
                          {status.text}
                        </span>
                      ) : null;
                    })()} 
                  </div>
                ) : '—'}
              </td>
              <td className="px-2 py-1">
                <a href={`/uploads/${d.filename || d.document?.filename}`} target="_blank" className="text-sky-600 underline">Download</a>
                {mainTab === 'MY' && (
                  <>
                    <button className="text-indigo-600 ml-2" onClick={() => setShareDocId(d.id)}>
                      Share
                    </button>
                    <button className="text-green-600 ml-2" onClick={() => setReplaceDocId(d.id)}>
                      Replace
                    </button>
                    <button className="text-gray-600 ml-2" onClick={() => viewVersions(d.id)}>
                      Versions ({d.version || 1})
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {!docs.length && (
            <tr>
              <td colSpan={4} className="text-center py-4 text-slate-500">No documents.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Share Modal */}
      {shareDocId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-96 space-y-4">
            <h3 className="text-lg font-medium">Share Document</h3>
            <input
              type="number"
              placeholder="Target User ID"
              className="border w-full px-2 py-1"
              value={shareTarget}
              onChange={(e) => setShareTarget(e.target.value)}
            />
            <label className="block text-sm">Access expires (optional)</label>
            <input type="date" className="border w-full px-2 py-1" value={shareExpiry} onChange={(e) => setShareExpiry(e.target.value)} />
            <div className="text-right space-x-2">
              <button onClick={() => setShareDocId(null)}>Cancel</button>
              <button className="px-3 py-1 bg-indigo-600 text-white" disabled={!shareTarget} onClick={() => {
                fetch(`${API_BASE_URL}/document-shares/${shareDocId}/share`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ ownerId: user!.id, targetUserId: shareTarget, expiresAt: shareExpiry || null }),
                }).then(() => {
                  setShareDocId(null);
                  setShareTarget('');
                  setShareExpiry('');
                });
              }}>
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Modal */}
      {replaceDocId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-96 space-y-4">
            <h3 className="text-lg font-medium">Replace Document</h3>
            <p className="text-sm text-gray-600">Upload a new version of this document. The old version will be archived.</p>
            <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => setReplaceFile(e.target.files?.[0] || null)} />
            <div className="text-right space-x-2">
              <button onClick={() => setReplaceDocId(null)}>Cancel</button>
              <button className="px-3 py-1 bg-green-600 text-white" disabled={!replaceFile} onClick={handleReplace}>
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersions && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-[600px] space-y-4">
            <h3 className="text-lg font-medium">Version History</h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1 text-left">Version</th>
                    <th className="px-2 py-1 text-left">Date</th>
                    <th className="px-2 py-1 text-left">Status</th>
                    <th className="px-2 py-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => (
                    <tr key={v.id} className="border-t">
                      <td className="px-2 py-1">v{v.version}</td>
                      <td className="px-2 py-1">{new Date(v.createdAt).toLocaleDateString()}</td>
                      <td className="px-2 py-1">
                        <span className={`px-2 py-1 text-xs rounded ${
                          v.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {v.isActive ? 'Current' : 'Archived'}
                        </span>
                      </td>
                      <td className="px-2 py-1">
                        <a href={`/uploads/${v.filename}`} target="_blank" className="text-sky-600 underline text-xs">
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right">
              <button onClick={() => setShowVersions(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-96 space-y-4">
            <h3 className="text-lg font-medium">Upload Document</h3>
            <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <input
              type="text"
              placeholder="Title"
              className="border w-full px-2 py-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label className="block text-sm">Expiry date (optional)</label>
            <input type="date" className="border w-full px-2 py-1" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            <div className="text-right space-x-2">
              <button onClick={() => setShowUpload(false)}>Cancel</button>
              <button className="px-3 py-1 bg-emerald-600 text-white" disabled={!file} onClick={handleUpload}>
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
