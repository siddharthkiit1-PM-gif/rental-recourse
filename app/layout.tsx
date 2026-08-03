import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recourse — free legal notice drafter",
  description: "Free tool for Indian tenants to draft a statute-grounded legal notice for unreturned security deposits.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
