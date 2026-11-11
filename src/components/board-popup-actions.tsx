"use client";

import { ArrowLeft, X } from "lucide-react";

type Props = {
  listHref: string;
  listLabel?: string;
  refreshOpener?: boolean;
};

export default function BoardPopupActions({ listHref, listLabel = "목록가기" }: Props) {
  const goToList = () => {
    if (window.opener && !window.opener.closed) {
      try { window.opener.location.assign(listHref); } catch { /* cross-origin opener */ }
      window.close();
      window.setTimeout(() => { if (!window.closed) window.location.assign(listHref); }, 250);
      return;
    }
    window.location.assign(listHref);
  };
  const closePage = () => {
    if (window.opener && !window.opener.closed) {
      window.close();
      window.setTimeout(() => { if (!window.closed) window.location.assign(listHref); }, 250);
      return;
    }
    window.location.assign(listHref);
  };

  return (
    <div className="record-actions no-print">
      <button type="button" className="secondary-button" onClick={goToList}>
        <ArrowLeft size={15} /> {listLabel}
      </button>
      <button type="button" className="secondary-button" onClick={closePage}>
        <X size={15} /> 닫기
      </button>
    </div>
  );
}
