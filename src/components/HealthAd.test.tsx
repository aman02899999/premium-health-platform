import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const auth = { isPremium: false, loading: false };
vi.mock("@/health/components/auth/AuthContext", () => ({ useAuth: () => auth }));

describe("in-article ad unit", () => {
  it("renders one in-article unit with the right client and slot, with reserved height", async () => {
    const { HealthAd } = await import("./HealthAd");
    const html = renderToStaticMarkup(<HealthAd />);
    expect(html).toContain('class="adsbygoogle"');
    expect(html).toContain('data-ad-client="ca-pub-3250882336328071"');
    expect(html).toContain('data-ad-slot="9498747260"');
    expect(html).toContain('data-ad-layout="in-article"');
    expect(html).toContain('data-ad-format="fluid"');
    expect(html).toContain("min-height:250px");
  });

  it("renders nothing when hidden", async () => {
    const { HealthAd } = await import("./HealthAd");
    expect(renderToStaticMarkup(<HealthAd hidden />)).toBe("");
  });

  it("premium members see no ad, nor does anyone while sign-in is still loading", async () => {
    const { PremiumAwareAd } = await import("@/health/components/ads/PremiumAwareAd");
    Object.assign(auth, { isPremium: true, loading: false });
    expect(renderToStaticMarkup(<PremiumAwareAd />)).toBe("");
    Object.assign(auth, { isPremium: false, loading: true });
    expect(renderToStaticMarkup(<PremiumAwareAd />)).toBe("");
    Object.assign(auth, { isPremium: false, loading: false });
    expect(renderToStaticMarkup(<PremiumAwareAd />)).toContain("adsbygoogle");
  });
});

describe("where the ad script may load", () => {
  it("only health, blog and Hindi pages, never sign-in, checkout or admin", async () => {
    const { adsAllowedOn } = await import("@/lib/adsense");
    for (const p of ["/health", "/health/blog/x", "/blog", "/blog/x", "/hi/health/blog/x"]) expect(adsAllowedOn(p), p).toBe(true);
    for (const p of ["/", "/membership", "/programs", "/contact", "/store", "/library/x", "/join", "/admin", "/health/login", "/health/register", "/health/profile", "/health/admin", "/health/orders", "/health/premium", "/health/store", "/healthy"]) expect(adsAllowedOn(p), p).toBe(false);
  });
});
