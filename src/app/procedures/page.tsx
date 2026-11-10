import { prisma } from "@/lib/prisma";
import ProcedureWorkspace from "@/components/procedure-workspace";

export const dynamic = "force-dynamic";

export default async function ProceduresPage() {
  const [procedures, targets] = await Promise.all([
    prisma.calibrationProcedure.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.calibrationTargetType.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
  ]);
  return <ProcedureWorkspace procedures={procedures} targets={targets} />;
}
