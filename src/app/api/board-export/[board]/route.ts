import { educationUser } from "@/lib/education-auth";
import { isExportBoard, exportBoards } from "@/lib/board-export-definitions";
import { getBoardSummaries, getBoardExportRecords } from "@/lib/board-export-data";
import { postsExcel, postsPdf } from "@/lib/board-export-render";
import { sameOriginRequest } from "@/lib/request-origin";
import { APP_NAME } from "@/lib/app-edition";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{board:string}>};
async function convert(board:string,format:unknown,ids?:string[]) {
  if(!isExportBoard(board))return Response.json({error:"지원하지 않는 게시판입니다."},{status:404});
  if(format!=="xlsx"&&format!=="pdf")return Response.json({error:"Excel 또는 PDF를 선택하세요."},{status:400});
  try {
    const records=await getBoardExportRecords(board,ids);if(!records.length)throw new Error("내려받을 등록 게시글이 없습니다.");
    const title=exportBoards[board].title;const bytes=format==="xlsx"?await postsExcel(title,records):await postsPdf(title,records);
    const day=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    const filename=`${APP_NAME}_${title}_${records.length}건_${day}.${format}`;
    return new Response(Uint8Array.from(bytes),{headers:{"Content-Type":format==="xlsx"?"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":"application/pdf","Content-Disposition":`attachment; filename="CALIBRA-${board}.${format}"; filename*=UTF-8''${encodeURIComponent(filename)}`,"Cache-Control":"private, no-store","X-Export-Count":String(records.length)}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"게시글 변환에 실패했습니다."},{status:400});}
}
export async function GET(request:Request,context:Context){
  try{await educationUser()}catch{return Response.json({error:"로그인이 필요합니다."},{status:401})}
  const {board}=await context.params;if(!isExportBoard(board))return Response.json({error:"지원하지 않는 게시판입니다."},{status:404});
  const query=new URL(request.url).searchParams;
  if(query.has("format")){const id=query.get("id");if(!id)return Response.json({error:"게시글을 선택하세요."},{status:400});return convert(board,query.get("format"),[id])}
  try{return Response.json({title:exportBoards[board].title,records:await getBoardSummaries(board)},{headers:{"Cache-Control":"no-store"}})}catch{return Response.json({error:"게시판 목록을 읽지 못했습니다."},{status:500})}
}
export async function POST(request:Request,context:Context){
  try{await educationUser()}catch{return Response.json({error:"로그인이 필요합니다."},{status:401})}
  if(!sameOriginRequest(request))return Response.json({error:"현재 앱 화면에서 내려받으세요."},{status:403});
  const {board}=await context.params;const body=await request.json().catch(()=>null);
  if(!body)return Response.json({error:"내려받기 조건을 확인하세요."},{status:400});
  if(body.all===true)return convert(board,body.format);
  if(!Array.isArray(body.ids)||!body.ids.length||body.ids.length>10000||body.ids.some((id:unknown)=>typeof id!=="string"||id.length>200))return Response.json({error:"한 건 이상의 게시글을 선택하세요."},{status:400});
  return convert(board,body.format,[...new Set(body.ids)] as string[]);
}
