'use client';

import type { IssueStatus } from '@/types';
import { ISSUE_STATUS_LABELS } from '@/types';

// Status colors for markers
const STATUS_COLORS: Record<IssueStatus, string> = {
  draft: '#9ca3af',      // gray
  submitted: '#f59e0b',  // amber
  email_sent: '#3b82f6', // blue
  acknowledged: '#8b5cf6', // purple
  resolved: '#22c55e',   // green
};

// Legend component for the map
export function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md z-[1000]">
      <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
      <div className="space-y-1">
        {(Object.entries(STATUS_COLORS) as [IssueStatus, string][]).map(([status, color]) => (
          <div key={status} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-600">{ISSUE_STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
