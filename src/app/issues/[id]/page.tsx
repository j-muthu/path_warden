'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/Auth/AuthProvider';
import type { IssueWithPhotos } from '@/types';
import { ISSUE_TYPE_LABELS, ISSUE_STATUS_LABELS } from '@/types';

interface EmailPreview {
  council: string;
  councilEmail: string;
  subject: string;
  body: string;
  canSend: boolean;
}

export default function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [issue, setIssue] = useState<IssueWithPhotos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');

  const isOwner = user && issue && issue.user_id === user.id;

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const response = await fetch(`/api/issues/${resolvedParams.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Issue not found');
          } else {
            setError('Failed to load issue');
          }
          return;
        }
        const data = await response.json();
        setIssue(data.issue);
      } catch {
        setError('Failed to load issue');
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [resolvedParams.id]);

  const handleGeneratePreview = async () => {
    setLoadingPreview(true);
    try {
      const response = await fetch(`/api/issues/${resolvedParams.id}/send-email`);
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to generate email preview');
        return;
      }
      const data = await response.json();
      setEmailPreview(data);
      setEditedSubject(data.subject);
      setEditedBody(data.body);
      setShowEmailPreview(true);
    } catch {
      setError('Failed to generate email preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const response = await fetch(`/api/issues/${resolvedParams.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: editedSubject,
          body: editedBody,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to send email');
        return;
      }

      // Refresh issue data
      const issueResponse = await fetch(`/api/issues/${resolvedParams.id}`);
      const issueData = await issueResponse.json();
      setIssue(issueData.issue);
      setShowEmailPreview(false);
    } catch {
      setError('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">{error || 'Issue not found'}</h2>
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            Return to map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to map
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{issue.title}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-500">
                  {ISSUE_TYPE_LABELS[issue.issue_type]}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    issue.status === 'resolved'
                      ? 'bg-green-100 text-green-800'
                      : issue.status === 'email_sent'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {ISSUE_STATUS_LABELS[issue.status]}
                </span>
              </div>
            </div>
            {isOwner && issue.status !== 'email_sent' && (
              <button
                onClick={handleGeneratePreview}
                disabled={loadingPreview}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {loadingPreview ? 'Generating...' : 'Send to Council'}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">Description</h2>
            <p className="text-gray-900 whitespace-pre-wrap">{issue.description}</p>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">Location</h2>
            <div className="flex items-center space-x-4 text-gray-900">
              {issue.grid_reference && (
                <span>Grid Ref: {issue.grid_reference}</span>
              )}
              <span>
                Coords: {issue.latitude.toFixed(6)}, {issue.longitude.toFixed(6)}
              </span>
            </div>
          </div>

          {/* Photos */}
          {issue.issue_photos && issue.issue_photos.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-2">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {issue.issue_photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square">
                    <Image
                      src={photo.storage_path}
                      alt="Issue photo"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emails sent */}
          {issue.emails_sent && issue.emails_sent.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-2">Emails Sent</h2>
              {issue.emails_sent.map((email) => (
                <div
                  key={email.id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{email.council_name}</p>
                      <p className="text-sm text-gray-500">{email.council_email}</p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(email.sent_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{email.email_subject}</p>
                </div>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
            <p>Reported: {new Date(issue.created_at).toLocaleString()}</p>
            {!issue.is_anonymous && issue.profiles && (
              <p>By: {issue.profiles.display_name || 'Anonymous'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Email Preview Modal */}
      {showEmailPreview && emailPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Preview Email</h2>
              <p className="text-gray-600 mt-1">
                To: {emailPreview.councilEmail} ({emailPreview.council})
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  rows={15}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowEmailPreview(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailPreview.canSend}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 text-red-600 p-4 rounded-lg shadow-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-800 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
