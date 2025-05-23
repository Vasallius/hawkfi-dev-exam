import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import HawksightThemeProvider from "@/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HawkFi Dev Exam",
  description: "HawkFi Dev Exam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <HawksightThemeProvider>{children}</HawksightThemeProvider>
      </body>
    </html>
  );
}
