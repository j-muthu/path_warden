'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/Auth/AuthProvider';
import type { IssueWithPhotos } from '@/types';
import { ISSUE_TYPE_LABELS, ISSUE_STATUS_LABELS } from '@/types';

export default function MyIssuesPage() {
  const { user, loading: authLoading } = useAuth();
  const [issues, setIssues] = useState<IssueWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchIssues = async () => {
      try {
        const response = await fetch(`/api/issues?user_id=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setIssues(data.issues);
        }
      } catch (error) {
        console.error('Error fetching issues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [user]);

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in required</h1>
        <p className="text-gray-600 mb-6">Please sign in to view your reported issues</p>
        <Link
          href="/auth/login"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Reported Issues</h1>
        <Link
          href="/issues/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700"
        >
          Report New Issue
        </Link>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No issues reported yet
          </h2>
          <p className="text-gray-600 mb-6">
            Found a problem on a footpath? Report it and help maintain our countryside paths.
          </p>
          <Link
            href="/issues/new"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700"
          >
            Report Your First Issue
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              href={`/issues/${issue.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    {issue.title}
                  </h2>
                  <p className="text-sm text-gray-500 mb-2">
                    {ISSUE_TYPE_LABELS[issue.issue_type]} &bull;{' '}
                    {issue.grid_reference || `${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`}
                  </p>
                  <p className="text-gray-600 line-clamp-2">{issue.description}</p>
                </div>
                <div className="ml-4 flex flex-col items-end">
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
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {issue.issue_photos && issue.issue_photos.length > 0 && (
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {issue.issue_photos.length} photo{issue.issue_photos.length !== 1 ? 's' : ''}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
