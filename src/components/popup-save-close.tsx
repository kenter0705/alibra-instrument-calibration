"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PopupSaveClose({ listHref, message }: { listHref: string; message: string }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (window.opener && !window.opener.closed) {
        try { window.opener.location.reload(); } catch { /* same-origin opener normally allows refresh */ }
        window.close();
        window.setTimeout(() => { if (!window.closed) window.location.assign(listHref); }, 180);
      } else {
        router.replace(listHref);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [listHref, router]);
  return <div className="form-success popup-save-success" role="status">{message}<small>목록을 갱신하고 작성 창을 닫습니다.</small></div>;
}
