-- Month plan: two cheat-sheet feed posts (morning, afternoon) and a second Reel a day on top of
-- the evening Reel and the Story. Each one is its own channel row, so the same once-a-day
-- claim (unique channel + post_date) keeps every slot from posting twice. Additive only.
alter table public.social_posts drop constraint if exists social_posts_channel_check;
alter table public.social_posts add constraint social_posts_channel_check check (channel in (
  'instagram', 'facebook', 'instagram-story',
  'instagram-am', 'facebook-am', 'instagram-pm', 'facebook-pm', 'instagram-reel2', 'facebook-reel2'
));
