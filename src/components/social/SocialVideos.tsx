import { YOUTUBE_CHANNEL } from "@/lib/site";
import { siteFeed } from "@/lib/social/site-feed";
import { SocialVideosClient, type Tone } from "./SocialVideosClient";

/**
 * The home pages' "watch our videos" block: long YouTube videos with a playlist, Shorts and the
 * latest Instagram posts, all click-to-play on the page. Data comes from social_posts, so it keeps
 * rendering (as plain links) when the database or the Meta tokens are down.
 */
export async function SocialVideos({ tone, instagramHandle = "royalfitness93_" }: { tone: Tone; instagramHandle?: string }) {
  const feed = await siteFeed().catch(() => ({ long: [], shorts: [], instagram: [] }));
  const ld = feed.long.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: feed.long.map((v, i) => ({
          "@type": "VideoObject",
          position: i + 1,
          name: v.title,
          description: v.description,
          thumbnailUrl: [v.thumb],
          uploadDate: v.uploadDate,
          embedUrl: `https://www.youtube.com/embed/${v.youtubeId}`,
          url: `https://www.youtube.com/watch?v=${v.youtubeId}`,
          inLanguage: "hi-Latn",
        })),
      }
    : null;
  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />}
      <SocialVideosClient
        tone={tone}
        long={feed.long.map((v) => ({ youtubeId: v.youtubeId, title: v.title, thumb: v.thumb }))}
        shorts={feed.shorts}
        instagram={feed.instagram}
        channelUrl={YOUTUBE_CHANNEL.url}
        subscribeUrl={YOUTUBE_CHANNEL.subscribe}
        instagramHandle={instagramHandle.replace(/^@/, "") || "royalfitness93_"}
      />
    </>
  );
}
