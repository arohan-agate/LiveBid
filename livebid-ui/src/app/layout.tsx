import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { UserProvider } from "@/context/UserContext";
import { GoogleAuthProvider } from "@/components/GoogleAuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LiveBid - Real-Time Auctions",
  description: "Experience the thrill of live bidding battles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50`}>
        <GoogleAuthProvider>
          <UserProvider>
            <Header />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </UserProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
