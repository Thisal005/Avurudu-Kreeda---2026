import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import BackgroundMusic from "@/components/BackgroundMusic";
import WelcomePopup from "@/components/WelcomePopup";

const geistSans = Outfit({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Outfit({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avurudu Kreeda 2026",
  description: "Subha Aluth Avuruddak Wewa! Play traditional Avurudu games and win prizes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BackgroundMusic />
        <WelcomePopup />
        {children}
      </body>
    </html>
  );
}
