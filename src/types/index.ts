export type IssueType =
  | 'erosion'
  | 'overgrowth'
  | 'damaged_sign'
  | 'blocked_path'
  | 'flooding'
  | 'dangerous_crossing'
  | 'missing_waymark'
  | 'damaged_fence'
  | 'path_poorly_defined'
  | 'other';

export type IssueStatus =
  | 'draft'
  | 'submitted'
  | 'email_sent'
  | 'acknowledged'
  | 'resolved';

export interface Profile {
  id: string;
  display_name: string | null;
  preferred_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  user_id: string | null;
  title: string;
  description: string;
  issue_type: IssueType;
  latitude: number;
  longitude: number;
  grid_reference: string | null;
  status: IssueStatus;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface IssuePhoto {
  id: string;
  issue_id: string;
  storage_path: string;
  created_at: string;
}

export interface EmailSent {
  id: string;
  issue_id: string;
  council_name: string;
  council_email: string;
  email_subject: string;
  email_body: string;
  sent_at: string;
  resend_id: string | null;
}

export interface IssueWithPhotos extends Issue {
  issue_photos: IssuePhoto[];
  emails_sent: EmailSent[];
  profiles?: Profile;
}

export interface CouncilInfo {
  id: number;
  name: string;
  type: string;
  type_name: string;
  country: string;
  country_name: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  gridReference?: string;
}

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  erosion: 'Path Erosion',
  overgrowth: 'Overgrowth',
  damaged_sign: 'Damaged Sign',
  blocked_path: 'Blocked Path',
  flooding: 'Flooding',
  dangerous_crossing: 'Dangerous Crossing',
  missing_waymark: 'Missing Waymark',
  damaged_fence: 'Damaged Boundary Fence',
  path_poorly_defined: 'Path Unclear on Ground',
  other: 'Other Issue',
};

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  email_sent: 'Email Sent',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
};
