"use client";

import { useState, type ReactNode } from "react";
import { BookOpen, Download } from "lucide-react";

export default function DownloadHelpTabs({
  downloadContent,
  manualContent,
}: {
  downloadContent: ReactNode;
  manualContent: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"download" | "manual">("download");

  return (
    <>
      <div role="tablist" aria-label="설치 자료" className="download-tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "download"}
          className={`download-tab ${activeTab === "download" ? "active" : ""}`}
          onClick={() => setActiveTab("download")}
        >
          <Download size={16} /> 다운로드
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "manual"}
          className={`download-tab ${activeTab === "manual" ? "active" : ""}`}
          onClick={() => setActiveTab("manual")}
        >
          <BookOpen size={16} /> 사용 설명서 · 문제 해결
        </button>
      </div>
      <section role="tabpanel" hidden={activeTab !== "download"}>
        {downloadContent}
      </section>
      <section role="tabpanel" hidden={activeTab !== "manual"}>
        {manualContent}
      </section>
    </>
  );
}
