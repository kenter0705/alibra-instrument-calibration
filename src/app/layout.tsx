import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "계측기 통합관리 시스템",
  description: "계측기 검교정 이력관리 통합 시스템",
  manifest: "/manifest.webmanifest",
  applicationName: "CALIBRA",
  appleWebApp: { capable: true, title: "CALIBRA", statusBarStyle: "default" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
