import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import ThemeProvider from "@/components/ThemeProvider";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "AIOrbit — Your Personal AI Command Center",
  description: "Manage your AI ecosystem. Track tools, set goals, log decisions, and learn continuously — all in one place.",
};

import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
