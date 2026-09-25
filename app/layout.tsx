import type { Metadata, Viewport } from "next";
import { Bungee, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bungee = Bungee({ variable: "--font-bungee", weight: "400", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

const title = "RED OR BLACK";
const description = "Pick a color. Every 5 minutes the wheel spins — if the community calls it, every creator reward buys the coin back and burns it.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: title,
  openGraph: { title, description, type: "website", siteName: title },
  twitter: { card: "summary_large_image", title, description },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='46' fill='%23e11d2e' stroke='%23f5c542' stroke-width='6'/><path d='M50 4 A46 46 0 0 1 50 96 Z' fill='%23111'/></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: "#07070a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bungee.variable} ${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
