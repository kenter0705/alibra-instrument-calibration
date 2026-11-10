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
  if (type === "pareto") return <svg viewBox="0 0 56 32" aria-hidden="true"><path d="M3 29V5h6v24M12 29V10h6v19M21 29V15h6v14M30 29V19h6v10M39 29V23h6v6M4 10 15 13 24 17 33 21 43 25 53 27"/><path className="qc-accent" d="M4 10 15 13 24 17 33 21 43 25 53 27"/></svg>;
  if (type === "histogram") return <svg viewBox="0 0 56 32" aria-hidden="true"><path d="M3 29V26h7v3M11 29V19h7v10M19 29V9h7v20M27 29V4h7v25M35 29V12h7v17M43 29V21h7v8M3 26c6-1 9-8 14-11s8-9 14-9 9 8 14 11 5 5 8 6"/><path className="qc-accent" d="M3 26c6-1 9-8 14-11s8-9 14-9 9 8 14 11 5 5 8 6"/></svg>;
  if (type === "fishbone") return <svg viewBox="0 0 56 32" aria-hidden="true"><path d="M3 16h48M12 16 6 7m15 9-6-9m15 9-6-9M12 16 6 25m15-9-6 9m15-9-6 9M51 16l-5-4m5 4-5 4"/></svg>;
  if (type === "scatter") return <svg viewBox="0 0 56 32" aria-hidden="true"><path d="M4 3v26h49M10 24l4-5 5 2 5-8 5 4 6-9 4 5 7-7"/><circle cx="14" cy="19" r="1.5"/><circle cx="19" cy="21" r="1.5"/><circle cx="24" cy="13" r="1.5"/><circle cx="29" cy="17" r="1.5"/><circle cx="35" cy="8" r="1.5"/><circle cx="39" cy="12" r="1.5"/><circle cx="46" cy="6" r="1.5"/></svg>;
  if (type === "stratify") return <svg viewBox="0 0 56 32" aria-hidden="true"><path d="M4 28h49M5 6l8 3 8-2 8 4 8-1 8 3 8-2M5 14l8-2 8 4 8-3 8 2 8-4 8 2M5 23l8-4 8 2 8-1 8 3 8-2 8 1"/><path className="qc-accent" d="M5 6l8 3 8-2 8 4 8-1 8 3 8-2"/></svg>;
  return <svg viewBox="0 0 56 32" aria-hidden="true"><path d="M3 5h50M3 27h50M3 16h50M4 18l7-4 6 3 7-7 7 9 7-6 7 2 7-8 7 9"/><path className="qc-accent" d="M3 5h50M3 27h50"/></svg>;
}

export default function QcToolsVisual() {
  return <div className="qc-tools-visual" aria-label="QC 7가지 도구 그래프 미리보기">
    {tools.map(tool => <div className="qc-tool-mini" key={tool.type}><Plot type={tool.type}/><span>{tool.name}</span></div>)}
  </div>;
}
