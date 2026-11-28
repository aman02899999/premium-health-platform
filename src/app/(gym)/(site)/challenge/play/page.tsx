import type { Metadata } from "next";
import { ChallengeApp } from "@/components/challenge/ChallengeApp";
import { RefCapture } from "@/components/challenge/RefCapture";

export const metadata: Metadata = { title: "Play the Royal Knowledge Challenge", robots: { index: false, follow: false } };

export default function ChallengePlayPage() {
  return (
    <section className="min-h-[70vh] px-4 pb-8 pt-28 sm:px-6 sm:pb-12 sm:pt-36">
      <RefCapture />
      <h1 className="sr-only">Royal Knowledge Challenge</h1>
      <ChallengeApp />
    </section>
  );
}
