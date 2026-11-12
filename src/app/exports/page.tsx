import Link from "next/link";
import BoardExportManager from "@/components/board-export-manager";
import { isExportBoard } from "@/lib/board-export-definitions";
export default async function ExportPage({searchParams}:{searchParams:Promise<{board?:string;id?:string}>}){
  const query=await searchParams;return <main className="record-page"><header className="record-top"><Link href="/" className="back-link">← 홈으로</Link></header><section className="record-content"><div className="page-heading"><div><span className="eyebrow">POST DOCUMENT DOWNLOAD</span><h1>게시글 Excel·PDF 내려받기</h1><p>등록된 게시글 내용을 문서로 변환합니다. 한 건·선택한 글·게시판 전체를 내려받을 수 있습니다.</p></div></div><BoardExportManager initialBoard={query.board&&isExportBoard(query.board)?query.board:"training-materials"} initialId={query.id}/></section></main>;
}
