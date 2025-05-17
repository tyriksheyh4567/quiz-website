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
  title: "Генератор викторин с помощью ИИ",
  description: "Веб-приложение для создания викторин с помощью искусственного интеллекта на русском языке",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-b from-blue-200 via-blue-100 to-white min-h-screen flex flex-col`}
      >
        <header className="bg-blue-700 text-white p-4 text-center text-xl font-semibold">
          Генератор викторин с помощью ИИ
        </header>
        <main className="flex-grow flex items-center justify-center p-8">
          {children}
        </main>
        <footer className="bg-blue-700 text-white p-4 text-center text-sm">
          &copy; 2024 Генератор викторин ИИ. Все права защищены.
        </footer>
      </body>
    </html>
  );
}
