-- YouTube Shorts: three uploads a day, one social_posts row per slot per day (youtube-1/2/3).
-- The row's theme holds the script id, so no script is ever uploaded twice. Additive only.
alter table public.social_posts drop constraint if exists social_posts_channel_check;
alter table public.social_posts add constraint social_posts_channel_check check (channel in (
  'instagram', 'facebook', 'instagram-story',
  'instagram-am', 'facebook-am', 'instagram-pm', 'facebook-pm', 'instagram-reel2', 'facebook-reel2',
  'youtube-1', 'youtube-2', 'youtube-3'
));
