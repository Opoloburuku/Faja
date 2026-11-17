import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Faja — leads nobody else has",
  description: "Fresh, organic leads from public intent signals. Shared with a few businesses at most, never sold to everyone.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
