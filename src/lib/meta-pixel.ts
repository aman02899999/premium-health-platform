// Browser side of the Meta Pixel. A no-op until NEXT_PUBLIC_META_PIXEL_ID is set (the pixel script
// is only added to the page then). Each tracked event carries an id that the server's Conversions
// API event repeats, so Meta counts it once.

type Fbq = (cmd: "track" | "trackCustom", event: string, params?: Record<string, unknown>, options?: { eventID?: string }) => void;

export const newEventId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function trackPixel(event: "Lead" | "InitiateCheckout" | "Purchase" | "Contact", params: Record<string, unknown> = {}, eventId?: string) {
  const fbq = (globalThis as { fbq?: Fbq }).fbq;
  if (typeof fbq === "function") fbq("track", event, params, eventId ? { eventID: eventId } : undefined);
}
