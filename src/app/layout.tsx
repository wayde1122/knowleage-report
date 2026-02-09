import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DailyInsightHub - 知识日报",
  description: "多平台热榜聚合 + AI 智能分析的知识日报站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
