import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import NotificationProvider from "@/components/NotificationProvider";
import ChatNotifications from "@/components/ChatNotifications";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext", "cyrillic-ext"],
  weight: ["400", "500", "600", "700", "800"],
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
      className={`${jakarta.variable} h-full antialiased`}
      style={{ colorScheme: 'light' }}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light only" />
      </head>
      <body className="min-h-full flex flex-col bg-[#f5f1ea] text-[#2d2520]" data-theme="light">
        <NotificationProvider>
          {children}
          <ChatNotifications />
        </NotificationProvider>
      </body>
    </html>
  );
}
