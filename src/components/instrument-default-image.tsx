import { Gauge } from "lucide-react";

/** Local, always-available front illustration used until a real front photo is uploaded. */
export default function InstrumentDefaultImage({ category, compact = false }: { category: string; compact?: boolean }) {
  const pressure = /압력|압계|차압|누설|리크/i.test(category);
  const torque = /토크/i.test(category);
  const length = /길이|치수|마이크로|캘리퍼|게이지/i.test(category);
  return <div className={`instrument-default-image${compact ? " compact" : ""}`} role="img" aria-label="자동 표시 계측기 대표 이미지">
    <svg viewBox="0 0 320 190" aria-hidden="true">
      <defs><linearGradient id="metal" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff"/><stop offset=".55" stopColor="#dbe5f2"/><stop offset="1" stopColor="#a9bad1"/></linearGradient><linearGradient id="blue" x1="0" x2="1"><stop stopColor="#315b9e"/><stop offset="1" stopColor="#6489c7"/></linearGradient></defs>
      <ellipse cx="160" cy="166" rx="108" ry="12" fill="#223654" opacity=".09"/>
      {pressure ? <><circle cx="160" cy="91" r="62" fill="url(#metal)" stroke="#8ba1bd" strokeWidth="4"/><circle cx="160" cy="91" r="48" fill="#fbfdff" stroke="#d4deeb" strokeWidth="2"/><path d="M126 109a39 39 0 0 1 68-34" fill="none" stroke="#5578b2" strokeWidth="3" strokeDasharray="2 7"/><path d="M160 91 188 65" stroke="#d24c4c" strokeWidth="4" strokeLinecap="round"/><circle cx="160" cy="91" r="6" fill="#304b70"/><path d="M148 153h24v18h-24zM151 170h18v8h-18z" fill="url(#metal)" stroke="#8ba1bd" strokeWidth="2"/></>
        : torque ? <><path d="M62 99h132a31 31 0 0 0 31-31V53h33v18a64 64 0 0 1-64 64H62z" fill="url(#metal)" stroke="#8095b0" strokeWidth="4"/><path d="M205 53h48V38l30 25-30 25V73h-48z" fill="url(#blue)"/><circle cx="76" cy="116" r="18" fill="#e8eef6" stroke="#8095b0" strokeWidth="4"/><path d="M68 116h16m-8-8v16" stroke="#5275ae" strokeWidth="3" strokeLinecap="round"/></>
        : length ? <><path d="M58 58h194v19H58zM58 58v82h18V77m0 45h95v18H76m50-63v24m13-24v17m13-17v24m13-24v17m13-17v24m13-17v17m13-17v24m13-17v17" fill="url(#metal)" stroke="#758da9" strokeWidth="3" strokeLinejoin="round"/><rect x="161" y="77" width="57" height="40" rx="8" fill="url(#blue)" stroke="#294b80" strokeWidth="3"/><rect x="171" y="86" width="37" height="19" rx="3" fill="#e9f4ff"/><path d="M177 96h24" stroke="#3d659f" strokeWidth="3"/></>
        : <><rect x="100" y="35" width="120" height="120" rx="15" fill="url(#metal)" stroke="#8298b4" strokeWidth="4"/><rect x="118" y="51" width="84" height="42" rx="6" fill="#eaf4ff" stroke="#8da4c1" strokeWidth="3"/><path d="M130 76h18l9-13 10 20 8-9h15" fill="none" stroke="#4775bb" strokeWidth="3" strokeLinejoin="round"/><circle cx="133" cy="119" r="10" fill="url(#blue)"/><circle cx="160" cy="119" r="10" fill="#d8a04e"/><circle cx="187" cy="119" r="10" fill="#68a787"/><path d="M145 155v14m30-14v14M134 169h52" stroke="#778ca7" strokeWidth="5" strokeLinecap="round"/></>}
      <path d="M38 174h244" stroke="#d4deea" strokeWidth="2"/>
    </svg>
    {!compact && <span>계측기 정면 대표 이미지 · 사진 등록 시 실제 사진으로 교체</span>}
  </div>;
}
