-- Footpath Problems Database Schema
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE issue_type AS ENUM (
  'erosion',
  'overgrowth',
  'damaged_sign',
  'blocked_path',
  'flooding',
  'dangerous_crossing',
  'missing_waymark',
  'damaged_fence',
  'path_poorly_defined',
  'other'
);

CREATE TYPE issue_status AS ENUM (
  'draft',
  'submitted',
  'email_sent',
  'acknowledged',
  'resolved'
);

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  preferred_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issues table
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  issue_type issue_type NOT NULL DEFAULT 'other',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  grid_reference TEXT,
  status issue_status NOT NULL DEFAULT 'draft',
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issue_photos table
CREATE TABLE issue_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create emails_sent table
CREATE TABLE emails_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  council_name TEXT NOT NULL,
  council_email TEXT NOT NULL,
  email_subject TEXT NOT NULL,
  email_body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resend_id TEXT
);

-- Create indexes for better query performance
CREATE INDEX idx_issues_user_id ON issues(user_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_location ON issues(latitude, longitude);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX idx_issue_photos_issue_id ON issue_photos(issue_id);
CREATE INDEX idx_emails_sent_issue_id ON emails_sent(issue_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Issues policies
CREATE POLICY "Anyone can view non-draft issues"
  ON issues FOR SELECT
  USING (status != 'draft' OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create issues"
  ON issues FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own issues"
  ON issues FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own draft issues"
  ON issues FOR DELETE
  USING (user_id = auth.uid() AND status = 'draft');

-- Issue photos policies
CREATE POLICY "Anyone can view photos of visible issues"
  ON issue_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM issues
      WHERE issues.id = issue_photos.issue_id
      AND (issues.status != 'draft' OR issues.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add photos to their own issues"
  ON issue_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM issues
      WHERE issues.id = issue_photos.issue_id
      AND issues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos from their own issues"
  ON issue_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM issues
      WHERE issues.id = issue_photos.issue_id
      AND issues.user_id = auth.uid()
    )
  );

-- Emails sent policies
CREATE POLICY "Anyone can view emails for visible issues"
  ON emails_sent FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM issues
      WHERE issues.id = emails_sent.issue_id
      AND (issues.status != 'draft' OR issues.user_id = auth.uid())
    )
  );

CREATE POLICY "Service role can insert emails"
  ON emails_sent FOR INSERT
  WITH CHECK (true);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for issue photos
-- Note: Run this in the Supabase dashboard or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('issue-photos', 'issue-photos', true);

-- Storage policies (run in Supabase dashboard)
-- CREATE POLICY "Anyone can view issue photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'issue-photos');

-- CREATE POLICY "Authenticated users can upload issue photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'issue-photos' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Users can delete their own photos"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'issue-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
