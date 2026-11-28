import type { Metadata } from "next";

// The page is a client component, so its title, description and canonical live here.
export const metadata: Metadata = {
  title: "Contact us",
  description: "Send a correction, a question or feedback to the Bharat Health Guide team. For medical problems, please see a doctor.",
  alternates: { canonical: "/health/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
