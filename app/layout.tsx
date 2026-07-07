import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM Контракты",
  description: "CRM для работы с кандидатами",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: 'light' }}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light only" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900" data-theme="light">{children}</body>
    </html>
  );
}
