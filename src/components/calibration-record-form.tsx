"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Save, Pencil } from "lucide-react";

type Option = { id: string; name: string; assetCode?: string; calibrationIntervalMonths?: number | null; category?: string };
type RecordValue = { id: string; instrumentId: string; performedAt: string; nextDueDate: string; result: string; providerId: string | null; procedureId: string | null; certificateNumber: string; cost: number | null; notes: string; attachments?: { id: string; fileName: string }[] };

function asDateInput(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}
function addMonths(dateValue: string, months: number) {
  if (!dateValue || !Number.isInteger(months) || months < 1) return "";
  const [year, month, day] = dateValue.split("-").map(Number);
  const targetMonthIndex = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(targetMonthIndex / 12);
  const targetMonth = targetMonthIndex % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

export default function CalibrationRecordForm({ instruments, providers, procedures, preselected, record, readOnly = false }: { instruments: Option[]; providers: Option[]; procedures: Option[]; preselected?: string; record?: RecordValue; readOnly?: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(!readOnly);
  const [instrumentId, setInstrumentId] = useState(record?.instrumentId ?? preselected ?? "");
  const [performedAt, setPerformedAt] = useState(asDateInput(record?.performedAt));
  const router = useRouter();
  const instrument = useMemo(() => instruments.find((item) => item.id === instrumentId), [instruments, instrumentId]);
  const period = instrument?.calibrationIntervalMonths ?? null;
  const nextDueDate = editing
    ? addMonths(performedAt, period ?? 0)
    : asDateInput(record?.nextDueDate);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(record ? `/api/calibrations/${record.id}` : "/api/calibrations", {
        method: record ? "PATCH" : "POST",
        body: new FormData(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "저장하지 못했습니다.");
      setEditing(false);
      setError(record ? "검교정 이력이 저장되었습니다." : `검교정 이력 등록 완료 · 성적서 ${data.certificateNumber}`);
      if (!record) router.replace(`/calibrations/${data.id}?saved=1`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="data-form" onSubmit={submit}>
    <div className="form-grid">
      <label>계측기
        <select name="instrumentId" value={instrumentId} onChange={(e) => setInstrumentId(e.target.value)} required disabled={!editing}>
          <option value="">계측기 선택</option>
          {instruments.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.assetCode}{item.category?` · ${item.category}`:""}</option>)}
        </select>
      </label>
      <label>검교정 주기 (개월)
        <input value={period ? `${period}개월` : "계측기 분류·주기 확인 필요"} readOnly aria-label="선택한 계측기의 검교정 주기" />
        <small>{instrument?.category || "계측기 대장의 KOLAS 분류 및 등록 주기를 불러옵니다."}</small>
      </label>
      <label>검교정일
        <input name="performedAt" type="date" value={performedAt} onChange={(e) => setPerformedAt(e.target.value)} required disabled={!editing} />
      </label>
      <label>다음 예정일
        <input name="nextDueDate" type="date" value={nextDueDate} readOnly required />
        <small>검교정일에 계측기 주기를 더해 자동 계산합니다.</small>
      </label>
      <label>결과<select name="result" defaultValue={record?.result ?? "합격"} required disabled={!editing}>{["합격", "조건부 합격", "불합격", "판정 보류"].map((x) => <option key={x}>{x}</option>)}</select></label>
      <label>검교정 업체<select name="providerId" defaultValue={record?.providerId ?? ""} disabled={!editing}><option value="">자체 검교정 / 미지정</option>{providers.map((x) => <option value={x.id} key={x.id}>{x.name}</option>)}</select></label>
      <label>적용 절차서<select name="procedureId" defaultValue={record?.procedureId ?? ""} disabled={!editing}><option value="">선택 안 함</option>{procedures.map((x) => <option value={x.id} key={x.id}>{x.name}</option>)}</select></label>
      <label>성적서 번호<input name="certificateNumber" defaultValue={record?.certificateNumber ?? ""} placeholder="미입력 시 자동 부여" disabled={!editing} /></label>
      <label>검교정 비용 (원)<input name="cost" type="number" min="0" step="1" defaultValue={record?.cost ?? ""} disabled={!editing} /></label>
      <label>성적서·사진·원자료 첨부<input name="attachments" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xlsx" disabled={!editing} /></label>
      <label className="full-width">비고<textarea name="notes" rows={3} defaultValue={record?.notes ?? ""} disabled={!editing} /></label>
    </div>
    {record?.attachments?.length ? <div className="calibration-existing-files"><b>등록된 첨부</b>{record.attachments.map((file) => <a key={file.id} href={`/api/calibration-files/${file.id}`} target="_blank" rel="noreferrer">{file.fileName}</a>)}</div> : null}
    {editing && <p className="muted-note"><Paperclip size={13} /> 첨부 파일은 최대 25MB, 여러 파일을 선택해 PC 로컬 폴더에 저장합니다.</p>}
    {error && <p className={error.includes("완료") || error.includes("저장되었습니다") ? "form-success" : "form-error"} role="status">{error}</p>}
    <div className="form-actions">{!editing && <button type="button" className="secondary-button" onClick={() => setEditing(true)}><Pencil size={14} /> 수정</button>}{editing && <button className="primary-button" disabled={busy || !period || !nextDueDate}><Save size={14} />{busy ? "저장 중" : record ? "저장" : "검교정 이력 등록"}</button>}</div>
  </form>;
}
