-- YouTube long videos: allow up to three on one day. The day's first stays on channel
-- youtube-long; extras (two videos given the same date) use youtube-long-2 and youtube-long-3.
-- Additive only: it widens the allowed channels.
alter table public.social_posts drop constraint if exists social_posts_channel_check;
alter table public.social_posts add constraint social_posts_channel_check check (channel in (
  'instagram', 'facebook', 'instagram-story',
  'instagram-am', 'facebook-am', 'instagram-pm', 'facebook-pm', 'instagram-reel2', 'facebook-reel2',
  'youtube-1', 'youtube-2', 'youtube-3', 'youtube-long', 'youtube-long-2', 'youtube-long-3'
));
