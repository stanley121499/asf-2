-- Warranty claim photo evidence storage bucket.
-- Path convention: claim_evidence/{user_id}/{session_or_claim_id}/{filename}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'claim_evidence',
  'claim_evidence',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated customers may upload only into their own top-level folder.
CREATE POLICY "claim_evidence_insert_own_folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'claim_evidence'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read so staff and customer detail pages can render evidence URLs.
CREATE POLICY "claim_evidence_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'claim_evidence');

-- Allow customers to remove mistaken uploads before claim submission.
CREATE POLICY "claim_evidence_delete_own_folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'claim_evidence'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
