-- The daily sales Story on Instagram is logged like the feed posts (one per day, retried on failure).
alter table public.social_posts drop constraint if exists social_posts_channel_check;
alter table public.social_posts add constraint social_posts_channel_check check (channel in ('instagram', 'facebook', 'instagram-story'));
