'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/Auth/AuthProvider';
import type { IssueWithPhotos, IssueType, IssueStatus } from '@/types';
import { ISSUE_TYPE_LABELS, ISSUE_STATUS_LABELS } from '@/types';

// Dynamically import the map legend with no SSR
const MapLegend = dynamic(
  () => import('@/components/Map/IssueMarker').then((mod) => mod.MapLegend),
  { ssr: false }
);

// Status colors for markers
const STATUS_COLORS: Record<IssueStatus, string> = {
  draft: '#9ca3af',
  submitted: '#f59e0b',
  email_sent: '#3b82f6',
  acknowledged: '#8b5cf6',
  resolved: '#22c55e',
};

export default function HomePage() {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const mapInitializedRef = useRef(false);
  const markersRef = useRef<L.Marker[]>([]);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);

  const [issues, setIssues] = useState<IssueWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<IssueWithPhotos | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<IssueType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all');

  // Fetch issues
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch('/api/issues');
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
  }, []);

  // Initialize map - dynamically import Leaflet
  useEffect(() => {
    if (!mapRef.current || mapInitializedRef.current) return;

    // Set flag synchronously to prevent double initialization in StrictMode
    mapInitializedRef.current = true;

    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // Check if container is already initialized (safety check)
      if (mapInstanceRef.current) return;

      leafletRef.current = L;

      // UK bounds
      const ukBounds: L.LatLngBoundsExpression = [
        [49.528423, -10.76418],
        [61.331151, 1.9134116],
      ];

      const mapOptions: L.MapOptions = {
        center: [54.5, -2],
        zoom: 6,
        minZoom: 5,
        maxZoom: 19,
        maxBounds: ukBounds,
        maxBoundsViscosity: 1.0,
      };

      const map = L.map(mapRef.current!, mapOptions);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when issues or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current || !mapReady) return;

    const L = leafletRef.current;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Filter issues
    const filteredIssues = issues.filter((issue) => {
      if (filterType !== 'all' && issue.issue_type !== filterType) return false;
      if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
      return true;
    });

    // Add markers
    filteredIssues.forEach((issue) => {
      const color = STATUS_COLORS[issue.status];
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
          "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon })
        .addTo(mapInstanceRef.current!);

      marker.on('click', () => {
        setSelectedIssue(issue);
        mapInstanceRef.current?.setView([issue.latitude, issue.longitude], 14);
      });

      markersRef.current.push(marker);
    });
  }, [issues, filterType, filterStatus, mapReady]);

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Path Issues</h2>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading...' : `${issues.length} issues reported`}
          </p>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as IssueType | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              {(Object.entries(ISSUE_TYPE_LABELS) as [IssueType, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as IssueStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              {(Object.entries(ISSUE_STATUS_LABELS) as [IssueStatus, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Selected issue details */}
        {selectedIssue ? (
          <div className="flex-1 overflow-y-auto p-4">
            <button
              onClick={() => setSelectedIssue(null)}
              className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to list
            </button>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedIssue.title}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-500">
                    {ISSUE_TYPE_LABELS[selectedIssue.issue_type]}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full`}
                    style={{
                      backgroundColor: `${STATUS_COLORS[selectedIssue.status]}20`,
                      color: STATUS_COLORS[selectedIssue.status],
                    }}
                  >
                    {ISSUE_STATUS_LABELS[selectedIssue.status]}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{selectedIssue.description}</p>
              <div className="text-sm text-gray-500">
                <p>
                  {selectedIssue.grid_reference ||
                    `${selectedIssue.latitude.toFixed(4)}, ${selectedIssue.longitude.toFixed(4)}`}
                </p>
                <p className="mt-1">
                  Reported: {new Date(selectedIssue.created_at).toLocaleDateString()}
                </p>
              </div>
              <Link
                href={`/issues/${selectedIssue.id}`}
                className="block w-full text-center bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
              >
                View Details
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : issues.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No issues reported yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {issues
                  .filter((issue) => {
                    if (filterType !== 'all' && issue.issue_type !== filterType) return false;
                    if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
                    return true;
                  })
                  .map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => {
                        setSelectedIssue(issue);
                        mapInstanceRef.current?.setView([issue.latitude, issue.longitude], 14);
                      }}
                      className="w-full p-4 text-left hover:bg-gray-50"
                    >
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {issue.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {ISSUE_TYPE_LABELS[issue.issue_type]}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${STATUS_COLORS[issue.status]}20`,
                            color: STATUS_COLORS[issue.status],
                          }}
                        >
                          {ISSUE_STATUS_LABELS[issue.status]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(issue.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Report button */}
        {user && (
          <div className="p-4 border-t border-gray-200">
            <Link
              href="/issues/new"
              className="block w-full text-center bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700"
            >
              Report an Issue
            </Link>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full" />
        {mapReady && <MapLegend />}
      </div>
    </div>
  );
}
