import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MacroTrackro — Macro & Calorie Tracker",
  description: "Track calories, protein, carbs and fat for the food you eat each day.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
