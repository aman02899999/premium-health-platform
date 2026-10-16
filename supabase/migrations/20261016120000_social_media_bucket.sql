-- Public bucket for rendered Reels: Instagram and Facebook download the video from its public URL.
-- Only the server (service role) writes to it; anyone can read, which is the point.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('social-media', 'social-media', true, 52428800, array['video/mp4', 'image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
