import { chartTypes, type ChartType } from "@/lib/education-data";

export const sampleData = Object.fromEntries((Object.keys(chartTypes) as ChartType[]).map((chart, index) => {
  const title = `${String(index + 1).padStart(2, "0")}_${chartTypes[chart].label.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").replace(/\s+/g, "_")}_원본`;
  return [chart, { id: `f0000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`, title, filename: title + ".json" }];
})) as Record<ChartType, { id: string; title: string; filename: string }>;

export const SAMPLE_FOLDER_ZIP = "/example-data/CALIBRA-Sample-Data.zip";
