export const chartTypes = {
  histogram: { label: "히스토그램", type: "계량치", columns: ["측정값"], min: 2 },
  capability: { label: "공정능력·분포", type: "계량치", columns: ["측정값"], min: 2 },
  imr: { label: "I-MR 관리도", type: "계량치", columns: ["순서", "측정값"], min: 2 },
  xbar: { label: "X̄-R 관리도 · 부분군 5개", type: "계량치", columns: ["부분군", "측정1", "측정2", "측정3", "측정4", "측정5"], min: 2 },
  scatter: { label: "산점도·상관", type: "계량치", columns: ["X", "Y"], min: 2 },
  stratification: { label: "층별", type: "계량치", columns: ["그룹", "측정값"], min: 2 },
  p: { label: "p 관리도 · 불량률", type: "계수치", columns: ["검사수량", "불량품수"], min: 2 },
  np: { label: "np 관리도 · 불량품수", type: "계수치", columns: ["검사수량", "불량품수"], min: 2 },
  c: { label: "c 관리도 · 결점수", type: "계수치", columns: ["결점수"], min: 2 },
  u: { label: "u 관리도 · 단위당 결점수", type: "계수치", columns: ["검사단위수", "결점수"], min: 2 },
  pareto: { label: "파레토도", type: "계수치", columns: ["불량유형", "건수"], min: 1 },
  checksheet: { label: "체크시트", type: "계수치", columns: ["불량유형", "건수"], min: 1 },
  fishbone: { label: "특성요인도", type: "원인 분류", columns: ["원인분류", "원인"], min: 1 },
  grr: { label: "Gage R&R 반복 측정", type: "계량치", columns: ["부품", "측정자", "반복", "측정값"], min: 8 },
} as const;
export type ChartType = keyof typeof chartTypes;
export type DataContent = { chart: ChartType; columns: string[]; rows: string[][]; lowerSpec?: number; upperSpec?: number; unit?: string };
export type SharedDataset = DataContent & { id: string; title: string; kind: "original" | "copy"; parentId?: string; createdAt: string; author: string; authorId: string; originalFile?: string };
export type DatasetSummary = Omit<SharedDataset, "rows"> & { rowCount: number };
export function validateData(input: DataContent) {
  const definition = chartTypes[input.chart];
  if (!definition) throw new Error("대상 그래프를 선택하세요.");
  if (!Array.isArray(input.columns) || input.columns.join("|") !== definition.columns.join("|")) throw new Error(`필요한 열: ${definition.columns.join(", ")}. 해당 그래프 양식을 사용하세요.`);
  if (!Array.isArray(input.rows) || input.rows.length < definition.min || input.rows.length > 5000) throw new Error(`${definition.min}~5000행의 데이터를 입력하세요.`);
  input.rows.forEach((row, index) => {
    if (!Array.isArray(row) || row.length !== definition.columns.length) throw new Error(`${index + 1}행의 열 수가 맞지 않습니다.`);
    row.forEach((cell, column) => {
      const title = definition.columns[column];
      if (typeof cell !== "string" || !cell.trim() || cell.length > 500) throw new Error(`${index + 1}행 ${title} 값을 확인하세요.`);
      if (["그룹", "불량유형", "원인분류", "원인", "부품", "측정자"].includes(title)) return;
      const number = Number(cell);
      if (!Number.isFinite(number)) throw new Error(`${index + 1}행 ${title}은 숫자여야 합니다.`);
      if (["순서", "부분군", "반복", "검사수량", "불량품수", "결점수", "건수"].includes(title) && (!Number.isInteger(number) || number < 0)) throw new Error(`${index + 1}행 ${title}은 0 이상의 정수여야 합니다.`);
      if (["검사수량", "검사단위수", "순서", "부분군", "반복"].includes(title) && number <= 0) throw new Error(`${index + 1}행 ${title}은 0보다 커야 합니다.`);
    });
    if (["p", "np"].includes(input.chart) && Number(row[1]) > Number(row[0])) throw new Error(`${index + 1}행의 불량품수는 검사수량을 넘을 수 없습니다.`);
    if (input.chart === "np" && Number(row[0]) !== Number(input.rows[0][0])) throw new Error("np 관리도는 검사수량이 일정해야 합니다. 수량이 다르면 p 관리도를 선택하세요.");
  });
  if (input.chart === "capability" && (!Number.isFinite(input.lowerSpec) || !Number.isFinite(input.upperSpec) || input.lowerSpec! >= input.upperSpec!)) throw new Error("규격 하한보다 큰 규격 상한을 입력하세요.");
  if (input.chart === "grr") {
    const groups = new Set<string>();
    for (const row of input.rows) { const key = JSON.stringify(row.slice(0, 3)); if (groups.has(key)) throw new Error("부품·측정자·반복 조합이 중복되었습니다."); groups.add(key); }
    const parts = new Set(input.rows.map(row => row[0])), operators = new Set(input.rows.map(row => row[1])), trials = new Set(input.rows.map(row => row[2]));
    if (parts.size < 2 || operators.size < 2 || trials.size < 2 || parts.size * operators.size * trials.size !== input.rows.length) throw new Error("Gage R&R은 부품 2개 이상·측정자 2명 이상·반복 2회 이상의 모든 조합을 입력하세요.");
  }
}
export function exampleData(chart: ChartType): DataContent {
  const rows = chart === "fishbone" ? [["사람", "작업 방법 숙련도"], ["설비", "공구 마모"], ["방법", "조건 편차"], ["재료", "로트 차이"], ["측정", "측정기 반복성"], ["환경", "온도 변화"]] : chart === "grr" ? Array.from({ length: 60 }, (_, i) => [String(Math.floor(i / 6) + 1), ["A", "B", "C"][Math.floor(i / 2) % 3], String(i % 2 + 1), (10 + Math.floor(i / 6) * .03 + Math.sin(i) * .005).toFixed(3)]) : Array.from({ length: 25 }, (_, i) => {
    const value = (10 + Math.sin(i * 1.71) * .04 + Math.cos(i * .63) * .02).toFixed(3);
    if (chart === "histogram" || chart === "capability") return [value];
    if (chart === "imr") return [String(i + 1), value];
    if (chart === "xbar") return [String(i + 1), ...Array.from({ length: 5 }, (_, j) => (10 + Math.sin(i * 2 + j) * .05).toFixed(3))];
    if (chart === "scatter") return [String(i + 1), (2 * (i + 1) + Math.sin(i)).toFixed(2)];
    if (chart === "stratification") return [["주간", "야간"][i % 2], value];
    if (chart === "p" || chart === "np") return [String(chart === "p" ? 80 + i % 5 * 10 : 100), String(2 + i % 7)];
    if (chart === "c") return [String(2 + i % 9)];
    if (chart === "u") return [String(2 + i % 3), String(2 + i % 7)];
    return [["치수", "스크래치", "기공", "오염", "기타"][i % 5], String(1 + i % 7)];
  });
  return { chart, columns: [...chartTypes[chart].columns], rows, lowerSpec: 9.8, upperSpec: 10.2, unit: "mm" };
}
