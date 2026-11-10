import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenCheck, ExternalLink, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import BoardPopupActions from "@/components/board-popup-actions";

export const dynamic="force-dynamic";
export default async function TrainingMaterialDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params,material=await prisma.trainingMaterial.findUnique({where:{id}});if(!material)notFound();
  return <main className="record-page material-detail-page"><header className="record-top"><BoardPopupActions listHref="/training/materials" listLabel="교재 목록"/><a className="secondary-button" href={material.filePath} target="_blank" rel="noreferrer"><ExternalLink size={14}/> 자료 열기</a></header><article className="record-content panel material-detail-document"><span className="eyebrow">TRAINING MATERIAL · {material.materialNo}</span><h1>{material.title}</h1><p className="material-detail-lead">{material.description||"등록 교육 교재"}</p><div className="material-detail-meta"><span>자료 유형 <b>{material.fileType}</b></span><span>등록일 <b>{new Intl.DateTimeFormat("ko-KR").format(material.uploadedAt)}</b></span><span>파일 <b>{material.fileName}</b></span></div>
    <section><h2><BookOpenCheck size={18}/> 교육 목적</h2><p>{material.educationPurpose||"교육 목적이 아직 작성되지 않았습니다."}</p></section>
    <section><h2><FileText size={18}/> 교육 내용</h2><p className="material-preserve-lines">{material.learningContent||"교육 내용이 아직 작성되지 않았습니다."}</p></section>
    <section><h2>내용 요약</h2><p>{material.contentSummary||"요약이 아직 작성되지 않았습니다."}</p></section>
    {material.fileType==="YOUTUBE"&&material.videoUrl?<section><h2>영상 재생</h2><div className="material-video"><iframe src={material.videoUrl} title={material.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div><p className="page-note">영상 재생은 인터넷 연결과 게시자의 퍼가기 허용 여부에 따릅니다.</p></section>:<section className="material-file-open"><h2>교육 자료</h2><p>원본 자료를 별도 창에서 열거나 내려받습니다.</p><a className="primary-button" href={material.filePath} target="_blank" rel="noreferrer"><ExternalLink size={14}/> {material.fileType==="GUIDE"?"사용 안내서 열기":"PDF·PPT 자료 열기 / 다운로드"}</a></section>}
    <p className="page-note">교육용 자료입니다. 실제 작업에는 제조사 설명서, 고객 요구사항 및 조직의 승인된 절차를 적용하세요.</p></article></main>;
}

