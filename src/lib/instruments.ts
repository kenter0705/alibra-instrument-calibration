import { prisma } from "@/lib/prisma";

export async function getDashboardData(monthCount = 6) {
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 86_400_000);
  const [instruments, total, overdue, dueSoon, recent, calibrationRecords] = await Promise.all([
    prisma.instrument.findMany({ orderBy: { dueDate: "asc" } }),
    prisma.instrument.count(),
    prisma.instrument.count({ where: { dueDate: { lt: now } } }),
    prisma.instrument.count({ where: { dueDate: { gte: now, lte: soon } } }),
    prisma.instrument.findMany({ orderBy: { updatedAt: "desc" }, take: 6 }),
    prisma.calibrationRecord.findMany({ select: { performedAt: true } }),
  ]);
  const months = [3, 6, 9, 12].includes(monthCount) ? monthCount : 6;
  const monthlyPlanVsActual = Array.from({length:months},(_,index)=>{
    const offset=months-1-index;const monthStart=new Date(now.getFullYear(),now.getMonth()-offset,1);const monthEnd=new Date(now.getFullYear(),now.getMonth()-offset+1,1);
    return {label:`${monthStart.getMonth()+1}월`,planned:instruments.filter(item=>item.dueDate>=monthStart&&item.dueDate<monthEnd).length,actual:calibrationRecords.filter(record=>record.performedAt>=monthStart&&record.performedAt<monthEnd).length};
  });
  return { instruments, total, overdue, dueSoon, normal: Math.max(0, total - overdue - dueSoon), recent, monthlyPlanVsActual };
}
