import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Airtel SCM SOW Form",
  description: "Dynamic SOW form with mandatory AI validation"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
