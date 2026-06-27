-- Storage upload limits for public beta.
-- Apply to existing Supabase projects to match the client-side upload checks.

begin;

update storage.buckets
set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/gif','image/webp']
where id = 'avatars';

update storage.buckets
set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/gif','image/webp']
where id = 'project-covers';

update storage.buckets
set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','video/quicktime']
where id = 'log-media';

commit;
