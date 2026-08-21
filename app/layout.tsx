import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const previewImage = new URL("/og.png", baseUrl).toString();

  return {
    metadataBase: baseUrl,
    title: "幸运翻牌",
    description: "三张幸运牌，选一张翻开你的专属好礼。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "幸运翻牌",
      description: "心动好礼，藏在其中。快来翻开你的幸运牌！",
      type: "website",
      images: [{ url: previewImage, width: 1674, height: 941, alt: "幸运翻牌抽奖" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "幸运翻牌",
      description: "心动好礼，藏在其中。快来翻开你的幸运牌！",
      images: [previewImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
