"use client";
import { useEffect, useState, type ChangeEvent } from "react";
import { chartTypes, exampleData, type ChartType, type DataContent, type SharedDataset, type DatasetSummary, validateData } from "@/lib/education-data";
import EducationChart from "@/components/education-chart";
import { IS_CLASSROOM } from "@/lib/app-edition";

export default function SharedDataWorkspace() {
  const [items, setItems] = useState<DatasetSummary[]>([]);
  const [data, setData] = useState<DataContent>(() => exampleData("histogram"));
  const [loaded, setLoaded] = useState<SharedDataset | null>(null);
  const [title, setTitle] = useState("히스토그램_학습예제");
  const [editable, setEditable] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState("");
  async function refresh() { const response = await fetch("/api/education-data", { cache: "no-store" }); if (!response.ok) throw new Error("로그인 후 공동 자료 목록을 불러오세요."); setItems(await response.json()); }
  useEffect(() => { refresh().catch(error => setMessage(error.message)); }, []);
  const discard = () => !dirty || window.confirm("저장하지 않은 입력이 있습니다. 다른 자료로 이동할까요?");
  function show(record: SharedDataset) { setLoaded(record); setData(record); setTitle(record.title); setEditable(false); setDirty(false); setSelected(record.id); }
  async function load() {
    if (!selected || !discard()) return; setBusy(true); setMessage("");
    try { const response = await fetch(`/api/education-data?id=${encodeURIComponent(selected)}`, { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(result.error); show(result); setMessage("원본·저장본을 읽기 전용으로 불러왔습니다. ‘사본으로 수정’ 후 다른 이름으로 저장하세요."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "불러오기 실패"); } finally { setBusy(false); }
  }
  function newTemplate(chart: ChartType) { if (!discard()) return; setData(exampleData(chart)); setLoaded(null); setEditable(true); setDirty(false); setTitle(`${chartTypes[chart].label}_학습예제`); setMessage("합성 학습 예제입니다. 저장 전 입력값을 확인하세요."); }
  function change(row: number, column: number, value: string) { setData(previous => ({ ...previous, rows: previous.rows.map((cells, i) => i === row ? cells.map((cell, j) => j === column ? value : cell) : cells) })); setDirty(true); }
  async function save() {
    setMessage(""); try { validateData(data); } catch (error) { setMessage(error instanceof Error ? error.message : "입력값 확인"); return; }
    setBusy(true);
    try { const response = await fetch("/api/education-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, title, parentId: loaded?.id }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); show(result); await refresh(); setMessage("새 자료로 저장했습니다. 기존 원본·수정본은 그대로 보존했습니다."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "저장 실패"); } finally { setBusy(false); }
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file || !discard()) return;
    const form = new FormData(); form.set("file", file); form.set("chart", data.chart); form.set("title", file.name.replace(/\.[^.]+$/, "")); if (data.lowerSpec !== undefined) form.set("lowerSpec", String(data.lowerSpec)); if (data.upperSpec !== undefined) form.set("upperSpec", String(data.upperSpec)); form.set("unit", data.unit || "");
    setBusy(true); setMessage("");
    try { const response = await fetch("/api/education-data/import", { method: "POST", body: form }); const result = await response.json(); if (!response.ok) throw new Error(result.error); show(result); await refresh(); setMessage("원본 파일과 데이터를 새 자료로 보관했습니다. 원래 파일은 변경하지 않았습니다."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "파일 불러오기 실패"); } finally { setBusy(false); }
  }
  function download(template: boolean) {
    const body = template ? [data.columns, ...data.rows].map(row => row.map(cell => `"${(/^[\s]*[=+\-@]/.test(cell) && !Number.isFinite(Number(cell)) ? "'" : "") + cell.replace(/"/g, '""')}"`).join(",")).join("\r\n") : JSON.stringify({ ...data, title }, null, 2);
    const url = URL.createObjectURL(new Blob([template ? "\uFEFF" + body : body], { type: template ? "text/csv;charset=utf-8" : "application/json" })); const link = document.createElement("a"); link.href = url; link.download = `${title || "학습자료"}.${template ? "csv" : "json"}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="shared-data-workspace">
    <section className="panel"><div className="panel-head"><div><h2>데이터 불러오기</h2><p>{IS_CLASSROOM?"모든 사용자가 같은 서버의 원본·수정본 목록을 봅니다.":"개인용 앱에 저장된 원본·수정본 목록입니다."} 목록은 새로고침해서 최신 상태를 확인하세요.</p></div><button type="button" className="secondary-button" onClick={() => refresh().then(() => setMessage("자료 목록을 새로 불러왔습니다.")).catch(error => setMessage(error.message))}>목록 새로고침</button></div><div className="dataset-load-actions"><select aria-label="저장 자료 선택" value={selected} onChange={event => setSelected(event.target.value)}><option value="">원본·수정본 선택</option>{items.map(item => <option key={item.id} value={item.id}>{item.kind === "original" ? "원본" : "수정본"} · {item.title} · {item.author} · {new Date(item.createdAt).toLocaleString("ko-KR")} · {item.rowCount}행</option>)}</select><button type="button" className="secondary-button" onClick={load} disabled={!selected || busy}>데이터 불러오기</button><label className="secondary-button">파일 불러오기<input type="file" accept=".csv,.xlsx,.json" className="dataset-file-input" onChange={importFile} disabled={busy}/></label></div><p>CSV·XLSX 첫 시트의 머리글은 아래 열 이름과 같아야 합니다. JSON은 이 화면에서 내보낸 파일을 사용할 수 있습니다. 원본 파일은 보관하며 덮어쓰지 않습니다.</p></section>
    <section className="panel"><div className="dataset-form-grid"><label>대상 그래프<select disabled={busy} value={data.chart} onChange={event => newTemplate(event.target.value as ChartType)}>{Object.entries(chartTypes).map(([key, chart]) => <option key={key} value={key}>{chart.type} · {chart.label}</option>)}</select></label><label>자료 이름<input value={title} onChange={event => { setTitle(event.target.value); setDirty(true); }} readOnly={!editable || busy} maxLength={150}/></label><label>단위<input value={data.unit || ""} readOnly={!editable || busy} onChange={event => { setData({ ...data, unit: event.target.value }); setDirty(true); }}/></label>{data.chart === "capability" && <><label>규격 하한<input type="number" step="any" readOnly={!editable || busy} value={data.lowerSpec ?? ""} onChange={event => { setData({ ...data, lowerSpec: event.target.value === "" ? undefined : Number(event.target.value) }); setDirty(true); }}/></label><label>규격 상한<input type="number" step="any" readOnly={!editable || busy} value={data.upperSpec ?? ""} onChange={event => { setData({ ...data, upperSpec: event.target.value === "" ? undefined : Number(event.target.value) }); setDirty(true); }}/></label></>}</div><p><strong>{loaded ? `${loaded.kind === "original" ? "원본" : "수정본"} · ${loaded.author} · ${new Date(loaded.createdAt).toLocaleString("ko-KR")}` : "새 합성 예제 · 아직 저장하지 않음"}</strong>{loaded?.parentId && <small> · 이전 자료 번호 {loaded.parentId}</small>}</p><div className="dataset-actions">{!editable && <button type="button" className="primary-button" disabled={busy} onClick={() => { setEditable(true); setTitle(loaded!.title + "_수정본"); setMessage("사본 편집 중입니다. 저장해도 이전 자료는 변경되지 않습니다."); }}>사본으로 수정</button>}{editable && <button type="button" className="primary-button" onClick={save} disabled={busy}>{busy ? "저장 중…" : loaded ? "다른 이름으로 저장" : "새 원본 저장"}</button>}<button type="button" className="secondary-button" onClick={() => download(true)}>CSV 내려받기 · 양식</button><button type="button" className="secondary-button" onClick={() => download(false)}>JSON 내려받기</button></div>{message && <p className="standard-note" role="status" aria-live="polite">{message}</p>}<p>{editable ? "사본 편집 가능" : "저장된 자료는 읽기 전용"} · {data.rows.length}행 · 필요한 열: {data.columns.join(", ")}</p><div className="table-wrap dataset-table"><table><thead><tr><th>행</th>{data.columns.map(column => <th key={column}>{column}</th>)}{editable && <th>행 관리</th>}</tr></thead><tbody>{data.rows.map((row, i) => <tr key={i}><th>{i + 1}</th>{row.map((cell, j) => <td key={j}><input aria-label={`${i + 1}행 ${data.columns[j]}`} value={cell} readOnly={!editable || busy} onChange={event => change(i, j, event.target.value)}/></td>)}{editable && <td><button type="button" className="secondary-button" disabled={busy} onClick={() => { setData({ ...data, rows: data.rows.filter((_, index) => i !== index) }); setDirty(true); }}>행 제거</button></td>}</tr>)}</tbody></table></div>{editable && <button type="button" className="secondary-button" onClick={() => { setData({ ...data, rows: [...data.rows, data.columns.map(() => "")] }); setDirty(true); }} disabled={busy || data.rows.length >= 5000}>행 추가</button>}</section><EducationChart data={data}/>
  </div>;
}
