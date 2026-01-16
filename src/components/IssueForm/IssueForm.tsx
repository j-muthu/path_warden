'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocationPicker } from './LocationPicker';
import { PhotoUpload } from './PhotoUpload';
import { useAuth } from '@/components/Auth/AuthProvider';
import type { IssueType } from '@/types';
import { ISSUE_TYPE_LABELS } from '@/types';

interface IssueFormData {
  title: string;
  description: string;
  issue_type: IssueType;
  latitude: number | null;
  longitude: number | null;
  grid_reference: string | null;
  is_anonymous: boolean;
  photos: string[];
}

export function IssueForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState<IssueFormData>({
    title: '',
    description: '',
    issue_type: 'other',
    latitude: null,
    longitude: null,
    grid_reference: null,
    is_anonymous: false,
    photos: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a title for the issue');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please describe the issue');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Please select a location on the map');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit issue');
      }

      const { issue } = await response.json();
      router.push(`/issues/${issue.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit issue');
      setSubmitting(false);
    }
  };

  const handleLocationChange = (location: {
    latitude: number;
    longitude: number;
    gridReference?: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
      grid_reference: location.gridReference || null,
    }));
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in required</h2>
        <p className="text-gray-600 mb-4">Please sign in to report an issue</p>
        <a
          href="/auth/login"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Issue Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type of Issue *
        </label>
        <select
          value={formData.issue_type}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, issue_type: e.target.value as IssueType }))
          }
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {(Object.entries(ISSUE_TYPE_LABELS) as [IssueType, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Brief summary of the issue"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          maxLength={200}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the issue in detail. Include any safety concerns, how long it's been present, and any other relevant information."
          rows={5}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location *
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Click on the map, enter a grid reference, paste coordinates, or use a Google Maps link
        </p>
        <LocationPicker
          latitude={formData.latitude || undefined}
          longitude={formData.longitude || undefined}
          gridReference={formData.grid_reference || undefined}
          onChange={handleLocationChange}
        />
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos (optional)
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Upload photos of the issue to help illustrate the problem
        </p>
        <PhotoUpload
          photos={formData.photos}
          onChange={(photos) => setFormData((prev) => ({ ...prev, photos }))}
        />
      </div>

      {/* Anonymous option */}
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="anonymous"
          checked={formData.is_anonymous}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, is_anonymous: e.target.checked }))
          }
          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <div>
          <label htmlFor="anonymous" className="text-sm font-medium text-gray-700">
            Submit anonymously
          </label>
          <p className="text-sm text-gray-500">
            Your name and email won&apos;t be included in the report to the council, and you won&apos;t receive a copy of the email.
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          * Required fields
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Issue'}
        </button>
      </div>
    </form>
  );
}
