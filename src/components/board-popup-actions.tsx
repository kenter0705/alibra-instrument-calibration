"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";

export default function BoardPopupActions({ listHref, listLabel = "목록가기" }: { listHref: string; listLabel?: string }) {
  const router = useRouter();
  const goToList = () => {
    if (window.opener && !window.opener.closed) {
      window.close();
      window.setTimeout(() => { if (!window.closed) window.location.assign(listHref); }, 120);
      return;
    }
    router.push(listHref);
  };
  const closePage = () => {
    if (window.opener && !window.opener.closed) {
      window.close();
      window.setTimeout(() => { if (!window.closed) window.location.assign(listHref); }, 120);
      return;
    }
    router.push(listHref);
  };
  return <div className="record-actions no-print">
    <button className="secondary-button" type="button" onClick={goToList}><ArrowLeft size={15}/>{listLabel}</button>
    <button className="secondary-button" type="button" onClick={closePage}><X size={15}/>닫기</button>
  </div>;
}
