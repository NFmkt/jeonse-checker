import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "전세대출 자격진단",
  description: "주택도시기금 전세자금대출 자격을 간편하게 진단해보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
