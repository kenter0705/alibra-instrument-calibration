import { notFound,redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic="force-dynamic";
export default async function InstrumentScanRedirect({params}:{params:Promise<{assetCode:string}>}){
  const {assetCode}=await params;
  const instrument=await prisma.instrument.findUnique({where:{assetCode:decodeURIComponent(assetCode)},select:{id:true}});
  if(!instrument)notFound();
  redirect(`/instruments/${instrument.id}`);
}
