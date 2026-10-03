import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "NBA Fantasy Lab", description: "NBA player research and fantasy tools" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
