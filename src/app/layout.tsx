import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 产品经理工作台",
  description: "围绕具体项目完成需求分析、AI 方案设计、PRD 草稿与竞品分析",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
