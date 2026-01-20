-- Create storage bucket for challenge photos
-- Run this in Supabase Dashboard > Storage > Create a new bucket
-- Or use the SQL below if running migrations programmatically

-- Note: Storage bucket creation is typically done via the Supabase Dashboard or API
-- The bucket should be named: challenge-photos
-- Public: Yes (so photos can be viewed by anyone with the URL)

-- Storage policies for the challenge-photos bucket
-- These need to be run in the SQL Editor after creating the bucket

-- Allow authenticated users to upload photos
CREATE POLICY "Users can upload challenge photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'challenge-photos' AND
  auth.uid()::text = (storage.foldername(name))[3]
);

-- Allow anyone to view photos (public bucket)
CREATE POLICY "Anyone can view challenge photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'challenge-photos');

-- Allow users to update their own photos
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'challenge-photos' AND
  auth.uid()::text = (storage.foldername(name))[3]
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'challenge-photos' AND
  auth.uid()::text = (storage.foldername(name))[3]
);

-- MANUAL STEPS:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: challenge-photos
-- 4. Public bucket: Yes
-- 5. Click "Create bucket"
-- 6. Run the policies above in SQL Editor
