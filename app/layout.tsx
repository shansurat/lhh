import type { Metadata, Viewport } from "next";
import { Open_Sans, Poppins } from "next/font/google";
import "./globals.css";
import PWARegister from "./components/PWARegister";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://iskolibmap.web.app"),
  title: {
    default: "IskoLibMap",
    template: "%s | IskoLibMap",
  },
  description: "An Unofficial Guide to UP Diliman Libraries",
  applicationName: "IskoLibMap",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IskoLibMap",
  },
  openGraph: {
    title: "IskoLibMap",
    description: "An unofficial guide to UP Diliman libraries.",
    url: "https://iskolibmap.web.app",
    siteName: "IskoLibMap",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "IskoLibMap",
    description: "An unofficial guide to UP Diliman libraries.",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#7b1113",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${openSans.variable} ${poppins.variable} antialiased`}>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
