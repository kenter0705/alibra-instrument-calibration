export const exportBoards = {
  instruments: { title: "계측기 관리대장", model: "Instrument", path: "/instruments" },
  calibrations: { title: "검교정 이력", model: "CalibrationRecord", path: "/calibrations" },
  purchases: { title: "구매 관리", model: "PurchaseRequest", path: "/purchases" },
  issues: { title: "불출·반납", model: "IssueTransaction", path: "/issues" },
  disposals: { title: "분실·폐기", model: "DisposalRecord", path: "/disposals" },
  approvals: { title: "전자결재", model: "ApprovalDocument", path: "/approvals" },
  budgets: { title: "연간 예산", model: "AnnualBudget", path: "/costs" },
  providers: { title: "검교정 기관", model: "CalibrationProvider", path: "/providers" },
  procedures: { title: "절차서", model: "CalibrationProcedure", path: "/procedures" },
  spc: { title: "SPC 분석 이력", model: "ProcessStudy", path: "/quality" },
  capability: { title: "공정능력 분석", model: "CapabilityProject", path: "/quality" },
  correlation: { title: "상관·회귀 분석", model: "CorrelationStudy", path: "/quality" },
  grr: { title: "Gage R&R 분석", model: "GageRRStudy", path: "/grr" },
  "grr-plans": { title: "Gage R&R 계획", model: "GageRRPlan", path: "/grr" },
  qualifications: { title: "특별특성 공정 자격인정", model: "ProcessQualification", path: "/special-process" },
  assessments: { title: "측정자 평가", model: "OperatorAssessment", path: "/training" },
  "training-courses": { title: "교육 과정", model: "TrainingCourse", path: "/training" },
  "training-records": { title: "교육 이수 이력", model: "TrainingRecord", path: "/training" },
  "training-materials": { title: "교육 교재 게시판", model: "TrainingMaterial", path: "/training/materials" },
  manuals: { title: "계측기 문서·매뉴얼", model: "InstrumentDocument", path: "/instruments" },
  locations: { title: "보관 장소", model: "StorageLocation", path: "/instruments/departments" },
  "calibration-types": { title: "검교정 대상 분류", model: "CalibrationTargetType", path: "/settings" },
  posts: { title: "등록 게시글", model: "BoardEntry", path: "/" },
  "shared-data": { title: "공동 데이터실", model: "SharedDataset", path: "/shared-data" },
} as const;
export type ExportBoard = keyof typeof exportBoards;
export type ExportField = { key: string; label: string; value: unknown };
export type ExportRecord = { id: string; title: string; writtenAt: string; fields: ExportField[] };
export type ExportSummary = Omit<ExportRecord, "fields">;
export function isExportBoard(value: string): value is ExportBoard { return Object.prototype.hasOwnProperty.call(exportBoards, value); }

