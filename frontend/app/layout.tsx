import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GuidanceOS Frontend",
  description: "Runnable hello world frontend for the Guidance OS hackathon project.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
