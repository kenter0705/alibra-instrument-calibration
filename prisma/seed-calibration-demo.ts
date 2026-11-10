import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const examples = [
  { code: "M-00123", date: "2026-06-12", result: "합격", certificate: "DEMO-CAL-2026-001", cost: 68000, note: "가상 예시 데이터 · 전압/저항 기준점 비교 기록" },
  { code: "M-00124", date: "2026-07-08", result: "합격", certificate: "DEMO-CAL-2026-002", cost: 42000, note: "가상 예시 데이터 · 마이크로미터 영점 및 범위 확인" },
  { code: "P-00321", date: "2026-08-19", result: "조정 후 합격", certificate: "DEMO-CAL-2026-003", cost: 95000, note: "가상 예시 데이터 · 압력 기준점 확인 후 조정" },
  { code: "C-00057", date: "2026-09-03", result: "합격", certificate: "DEMO-CAL-2026-004", cost: 38000, note: "가상 예시 데이터 · 캘리퍼스 외측 측정 범위 확인" },
  { code: "F-00044", date: "2026-10-14", result: "불합격", certificate: "DEMO-CAL-2026-005", cost: 72000, note: "가상 예시 데이터 · 사용중지 및 후속 조치 검토가 필요한 예시" },
] as const;

async function main() {
  const provider = await prisma.calibrationProvider.findFirst({ orderBy: { name: "asc" }, select: { id: true } });
  const pressureProcedure = await prisma.calibrationProcedure.findUnique({ where: { documentNumber: "SOP-PR-001" }, select: { id: true } });
  let created = 0;
  for (const example of examples) {
    const instrument = await prisma.instrument.findUnique({ where: { assetCode: example.code }, select: { id: true, calibrationIntervalMonths: true } });
    if (!instrument) continue;
    const performedAt = new Date(`${example.date}T09:00:00.000Z`);
    const nextDueDate = new Date(performedAt);
    nextDueDate.setUTCMonth(nextDueDate.getUTCMonth() + instrument.calibrationIntervalMonths);
    await prisma.calibrationRecord.upsert({
      where: { id: `DEMO-${example.certificate}` },
      update: {},
      create: {
        id: `DEMO-${example.certificate}`,
        instrumentId: instrument.id,
        providerId: provider?.id,
        procedureId: example.code === "P-00321" ? pressureProcedure?.id : undefined,
        performedAt,
        nextDueDate,
        result: example.result,
        certificateNumber: example.certificate,
        cost: example.cost,
        notes: example.note,
      },
    });
    created++;
  }
  console.log(`가상 검교정 이력 확인 완료: ${created}건 (실제 계측기·사용자 데이터 수정 없음)`);
}

main().finally(() => prisma.$disconnect());
