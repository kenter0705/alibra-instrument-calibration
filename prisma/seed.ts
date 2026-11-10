import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000);

async function main() {
  const rows = [
    ["M-00123", "디지털 멀티미터", "전기", "Fluke", "87V", "F87V-23041", "생산1팀", "전장팀", "김민준", 21, -344],
    ["M-00124", "마이크로미터", "치수", "Mitutoyo", "293-240", "MT-88319", "품질검사실", "품질팀", "박서연", 42, -323],
    ["C-00057", "캘리퍼스", "치수", "Mitutoyo", "CD-15AX", "CD-45190", "가공1라인", "생산팀", "이도윤", -4, -369],
    ["P-00321", "압력 게이지", "압력", "WIKA", "213.53", "WK-20911", "유틸리티실", "시설팀", "최하은", 58, -307],
    ["M-00456", "절연저항계", "전기", "Hioki", "IR4056", "HK-76018", "전기실", "시설팀", "정지호", 9, -356],
    ["T-00078", "열전대 온도계", "온도", "Testo", "925", "TS-63810", "시험실", "연구팀", "윤서준", 76, -289],
    ["W-00211", "전자 저울", "질량", "Ohaus", "Pioneer PX", "OH-20193", "품질검사실", "품질팀", "한지민", 112, -253],
    ["F-00044", "토크 렌치", "토크", "Tohnichi", "QL100N", "TN-77401", "조립라인", "생산팀", "강민서", 14, -351],
    ["D-00109", "다이얼 게이지", "치수", "Mitutoyo", "2046S", "DG-18930", "가공2라인", "생산팀", "오지훈", 28, -337],
    ["V-00032", "진동 측정기", "진동", "Fluke", "805 FC", "FL-49920", "설비보전실", "시설팀", "임수빈", 90, -275],
  ] as const;

  const unitByCategory:Record<string,string>={치수:"mm",전기:"V",압력:"MPa",온도:"°C",질량:"g",토크:"N·m",진동:"m/s²"};
  for (const [index, [assetCode, name, category, manufacturer, model, serialNumber, location, department, owner, due, last]] of rows.entries()) {
    const barcodeNumber = `CAL-2026-${String(index + 1).padStart(5, "0")}`;
    const measurementUnit=unitByCategory[category]??"단위 확인";
    await prisma.instrument.upsert({
      where: { assetCode },
      update: { barcodeNumber, qrPayload: `CALIBRA:${barcodeNumber}`, measurementUnit,measurementRange:"0–25",resolution:"0.01",accuracy:"±0.01" },
      create: { assetCode, barcodeNumber, qrPayload: `CALIBRA:${barcodeNumber}`, name, category, manufacturer, model, serialNumber, location, department, owner, measurementUnit,measurementRange:"0–25",resolution:"0.01",accuracy:"±0.01",lastCalibrated: daysFromNow(last), dueDate: daysFromNow(due), status: due < 0 ? "만료" : due <= 30 ? "임박" : "정상" },
    });
  }
  const providerRows = [
    ["KC26-461", "(주)네오준텍", "대전광역시", "2030-08-18"],
    ["KC26-460", "(주)링크텍", "경기도", "2030-08-18"],
    ["KC26-455", "(주)디에이텍", "인천광역시", "2030-04-14"],
  ] as const;
  for (const [accreditationNumber, name, address, expiry] of providerRows) {
    await prisma.calibrationProvider.upsert({
      where: { name }, update: { accreditationNumber, address, certificateExpiry: new Date(expiry), status: "공인 확인", scope: "KOLAS 인정범위 항목별 확인 필요", sourceUrl: "https://knab.go.kr/usr/inf/srh/InfoCrrcInsttSearchList.do", verifiedAt: new Date("2026-11-08") },
      create: { name, accreditationNumber, address, certificateExpiry: new Date(expiry), status: "공인 확인", scope: "KOLAS 인정범위 항목별 확인 필요", contactName: "공식 연락처 확인", phone: "공식 정보 확인", email: "", sourceUrl: "https://knab.go.kr/usr/inf/srh/InfoCrrcInsttSearchList.do", verifiedAt: new Date("2026-11-08") },
    });
  }
  const procedures = [
    { documentNumber: "SOP-PR-001", title: "압력계 자체 검교정 절차", instrumentCategory: "압력", calibrationRoute: "자체 검교정", targetInstruments: "아날로그 압력계, 기준 압력계, 압력 트랜스미터(범위·정확도 적용성 검토 후)", standardReference: "ISO 10012:2026 / ISO/IEC 17025:2017 참고", purpose: "사업장 압력 계측기의 측정 상태를 기준기와 비교하여 확인한다.", scope: "기준기 불확도가 대상기기 허용오차에 적합하고, 작업자 역량과 절차가 승인된 경우에 한한다.", equipment: "소급성이 확인된 기준 압력계 또는 압력 교정기, 핸드펌프, 연결 호스, 차단밸브, 누설 점검액", environment: "기기·기준기를 시험 환경에 충분히 안정화하고 주변 온도·습도·고도를 기록한다.", method: "영점 확인 후 0-25-50-75-100% 상승, 100-75-50-25-0% 하강 측정. 각 지점에서 안정화 후 기준기와 DUT 값을 함께 기록한다.", acceptanceCriteria: "오차와 히스테리시스를 계산하여 제조사 허용오차 또는 조직 승인 기준과 비교한다. 합격 기준을 임의로 설정하지 않는다.", uncertainty: "기준기 교정성적서, 분해능, 반복성, 분해능·환경 영향 등 예산 항목을 조직 방법으로 산정하고 결과에 사용한 확장불확도를 기록한다.", safety: "압력 한계·매체 적합성·호스 정격을 확인하고 보호안경을 착용한다. 압력 제거 후에만 연결을 분리한다.", steps: "1. 관리번호·범위·단위·상태를 확인한다.\n2. 기준기 유효기간과 소급성, 측정 범위·불확도 적합성을 확인한다.\n3. 연결 누설과 기준점 영점을 확인한다.\n4. 상승·하강 각 지점의 기준값과 지시값을 반복 기록한다.\n5. 오차, 반복성, 히스테리시스, 판정 및 불확도를 계산한다.\n6. 결과 라벨·다음 기한을 갱신하고 성적서와 원자료를 보존한다.", revision: "Rev.0", status: "검토 중" },
    { documentNumber: "SOP-PR-002", title: "차압식 리크 테스트 마스터 키 관리·검교정", instrumentCategory: "압력·누설", calibrationRoute: "자체 검교정", targetInstruments: "차압식 리크 테스트용 마스터 키(마스터 워크/기준 누설), 마스터 키를 판정 기준으로 사용하는 리크 테스터", standardReference: "ISO 10012:2026 / ISO/IEC 17025:2017 참고", purpose: "마스터 키와 리크 테스터 조합의 기준 누설 성능을 관리한다.", scope: "마스터 키 설계값·허용 누설량·압력·온도 안정성 자료를 확인한 뒤 승인된 시험 설비에서 수행한다.", equipment: "유효한 기준 누설 표준기 또는 추적 가능한 기준 시스템, 리크 테스터, 연결 치구, 온도계", environment: "누설량에 영향을 주는 온도, 압력, 안정화 시간 및 시험 매체를 기록한다.", method: "마스터 키 식별·밀봉 상태 확인 후 기준 누설 표준기와 지정 압력·시험 조건에서 반복 비교하고, 마스터 키와 테스터를 포함한 측정 체인의 결과를 분리 기록한다.", acceptanceCriteria: "마스터 키 성적서/제조사 허용값 또는 조직 승인 기준과 비교한다. 키 단독 교정인지 조립체 성능 확인인지 절차에서 구분한다.", uncertainty: "기준 누설 표준, 압력·온도, 반복성, 치구 누설, 안정화 및 계측기 분해능을 포함한다.", safety: "시험 압력과 매체의 안전자료를 확인하고 승인된 압력 범위 밖으로 운전하지 않는다. 기준 누설 경로를 막거나 임의 조정하지 않는다.", steps: "1. 마스터 키 ID·형상·설계값·적용 테스터 모델을 확인한다.\n2. 파손·오염·막힘·밀봉면 손상을 점검한다.\n3. 기준 누설 표준과 시험 환경을 확인하고 충분히 안정화한다.\n4. 동일한 압력·매체·치구·시간 조건으로 기준값과 시험값을 반복 취득한다.\n5. 편차와 반복성을 계산하고 승인 한계와 비교한다.\n6. 판정·원자료·사용 테스터·다음 확인일을 기록하고 식별표를 갱신한다.", revision: "Rev.0", status: "검토 중" },
    { documentNumber: "SOP-EL-001", title: "디지털 멀티미터 자체 점검 및 교정 확인", instrumentCategory: "전기", calibrationRoute: "자체 검교정", targetInstruments: "디지털 멀티미터(전압·저항 등 범위별 적용 검토)", standardReference: "ISO 10012:2026 / ISO/IEC 17025:2017 참고", purpose: "전기 계측기 상태를 소급성 있는 전기 기준기와 비교한다.", scope: "범위·CAT 등급·안전 요건을 확인한 교육 이수자에게만 적용한다.", equipment: "전기 교정기, 리드, 안전장비", environment: "기기 규격에 따른 안정화 조건을 적용하고 기록한다.", method: "선택된 범위와 포인트에서 기준 출력과 지시값을 반복 비교한다.", acceptanceCriteria: "해당 모델 사양과 조직 승인 기준에 따른다.", uncertainty: "교정기 사양·분해능·반복성·환경 영향을 포함한다.", safety: "측정 범주와 입력 한계 준수, 전류 단자 퓨즈·리드 상태를 확인한다.", steps: "기기 식별 → 안전 점검 → 기준기 확인 → 범위별 비교 → 계산/판정 → 기록·표시 갱신.", revision: "Rev.0", status: "검토 중" },
  ];
  for (const procedure of procedures) await prisma.calibrationProcedure.upsert({where:{documentNumber:procedure.documentNumber},update:{},create:procedure});
  const trainingSamples = [
    {courseCode:"TRN-2026-001",title:"측정기기 기본 사용 및 취급",subject:"측정 단위·범위 확인, 영점 및 반복 측정, 취급·보관, 이상 발생 시 사용중지와 보고",trainingReport:"가상 예시 보고서: 기본 조작 및 취급 항목 교육을 실시하고 참석자 실습 확인을 기록했습니다. 현장 작업표준과 대조 후 승인해 사용하세요.",audience:"생산·검사 측정자",instructor:"품질시스템 담당자",durationHours:2,trainingDate:new Date("2026-02-12"),validityMonths:12,materialPath:"교육자료 예시 TR-001"},
    {courseCode:"TRN-2026-002",title:"검교정 상태 확인 및 성적서 판독",subject:"관리번호·교정범위·결과·불확도·소급성·다음 예정일을 확인하고 부적합 결과를 보고하는 방법",trainingReport:"가상 예시 보고서: 성적서 판독 사례를 검토했습니다. 실제 공인 성적서와 조직 판정규칙을 사용해 재검증하세요.",audience:"계측기 담당자·품질보증",instructor:"교정 담당자",durationHours:3,trainingDate:new Date("2026-05-20"),validityMonths:12,materialPath:"교육자료 예시 TR-002"},
    {courseCode:"TRN-2026-003",title:"측정시스템 분석 및 반복성 점검",subject:"계량치·계수치 데이터 수집, 반복성·재현성, 판정 기준, 관리도와 결과 해석",trainingReport:"가상 예시 보고서: 모의 측정 데이터로 분석 절차를 연습했습니다. 고객 및 사내 승인 기준에 따른 실제 판정 검토가 필요합니다.",audience:"검사원·공정 품질 담당자",instructor:"MSA 책임자",durationHours:4,trainingDate:new Date("2026-10-16"),validityMonths:12,materialPath:"교육자료 예시 TR-003"},
  ];
  const attendees=[["김민준","생산팀","이수",92],["박서연","품질팀","이수",96],["이도윤","생산팀","이수",88],["정지호","시설팀","이수",94],["윤서준","연구팀","이수",90],["한지민","품질팀","미이수",68],["강민서","생산팀","이수",91],["오지훈","생산팀","참석",null],["임수빈","시설팀","이수",95]] as const;
  for(const [idx,course] of trainingSamples.entries()){
    const saved=await prisma.trainingCourse.upsert({where:{courseCode:course.courseCode},update:{},create:course});
    const count=await prisma.trainingRecord.count({where:{courseId:saved.id}});
    if(count===0)for(let n=0;n<3;n++){const [employeeName,department,result,score]=attendees[idx*3+n];const completedAt=course.trainingDate;const expiresAt=new Date(completedAt);expiresAt.setMonth(expiresAt.getMonth()+12);await prisma.trainingRecord.create({data:{courseId:saved.id,employeeName,department,result,score,completedAt,expiresAt,evidencePath:`출석·평가 예시 ${course.courseCode}`}});}
  }
  const targetRows = [
    ["PRESSURE-GAUGE","압력계","압력","압력 단위",true,"범위·정확도·기준기 적합성에 따라 자체/외부 절차 지정"],
    ["LEAK-MASTER-KEY","차압식 리크 테스트 마스터 키(기준 누설)","압력·누설","누설률/압력",false,"마스터 키/마스터 워크의 기준 누설 특성과 사용 리크 테스터 조합을 확인"],
    ["DIMENSION-MIC","마이크로미터","치수","mm",true,"측정범위와 등급에 맞는 게이지 블록 사용"],
    ["DIMENSION-CALIPER","캘리퍼스","치수","mm",true,"측정 범위와 내부·외부·깊이 기능별 기준 확인"],
    ["ELECTRICAL-DMM","디지털 멀티미터","전기","V/A/Ω",false,"전기 안전 등급과 범위별 기준기 적합성 검토"],
    ["TEMPERATURE-THERMOCOUPLE","열전대 온도계","온도","°C",true,"센서 형식·측정점·기준 온도계 확인"],
    ["PRESSURE-TRANSDUCER","압력 트랜스미터","압력","Pa/bar",false,"압력 범위·전기 출력·기준기 불확도 검토"],
    ["LEAK-TESTER","차압식 리크 테스터","압력·누설","압력/누설률",false,"마스터 키와 시험 조건·시간을 묶어 추적"],
    ["DIMENSION-DIAL","다이얼 게이지","치수","mm",true,"측정 범위, 반복성, 선형성 및 기준기 상태 확인"],
    ["DIMENSION-HEIGHT","하이트 게이지","치수","mm",false,"평탄도·수직도·기준면 상태 포함"],
    ["DIMENSION-BLOCK","게이지 블록","치수","mm",false,"등급·조합·표면 상태 및 상위 표준 추적성 확인"],
    ["MASS-SCALE","전자 저울","질량","g/kg",true,"교정 분동 등급, 반복성, 편심 및 측정 범위 확인"],
    ["MASS-WEIGHT","교정 분동","질량","g/kg",false,"분동 등급과 환경·취급 오염 관리"],
    ["TORQUE-WRENCH","토크 렌치","토크","N·m",true,"토크 기준기 범위, 작동 방향·속도 및 반복 횟수 확인"],
    ["FORCE-GAUGE","힘 측정기","힘","N/kN",false,"인장·압축 방향, 부하 속도, 고정 치구를 확인"],
    ["TEMPERATURE-THERMOMETER","온도계","온도","°C",true,"사용 온도범위, 안정화, 센서·기준 온도계 추적"],
    ["HUMIDITY-METER","습도계","상대습도","%RH",false,"습도 발생·기준 센서의 범위와 안정화 확인"],
    ["ELECTRICAL-MULTIMETER","디지털 멀티미터","전기","V/A/Ω",false,"안전 등급과 각 전기 범위에 맞는 기준기 검토"],
    ["ELECTRICAL-INSULATION","절연저항계","전기","V/MΩ",false,"정격 시험전압과 안전한 시험 환경·방전 확인"],
    ["TIME-STOPWATCH","스톱워치","시간·주파수","s",true,"시작/정지 반응 및 시간 기준 소급성 확인"],
    ["FREQUENCY-TACHOMETER","회전속도계","시간·주파수","rpm/Hz",false,"센서·반사 테이프·회전 조건 및 주파수 추적성"],
    ["FLOW-FLOWMETER","유량계","질량·유체유동","L/min, m³/h",false,"유체 종류, 유량 범위, 압력·온도 및 설치 조건 기록"],
    ["VACUUM-GAUGE","진공 게이지","압력·진공","Pa/mbar",false,"진공 범위·누설·기준 진공계의 측정능력 확인"],
    ["VIBRATION-METER","진동 측정기","기계·진동","m/s², mm/s",false,"센서 방향·부착·주파수·가속도 기준 확인"],
    ["SOUND-LEVEL","소음계","음향","dB",false,"마이크로폰·음향 교정기·주파수 가중 조건 확인"],
    ["PH-METER","pH 미터","화학","pH",false,"표준 완충용액, 온도 보정, 전극 상태와 유효기간 기록"],
    ["DATA-LOGGER","온습도 데이터로거","온습도","°C/%RH",false,"채널·센서별 범위와 기록 간격, 동기화 확인"],
  ] as const;
  for (const [code,name,category,measurementUnit,selfCalibrationEligible,guidance] of targetRows) await prisma.calibrationTargetType.upsert({where:{code},update:{},create:{code,name,category,measurementUnit,selfCalibrationEligible,calibrationRoute:"검토 필요",guidance}});
  const manuals = [
    ["M-00123","Fluke 87V 사용자 설명서","공식 제품 설명서","https://www.fluke.com/en-us/product/electrical-testing/digital-multimeters/fluke-87v"],
    ["M-00456","Hioki IR4056 사용 설명서","공식 사용 설명서","https://www.hioki.com/download/37461"],
    ["T-00078","Testo 925 Instruction Manual","공식 PDF 사용자 설명서","https://media.testo.com/media/e2/54/457f7497c00f/testo-925-Instruction-manual.pdf"],
    ["M-00124","Mitutoyo Series 293 디지매틱 마이크로미터","공식 제품/문서 안내","https://www.mitutoyo.com/products/small-tool-instruments-and-data-management/micrometers/digimatic-micrometers/digimatic-micrometer/"],
  ] as const;
  for (const [assetCode,title,documentType,filePath] of manuals) {
    const instrument=await prisma.instrument.findUnique({where:{assetCode}});if(!instrument)continue;
    const old=await prisma.instrumentDocument.findFirst({where:{instrumentId:instrument.id,title}});
    if(old)await prisma.instrumentDocument.update({where:{id:old.id},data:{filePath,fileName:title,documentType}});
    else await prisma.instrumentDocument.create({data:{instrumentId:instrument.id,title,documentType,fileName:title,filePath,uploadedBy:"공식 제조사 문서 링크",revision:"공식 원본",}});
  }
  const makeVariableStudy=(kind:"계량치",base:number,step:number)=>{
    const operators=["작업자 A","작업자 B","작업자 C"];const parts=Array.from({length:10},(_,i)=>`부품 ${String(i+1).padStart(2,"0")}`);const offsets=[-0.003,0.002,0.001];const repeats=3;
    const groups=parts.flatMap((part,pi)=>operators.map((operator,oi)=>({part,operator,values:[-0.001,0.001,0].map(noise=>Number((base+pi*step+offsets[oi]+noise).toFixed(4)))})));
    return {studyType:kind,operators,parts,repeats,groups,uncertaintySources:[{name:"기준기 교정성적서",standardUncertainty:0.001},{name:"계측기 분해능",standardUncertainty:0.0003},{name:"환경·반복 영향",standardUncertainty:0.0005}]};
  };
  const operators=["작업자 A","작업자 B","작업자 C"];const attributeParts=Array.from({length:10},(_,i)=>`시편 ${String(i+1).padStart(2,"0")}`);const attributeGroups=attributeParts.flatMap((part,pi)=>operators.map((operator,oi)=>{const good=pi%2===0;const disagreement=pi===3&&oi===2;return {part,operator,values:good?["합격","합격"]:disagreement?["불합격","합격"]:["불합격","불합격"]}}));
  const grrExamples=[
    {studyNumber:"GRR-2026-001",title:"마이크로미터 반복성·재현성",instrumentCode:"M-00124",studyType:"계량치",lowerSpec:9.5,upperSpec:11.5,data:makeVariableStudy("계량치",10,0.12)},
    {studyNumber:"GRR-2026-002",title:"압력 게이지 측정시스템 평가",instrumentCode:"P-00321",studyType:"계량치",lowerSpec:0,upperSpec:2,data:makeVariableStudy("계량치",0.2,0.18)},
    {studyNumber:"GRR-2026-003",title:"외관 판정자 일치도 평가",instrumentCode:"C-00057",studyType:"계수치",lowerSpec:null,upperSpec:null,data:{studyType:"계수치",operators,parts:attributeParts,repeats:2,groups:attributeGroups,uncertaintySources:[]}},
  ] as const;
  for(const example of grrExamples){const instrument=await prisma.instrument.findUnique({where:{assetCode:example.instrumentCode},select:{id:true,assetCode:true,name:true,measurementUnit:true,department:true}});const studyMeta={measurementUnit:instrument?.measurementUnit??"mm",measurementError:0.01,department:instrument?.department??"품질팀"};await prisma.gageRRStudy.upsert({where:{studyNumber:example.studyNumber},update:studyMeta,create:{studyNumber:example.studyNumber,title:example.title,studyType:example.studyType,instrumentId:instrument?.id,instrumentName:instrument?`${instrument.assetCode} · ${instrument.name}`:example.instrumentCode,...studyMeta,data:JSON.stringify(example.data),lowerSpec:example.lowerSpec,upperSpec:example.upperSpec}})}
  const processStudies=[
    {studyNumber:"SPC-2026-001",title:"정밀 치수 공정 안정성 예시",dataType:"계량치",chartType:"관리도",lowerSpec:9.5,upperSpec:10.5,targetValue:10,subgroupSize:1,measurements:"10.02\n10.01\n10.04\n9.99\n10.03\n10.00\n10.02\n9.98\n10.01\n10.03\n10.04\n10.01"},
    {studyNumber:"SPC-2026-002",title:"불량 유형 우선순위 예시",dataType:"계수치",chartType:"파레토도",lowerSpec:null,upperSpec:null,targetValue:null,subgroupSize:1,measurements:"치수,12\n스크래치,8\n기공,5\n오염,3"},
    {studyNumber:"SPC-2026-003",title:"공정 변수 상관관계 예시",dataType:"계량치",chartType:"산점도",lowerSpec:null,upperSpec:null,targetValue:null,subgroupSize:1,measurements:"1,2.1\n2,3.9\n3,6.0\n4,7.8\n5,10.2"},
  ];
  for(const [i,study] of processStudies.entries()){const metadata={productName:i===1?"완제품 외관":"자동차 브래킷",modelName:"BR-200",partNumber:`BRK-200${i+1}`,partName:i===1?"외관 불량":"고정 브래킷",processName:i===1?"최종 검사":"CNC 가공",department:i===1?"품질팀":"가공팀",author:"품질 담당자",equipmentName:i===1?"외관 검사대":"CNC-01",measurementRange:i===1?"해당 없음":"0–25",measurementUnit:i===1?"건":"mm",sampleCount:study.measurements.split("\n").length};await prisma.processStudy.upsert({where:{studyNumber:study.studyNumber},update:metadata,create:{...study,...metadata}})}
  const linkedStudy=await prisma.gageRRStudy.findUnique({where:{studyNumber:"GRR-2026-001"},select:{id:true}});const linkedInstrument=await prisma.instrument.findUnique({where:{assetCode:"M-00124"},select:{id:true}});
  const qualifications=[
    {qualificationNo:"SPQ-2026-001",processName:"정밀 축 가공",department:"가공팀",specialCharacteristic:"축 외경 치수",characteristicType:"치수",assessmentDate:new Date("2026-06-01"),validUntil:new Date("2027-06-01"),requirement:"고객 도면상 중요 치수. 실제 관리등급과 요구사항을 승인 도면에서 확인.",acceptanceCriteria:"예시: 도면 LSL/USL와 승인 판정규칙 적용. 실제 제품 요구사항으로 대체 후 승인.",method:"초도 및 주기 샘플 측정, 작업조별 층별 분석, 관리도 이탈 시 조치기록.",owner:"공정 품질 담당",status:"검토 중",grrStudyId:linkedStudy?.id,instrumentId:linkedInstrument?.id,evidence:"가상 공정승인 점검표",notes:"시연용 가상 기록"},
    {qualificationNo:"SPQ-2026-002",processName:"체결 공정",department:"조립팀",specialCharacteristic:"체결 토크",characteristicType:"토크",assessmentDate:new Date("2026-06-10"),validUntil:new Date("2027-06-10"),requirement:"고객·도면·제품 안전 요구사항을 기준으로 관리특성 여부 검토.",acceptanceCriteria:"승인 작업표준의 토크 범위와 측정기 교정상태에 따라 판정.",method:"작업 시작·교대 시 확인 및 정기 샘플링. 이상 시 영향 범위 추적.",owner:"조립 품질 담당",status:"검토 중",grrStudyId:null,instrumentId:null,evidence:"토크 확인표 예시",notes:"가상 예시"},
    {qualificationNo:"SPQ-2026-003",processName:"누설 검사 공정",department:"검사팀",specialCharacteristic:"차압식 리크 값",characteristicType:"압력·누설",assessmentDate:new Date("2026-07-01"),validUntil:new Date("2027-07-01"),requirement:"고객 규격의 허용 누설량 및 마스터 키 식별·유효 상태 관리.",acceptanceCriteria:"승인 기준 누설값과 마스터 키 성적서·장비 허용기준으로 판정.",method:"교대·제품 변경 시 마스터 키 점검, 결과·환경·장비ID 추적.",owner:"검사 파트장",status:"검토 중",grrStudyId:null,instrumentId:null,evidence:"마스터 키 점검 기록 예시",notes:"가상 예시"},
  ];
  for(const q of qualifications)await prisma.processQualification.upsert({where:{qualificationNo:q.qualificationNo},update:{},create:q});
  if(await prisma.gageRRPlan.count()===0){for(const [i,studyNo] of ["GRR-2026-001","GRR-2026-002","GRR-2026-003"].entries()){const study=await prisma.gageRRStudy.findUnique({where:{studyNumber:studyNo}});if(!study)continue;const inst=study.instrumentId?await prisma.instrument.findUnique({where:{id:study.instrumentId}}):null;const plannedDate=new Date(["2026-02-18","2026-06-12","2026-10-16"][i]);await prisma.gageRRPlan.create({data:{year:2026,plannedDate,department:study.department||inst?.department||"품질팀",instrumentId:inst?.id,instrumentName:inst?`${inst.assetCode} · ${inst.name}`:study.instrumentName,studyType:study.studyType,title:study.title,status:"완료",actualStudyId:study.id,note:"가상 연간 계획·실적 연결 예시"}})}}
  console.log("Seeded provider, procedure, calibration target, and verified manual references.");
  console.log(`Seeded ${rows.length} sample instruments.`);
}

main().finally(() => prisma.$disconnect());

