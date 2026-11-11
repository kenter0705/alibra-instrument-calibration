const tools = [
  { name: "체크시트", type: "check" },
  { name: "파레토", type: "pareto" },
  { name: "히스토그램", type: "histogram" },
  { name: "특성요인도", type: "fishbone" },
  { name: "산점도", type: "scatter" },
  { name: "층별", type: "stratify" },
  { name: "관리도", type: "control" },
];

function Plot({ type }: { type: string }) {
  if (type === "check") return <svg viewBox="0 0 56 32" aria-hidden="true"><path d="M5 7h4l2 2 4-5M19 7h32M5 16h4l2 2 4-5M19 16h32M5 25h4l2 2 4-5M19 25h32" /></svg>;
  if (type === "pareto") return <svg viewBox="0 0 56 32" aria-hidden="true">
    {/* Descending frequency bars with a separate, rising cumulative-percent curve. */}
    <path d="M3 29V4M3 29h50M5 29V7h6v22M13 29V12h6v17M21 29V17h6v12M29 29V21h6v8M37 29V24h6v5M45 29V26h6v3" />
    <path className="qc-accent" d="M8 25 16 20 24 15 32 10 40 7 48 4" />
    <g className="qc-pareto-points"><circle cx="8" cy="25" r="1.2"/><circle cx="16" cy="20" r="1.2"/><circle cx="24" cy="15" r="1.2"/><circle cx="32" cy="10" r="1.2"/><circle cx="40" cy="7" r="1.2"/><circle cx="48" cy="4" r="1.2"/></g>
  </svg>;
  if (type === "histogram") return <svg viewBox="0 0 56 32" aria-hidden="true"><path d="M3 29V26h7v3M11 29V19h7v10M19 29V9h7v20M27 29V4h7v25M35 29V12h7v17M43 29V21h7v8M3 26c6-1 9-8 14-11s8-9 14-9 9 8 14 11 5 5 8 6"/><path className="qc-accent" d="M3 26c6-1 9-8 14-11s8-9 14-9 9 8 14 11 5 5 8 6"/></svg>;
  if (type === "fishbone") return <svg viewBox="0 0 56 32" aria-hidden="true"><path d="M3 16h48M12 16 6 7m15 9-6-9m15 9-6-9M12 16 6 25m15-9-6 9m15-9-6 9M51 16l-5-4m5 4-5 4"/></svg>;
  if (type === "scatter") return <svg viewBox="0 0 56 32" aria-hidden="true">
    {/* A scatter diagram plots paired observations as independent points; never join them. */}
    <path d="M4 3v26h49" />
    <path className="qc-accent qc-trendline" d="M9 25 49 7" />
    <g className="qc-scatter-points">
      <circle cx="11" cy="23" r="1.8"/><circle cx="16" cy="18" r="1.8"/><circle cx="20" cy="21" r="1.8"/>
      <circle cx="25" cy="13" r="1.8"/><circle cx="29" cy="17" r="1.8"/><circle cx="34" cy="10" r="1.8"/>
      <circle cx="39" cy="13" r="1.8"/><circle cx="43" cy="6" r="1.8"/><circle cx="48" cy="8" r="1.8"/>
    </g>
  </svg>;
  if (type === "stratify") return <svg viewBox="0 0 56 32" aria-hidden="true"><path d="M4 28h49M5 6l8 3 8-2 8 4 8-1 8 3 8-2M5 14l8-2 8 4 8-3 8 2 8-4 8 2M5 23l8-4 8 2 8-1 8 3 8-2 8 1"/><path className="qc-accent" d="M5 6l8 3 8-2 8 4 8-1 8 3 8-2"/></svg>;
  return <svg viewBox="0 0 56 32" aria-hidden="true"><path d="M3 5h50M3 27h50M3 16h50M4 18l7-4 6 3 7-7 7 9 7-6 7 2 7-8 7 9"/><path className="qc-accent" d="M3 5h50M3 27h50"/></svg>;
}

export default function QcToolsVisual() {
  return <div className="qc-tools-visual" aria-label="QC 7가지 도구 그래프 미리보기">
    {tools.map(tool => <div className="qc-tool-mini" key={tool.type}><Plot type={tool.type}/><span>{tool.name}</span></div>)}
  </div>;
}
