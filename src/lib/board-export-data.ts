import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { listDatasets, readDataset } from "@/lib/education-store";
import { exportBoards, fieldLabels, type ExportBoard, type ExportRecord, type ExportSummary } from "@/lib/board-export-definitions";

const secretField = /password|secret|token|credential|googleSubject|cookie/i;
const titleFields = ["title", "name", "itemName", "qualificationNo", "studyNumber", "documentNumber", "assetCode", "transactionNo", "disposalNumber", "employeeName", "code", "department"];
const timeFields = ["updatedAt", "createdAt", "uploadedAt", "assessedAt", "performedAt", "issuedAt"];
const modelInfo = (board: ExportBoard) => Prisma.dmmf.datamodel.models.find(model => model.name === exportBoards[board].model);
function selection(board: ExportBoard, summary: boolean) {
  const model = modelInfo(board); if (!model) throw new Error("지원하지 않는 게시판입니다.");
  const keys = model.fields.filter(field => field.kind !== "object" && !secretField.test(field.name) && (!summary || ["id", ...titleFields, ...timeFields].includes(field.name))).map(field => field.name);
  const select: Record<string, unknown> = Object.fromEntries(keys.map(key => [key, true]));
  if (!summary) {
    if (model.fields.some(field => field.name === "instrument")) select.instrument = { select: { assetCode: true, name: true, department: true } };
    if (model.name === "CalibrationRecord") { select.provider = { select: { name: true, accreditationNumber: true } }; select.procedure = { select: { documentNumber: true, title: true } }; }
    if (model.name === "TrainingRecord") select.course = { select: { courseCode: true, title: true, trainingDate: true, instructor: true } };
    if (model.name === "ApprovalDocument") { select.steps = true; select.history = true; }
    if (model.name === "CapabilityProject") { select.subgroups = true; select.measurements = true; select.agreements = true; select.attributeQuality = true; select.results = true; }
    if (model.name === "CorrelationStudy") { select.points = true; select.project = { select: { projectNo: true, name: true } }; }
  }
  return { model, select };
}
function metadata(record: Record<string, any>): ExportSummary {
  const title = titleFields.map(field => record[field]).find(value => typeof value === "string" && value.trim()) || `등록 자료 ${record.id}`;
  const date = timeFields.map(field => record[field]).find(value => value instanceof Date || typeof value === "string");
  return { id: String(record.id), title: String(title), writtenAt: date instanceof Date ? date.toISOString() : date || "" };
}
export async function getBoardSummaries(board: ExportBoard): Promise<ExportSummary[]> {
  if (board === "shared-data") return (await listDatasets()).map(record => ({ id: record.id, title: record.title, writtenAt: record.createdAt }));
  const { model, select } = selection(board, true);
  const delegate = (prisma as any)[model.name[0].toLowerCase() + model.name.slice(1)];
  const date = timeFields.find(field => model.fields.some(item => item.name === field));
  const records = await delegate.findMany({ select, where: model.fields.some(field => field.name === "deletedAt") ? { deletedAt: null } : {}, orderBy: { [date || "id"]: "desc" } });
  return records.map(metadata);
}
export async function getBoardExportRecords(board: ExportBoard, ids?: string[]): Promise<ExportRecord[]> {
  let records: Record<string, any>[];
  if (board === "shared-data") {
    const available = await listDatasets(); const wanted = ids ? available.filter(record => ids.includes(record.id)) : available;
    records = await Promise.all(wanted.map(record => readDataset(record.id)));
  } else {
    const { model, select } = selection(board, false);
    const where: Record<string, unknown> = ids ? { id: { in: ids } } : {};
    if (model.fields.some(field => field.name === "deletedAt")) where.deletedAt = null;
    const date = timeFields.find(field => model.fields.some(item => item.name === field));
    records = await (prisma as any)[model.name[0].toLowerCase() + model.name.slice(1)].findMany({ select, where, orderBy: { [date || "id"]: "desc" } });
  }
  if (ids && records.length !== new Set(ids).size) throw new Error("선택한 게시글 중 찾을 수 없는 자료가 있습니다. 목록을 새로고침하세요.");
  return records.map(record => ({ ...metadata(record), fields: Object.entries(record).filter(([key]) => !secretField.test(key)).map(([key, value]) => ({ key, label: fieldLabels[key] || key, value })) }));
}
