import { redirect } from "next/navigation";

// Winner emails link here: the profile tab shows badges, prizes and claim codes.
export default function ChallengeMePage() {
  redirect("/challenge/play?tab=me");
}
