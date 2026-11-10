import ExcelJS from "exceljs";

export const runtime="nodejs";
export async function GET(){
  const wb=new ExcelJS.Workbook();const ws=wb.addWorksheet("계측기 목록");
  ws.columns=[{header:"관리번호",key:"assetCode",width:18},{header:"계측기명",key:"name",width:24},{header:"분류",key:"category",width:16},{header:"제조사",key:"manufacturer",width:18},{header:"모델",key:"model",width:18},{header:"제조번호",key:"serialNumber",width:20},{header:"측정 단위",key:"measurementUnit",width:14},{header:"분해능",key:"resolution",width:16},{header:"보관 위치",key:"location",width:20},{header:"담당 부서",key:"department",width:18},{header:"담당자",key:"owner",width:14},{header:"최근 검교정일",key:"lastCalibrated",width:18},{header:"다음 검교정일",key:"dueDate",width:18}];
  ws.getRow(1).font={bold:true,color:{argb:"FFFFFFFF"}};ws.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF173E67"}};
  ws.addRow({assetCode:"M-01001",name:"예시 계측기",category:"치수",manufacturer:"예시 제조사",model:"MODEL-1",serialNumber:"SN-0001",measurementUnit:"mm",resolution:"0.01 mm",location:"품질검사실",department:"품질팀",owner:"담당자",lastCalibrated:"2026-01-01",dueDate:"2027-01-01"});
  const bytes=await wb.xlsx.writeBuffer();return new Response(bytes,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":"attachment; filename=instrument-import-template.xlsx"}});
}
