import { notFound } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updateTrainingMaterial } from "@/app/actions";
import BoardPopupActions from "@/components/board-popup-actions";
import PopupSaveClose from "@/components/popup-save-close";

export const dynamic = "force-dynamic";

export default async function EditTrainingMaterial({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const material = await prisma.trainingMaterial.findUnique({ where: { id } });
  if (!material) notFound();
  const save = updateTrainingMaterial.bind(null);
  return <main className="record-page material-editor-page">
    <header className="record-top"><BoardPopupActions listHref="/training/materials" listLabel="교재 목록"/></header>
    <section className="record-content material-editor-content">
      <div className="page-heading"><div><span className="eyebrow">TRAINING MATERIAL · EDIT</span><h1>교육 교재 수정</h1><p>{material.materialNo} · 목록과 분리된 작성 화면입니다.</p></div></div>
      {saved && <PopupSaveClose listHref="/training/materials" message="교재가 저장되었습니다."/>}
      {!saved && <section className="panel material-editor-panel">
        <div className="material-editor-heading"><div><UploadCloud size={20}/><div><h2>교재 내용</h2><p>필요한 항목을 수정하고 저장하세요.</p></div></div><span className="material-editor-number">{material.materialNo}</span></div>
        <form action={save} className="material-editor-form">
          <input type="hidden" name="id" value={material.id}/><input type="hidden" name="popupEdit" value="1"/>
          <label>교재명<input name="title" defaultValue={material.title} required/></label>
          <label>간단 설명<input name="description" defaultValue={material.description}/></label>
          <label>교육 목적<textarea name="educationPurpose" rows={5} defaultValue={material.educationPurpose}/></label>
          <label>교육 내용<textarea name="learningContent" rows={10} defaultValue={material.learningContent}/></label>
          <label>내용 요약<textarea name="contentSummary" rows={6} defaultValue={material.contentSummary}/></label>
          {material.fileType === "YOUTUBE" && <label>YouTube URL<input name="videoUrl" type="url" defaultValue={material.filePath}/></label>}
          <div className="material-editor-actions"><button className="primary-button"><UploadCloud size={15}/> 수정 저장</button><p>저장이 완료되면 이 창이 닫히고, 목록 화면이 갱신됩니다.</p></div>
        </form>
      </section>}
    </section>
  </main>;
}
