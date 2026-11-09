-- YouTube long videos: ready-made 4–5 minute MP4s, at most one a day, one social_posts row per
-- day (channel youtube-long, theme = the video id). Additive only: it widens the allowed channels.
alter table public.social_posts drop constraint if exists social_posts_channel_check;
alter table public.social_posts add constraint social_posts_channel_check check (channel in (
  'instagram', 'facebook', 'instagram-story',
  'instagram-am', 'facebook-am', 'instagram-pm', 'facebook-pm', 'instagram-reel2', 'facebook-reel2',
  'youtube-1', 'youtube-2', 'youtube-3', 'youtube-long'
));