export const fieldLabels: Record<string, string> = {
  id: "자료 번호", title: "제목", name: "명칭", createdAt: "등록 시각", updatedAt: "수정 시각", createdBy: "작성자", author: "작성자", authorId: "작성자 번호", owner: "담당자", department: "부서", status: "상태", note: "비고", notes: "비고", description: "설명", content: "본문", contentHtml: "본문", payload: "작성 상세", boardKey: "게시판 구분",
  assetCode: "관리번호", barcodeNumber: "바코드 번호", qrPayload: "QR 내용", category: "분류", manufacturer: "제조사", model: "모델", serialNumber: "제조번호", location: "위치", purchaseSource: "구매처", purchaseDate: "구매일", purchaseCost: "구매 비용", usagePurpose: "사용 목적", measurementRange: "측정 범위", measurementUnit: "측정 단위", resolution: "분해능", accuracy: "정확도", specification: "사양", calibrationIntervalMonths: "검교정 주기(개월)", storageCondition: "보관 조건", maintenanceDate: "점검일", lastCalibrated: "최근 검교정일", dueDate: "차기 검교정일", preferredCalibrationProviderId: "권장 검교정 기관 번호",
  documentNumber: "문서번호", documentNo: "문서번호", documentType: "문서 유형", instrumentCategory: "대상 분류", calibrationRoute: "검교정 구분", targetInstruments: "적용 대상", standardReference: "참조 표준", purpose: "목적", scope: "범위", equipment: "설비", environment: "환경", method: "방법", acceptanceCriteria: "합격 기준", uncertainty: "불확도", safety: "안전", steps: "절차·결재 단계", revision: "개정", effectiveDate: "시행일", history: "처리 이력",
  accreditationNumber: "인정 번호", contactName: "담당자", phone: "연락처", email: "이메일", address: "주소", certificateExpiry: "인정 유효기간", sourceUrl: "참조 주소", verifiedAt: "확인일",
  requestNumber: "구매 요청번호", itemName: "구매 품목", quantity: "수량", requestedBy: "요청자", requester: "기안자", reason: "사유", estimatedCost: "예상 비용", approvedCost: "승인 비용", actualCost: "실제 비용", requestedAt: "요청일", receivedAt: "입고일", submittedAt: "상신일", completedAt: "완료일", resubmission: "재상신 횟수",
  instrumentId: "계측기 번호", instrument: "대상 계측기", providerId: "기관 번호", provider: "검교정 기관", procedureId: "절차서 번호", procedure: "적용 절차서", performedAt: "검교정일", nextDueDate: "차기 예정일", result: "결과", certificateNumber: "성적서 번호", certificatePath: "증빙 주소", certificateFileName: "증빙 파일명", cost: "비용",
  transactionNo: "불출 번호", issuedTo: "사용자", issuedBy: "불출 담당자", issuedAt: "불출일", dueBackAt: "반납 예정일", returnDepartment: "반납 부서", returnResponsible: "반납 담당자", returnedAt: "반납일", locationOut: "사용 위치", conditionOut: "불출 상태", conditionIn: "반납 상태",
  disposalNumber: "폐기 번호", disposedAt: "폐기일", approvedBy: "승인자", bookValue: "장부가", salvageValue: "잔존가", disposalCost: "폐기 비용", year: "연도", amount: "금액",
  code: "코드", locationType: "장소 구분", parent: "상위 구분", custodian: "관리자", conditions: "보관 조건", active: "사용 여부", defaultIntervalMonths: "기본 주기(개월)", selfCalibrationEligible: "자체 검교정 가능", guidance: "안내",
  studyNumber: "분석 번호", companyName: "회사", productName: "제품", modelName: "모델", partNumber: "부품 번호", partName: "부품명", processName: "공정", writtenAt: "작성일", measurementDate: "측정일", equipmentName: "설비명", sampleCount: "시료 수", dataType: "데이터 구분", chartType: "관리도 종류", lowerSpec: "규격 하한", upperSpec: "규격 상한", targetValue: "목표값", subgroupSize: "부분군 크기", measurements: "측정 데이터", studyType: "분석 유형", measurementError: "측정 오차", studyDate: "분석일", criteriaRRPercent: "GRR 판정 기준(%)", criteriaPTPercent: "P/T 판정 기준(%)", criteriaNdc: "ndc 판정 기준", criteriaKappa: "Kappa 판정 기준", criteriaAgreementPercent: "일치율 판정 기준(%)", instrumentName: "계측기명", data: "원측정 데이터", plannedDate: "계획일", actualStudyId: "실제 분석 번호",
  qualificationNo: "자격인정 번호", productionItem: "생산 품목", specialCharacteristic: "특별특성", characteristicType: "특성 유형", assessmentDate: "평가일", validUntil: "유효기간", requirement: "요구사항", detectionMethod: "검출 방법", detectionSampleCount: "검출 평가 횟수", detectionDefects: "불량 평가 수", detectionCorrect: "정탐 수", detectionMissed: "미검 수", detectionFalseAlarm: "오검 수", detectionSheetData: "검출력 평가 원자료", grrStudyId: "연계 GRR 번호", grrStudy: "연계 GRR", evidence: "증빙",
  operatorName: "작업자 1", operatorName2: "작업자 2", operatorName3: "작업자 3", operatorName4: "작업자 4", operatorName5: "작업자 5", operatorExperienceYears: "경력 1", operatorExperienceYears2: "경력 2", operatorExperienceYears3: "경력 3", operatorExperienceYears4: "경력 4", operatorExperienceYears5: "경력 5", workerName: "측정자", qualification: "자격", score: "점수", targetScore: "목표 점수", assessedAt: "평가일", evaluator: "평가자", nextReview: "다음 평가일",
  courseCode: "교육 과정번호", organizerDepartment: "주관 부서", educationManager: "교육 책임자", subject: "과목", trainingReport: "교육 보고서", audience: "교육 대상", instructor: "강사", durationHours: "교육 시간", trainingDate: "교육일", validityMonths: "유효기간(개월)", materialPath: "교재 주소", courseId: "교육 과정번호", course: "교육 과정", employeeName: "교육생", expiresAt: "만료일", evidencePath: "증빙 주소", materialNo: "교재 관리번호", educationPurpose: "교육 목적", learningContent: "교육 내용", contentSummary: "내용 요약", sourceName: "출처", fileName: "첨부 파일명", filePath: "첨부 주소", fileType: "첨부 유형", fileSize: "첨부 크기", videoUrl: "동영상 주소", uploadedAt: "등록일", uploadedBy: "등록자",
  projectNo: "프로젝트 번호", equipmentNo: "설비번호", characteristic: "특성", lsl: "규격 하한", usl: "규격 상한", analysisStart: "분석 시작", analysisEnd: "분석 종료", inspector: "검사자", analyst: "분석자", customerCriteria: "고객 기준", analysisType: "분석 종류", attributeType: "계수치 유형", sampleVersion: "시료 버전", subgroups: "부분군", agreements: "계수형 일치도 데이터", attributeQuality: "계수치 품질 데이터", results: "분석 결과", project: "연계 프로젝트", xName: "X 항목", xUnit: "X 단위", yName: "Y 항목", yUnit: "Y 단위", measuredBy: "측정자", measuredAt: "측정 시각", resultJson: "분석 결과", points: "X·Y 원자료",
  chart: "대상 그래프", columns: "데이터 열", rows: "데이터 값", unit: "단위", kind: "원본·수정본", parentId: "이전 자료 번호", originalFile: "보관 원본 번호",
};
