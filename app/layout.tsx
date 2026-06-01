import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Parking Availability Predictor",
  description:
    "A modern SaaS-style Smart Parking Availability Predictor for cities, campuses, and operators.",
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
