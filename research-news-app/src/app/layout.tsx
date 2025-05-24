import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Research News - 論文ベース新聞生成システム",
  description: "学術論文を新聞形式で視覚的に分かりやすく提供するサービス",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
