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
  title: "IskoLibMap",
  description: "An Unofficial Guide to UP Diliman Libraries",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IskoLibMap",
  },
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
      <body
        className={`${openSans.variable} ${poppins.variable} antialiased`}
      >
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
