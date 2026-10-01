import { CartBar } from "@/components/library/CartBar";

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CartBar />
    </>
  );
}
