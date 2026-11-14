"use client";
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import ChecksheetAnalysis from "@/components/checksheet-analysis";
import QcFishbone from "@/components/qc-fishbone";
import SpcControlAnalysis from "@/components/spc-control-analysis";
import { type DataContent, chartTypes, validateData } from "@/lib/education-data";

const mean = (values: number[]) => values.reduce((sum, x) => sum + x, 0) / values.length;
export default function EducationChart({ data }: { data: DataContent }) {
  try { validateData(data); } catch (error) { return <p className="standard-note">{error instanceof Error ? error.message : "데이터를 확인하세요."}</p>; }
  const { chart, rows } = data;
  if(chart==="checksheet")return <ChecksheetAnalysis text={rows.map(r=>r.join(",")).join("\n")} mode="category" onModeChange={()=>{}} example={()=>{}} hideModeControls/>;
  if (["xbar","imr","p","np","c","u"].includes(chart)) {const mode=chart==="xbar"?"xbar-r":chart==="imr"?"i-mr":chart;const text=rows.map(row=>chart==="xbar"?row.slice(1).join(","):chart==="imr"?row[1]:chart==="c"?row[0]:[row[1],row[0]].join(",")).join("\n");return <SpcControlAnalysis mode={mode} text={text} subgroup={5} unit={data.unit||""}/>;}
  if (chart === "fishbone") return <QcFishbone text={rows.map(r=>r.join(",")).join("\n")} effect={"title" in data?String(data.title):"분석 대상 특성"}/>;
  if (chart === "scatter") return <div className="education-plot"><ResponsiveContainer width="100%" height={320}><ScatterChart><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" dataKey="x" name="X"/><YAxis type="number" dataKey="y" name="Y" domain={["auto", "auto"]}/><Tooltip cursor={{ strokeDasharray: "3 3" }}/><Scatter name="측정값" data={rows.map(row => ({ x: Number(row[0]), y: Number(row[1]) }))} fill="#416bc4"/></ScatterChart></ResponsiveContainer></div>;
  let points: { name: string; value: number; center?: number; upper?: number; lower?: number; cumulative?: number }[] = [];
  let secondary: typeof points = [];
  let summary = "";
  let bar = false;
  if (chart === "histogram" || chart === "capability") {
    const values = rows.map(row => Number(row[0])), average = mean(values), sd = Math.sqrt(values.reduce((s, v) => s + (v - average) ** 2, 0) / (values.length - 1));
    const low = Math.min(...values), high = Math.max(...values), count = Math.min(12, Math.max(5, Math.ceil(Math.sqrt(values.length)))), width = (high - low || 1) / count;
    points = Array.from({ length: count }, (_, i) => ({ name: (low + width * (i + .5)).toFixed(3), value: values.filter(value => value >= low + i * width && (i === count - 1 ? value <= high : value < low + (i + 1) * width)).length })); bar = true;
    summary = `n=${values.length} · 평균 ${average.toFixed(4)} · 표준편차 ${sd.toFixed(4)} ${data.unit || ""}`;
    if (chart === "capability" && sd > 0) summary += ` · Pp ${((data.upperSpec! - data.lowerSpec!) / (6 * sd)).toFixed(3)} · Ppk ${Math.min((data.upperSpec! - average) / (3 * sd), (average - data.lowerSpec!) / (3 * sd)).toFixed(3)} · 규격 ${data.lowerSpec}~${data.upperSpec}`;
  } else if (["pareto", "checksheet", "stratification"].includes(chart)) {
    const groups = new Map<string, number[]>();
    rows.forEach(row => groups.set(row[0], [...(groups.get(row[0]) || []), Number(row[1])]));
    points = [...groups].map(([name, values]) => ({ name, value: chart === "stratification" ? mean(values) : values.reduce((s, x) => s + x, 0) }));
    if (chart === "pareto") { points.sort((a, b) => b.value - a.value); const total = points.reduce((s, p) => s + p.value, 0); let running = 0; points = points.map(p => ({ ...p, cumulative: total ? (running += p.value) / total * 100 : 0 })); }
    bar = true; summary = chart === "stratification" ? "그룹별 측정값 평균" : "유형별 발생 건수";
  } else if (["p", "np", "c", "u"].includes(chart)) {
    const counts = rows.map(row => Number(row[chart === "c" ? 0 : 1])), n = rows.map(row => chart === "c" ? 1 : Number(row[0]));
    const rate = counts.reduce((s, x) => s + x, 0) / n.reduce((s, x) => s + x, 0), cbar = mean(counts);
    points = rows.map((_, i) => {
      const center = chart === "p" || chart === "u" ? rate : chart === "np" ? n[i] * rate : cbar;
      const delta = 3 * Math.sqrt(chart === "p" ? rate * (1 - rate) / n[i] : chart === "np" ? n[i] * rate * (1 - rate) : chart === "c" ? cbar : rate / n[i]);
      return { name: String(i + 1), value: chart === "p" || chart === "u" ? counts[i] / n[i] : counts[i], center, upper: chart === "p" ? Math.min(1, center + delta) : center + delta, lower: Math.max(0, center - delta) };
    }); summary = "중심선·3σ 관리한계 · p/np는 불량품, c/u는 결점 기준";
  } else if (chart === "xbar") {
    const values = rows.map(row => row.slice(1).map(Number)), averages = values.map(mean), ranges = values.map(group => Math.max(...group) - Math.min(...group)), center = mean(averages), rbar = mean(ranges);
    points = averages.map((value, i) => ({ name: rows[i][0], value, center, upper: center + .577 * rbar, lower: center - .577 * rbar }));
    secondary = ranges.map((value, i) => ({ name: rows[i][0], value, center: rbar, upper: 2.114 * rbar, lower: 0 })); summary = "X̄ 관리도와 R 관리도 · 부분군 크기 5";
  } else {
    const values = rows.map(row => Number(row[chart === "grr" ? 3 : 1])), center = mean(values), mr = values.slice(1).map((v, i) => Math.abs(v - values[i])), mrbar = mean(mr);
    points = values.map((value, i) => chart === "grr" ? { name: rows[i].slice(0, 3).join("/"), value } : { name: rows[i][0], value, center, upper: center + 2.66 * mrbar, lower: center - 2.66 * mrbar });
    if (chart === "imr") secondary = mr.map((value, i) => ({ name: rows[i + 1][0], value, center: mrbar, upper: 3.267 * mrbar, lower: 0 }));
    summary = chart === "grr" ? "부품/측정자/반복별 원측정값 미리보기입니다. 분산 성분 분석은 Gage R&R 분석에서 수행하세요." : "I 관리도와 이동범위(MR) 관리도";
  }
  function plot(items: typeof points, title?: string) { return <div className="education-plot">{title && <h3>{title}</h3>}<ResponsiveContainer width="100%" height={300}><ComposedChart data={items} margin={{ top: 15, right: 25, bottom: 20, left: 5 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" interval="preserveStartEnd" tick={{ fontSize: 11 }}/><YAxis domain={chart === "pareto" ? [0, Math.max(1,items.reduce((sum,p)=>sum+p.value,0))] : bar ? [0, "auto"] : ["auto", "auto"]}/>{chart === "pareto" && <YAxis yAxisId="percent" orientation="right" domain={[0, 100]} unit="%"/>}<Tooltip/>{bar ? <Bar dataKey="value" name="값" fill="#416bc4"/> : <Line dataKey="value" name="값" stroke="#416bc4" dot={{ r: 3 }}/>}<Line dataKey="center" name="중심선" stroke="#259879" dot={false}/><Line dataKey="upper" name="UCL" stroke="#d65b4a" dot={false} strokeDasharray="5 4"/><Line dataKey="lower" name="LCL" stroke="#d65b4a" dot={false} strokeDasharray="5 4"/>{chart === "pareto" && <Line dataKey="cumulative" name="누적 비율" yAxisId="percent" stroke="#d79525"/>}<ReferenceLine y={0} stroke="#dce5f0"/></ComposedChart></ResponsiveContainer></div>; }
  return <section className="panel"><h2>{chartTypes[chart].label} · 입력 데이터 미리보기</h2><p>{summary}</p>{plot(points, secondary.length ? chart === "xbar" ? "X̄" : "I" : undefined)}{secondary.length > 0 && plot(secondary, chart === "xbar" ? "R" : "MR")}{chart === "grr" && <a href="/grr" className="secondary-button">Gage R&R 분석 열기</a>}</section>;
}
