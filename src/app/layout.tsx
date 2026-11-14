import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@/lib/app-edition";
import BoardExportTools from "@/components/board-export-tools";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "계측기 검교정 이력관리 통합 시스템",
  manifest: "/manifest.webmanifest",
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><BoardExportTools/>{children}</body></html>;
}
