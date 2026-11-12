-- Empty CALIBRA schema. No account, business record or uploaded material is included.
PRAGMA foreign_keys=ON;
CREATE TABLE "AnnualBudget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "department" TEXT NOT NULL DEFAULT '전체',
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ApprovalDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentNo" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '임시저장',
    "requester" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "resubmission" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ApprovalHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "actorName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "opinion" TEXT NOT NULL DEFAULT '',
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApprovalHistory_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ApprovalDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ApprovalStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "role" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '대기',
    "opinion" TEXT NOT NULL DEFAULT '',
    "handledAt" DATETIME,
    CONSTRAINT "ApprovalStep_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ApprovalDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AttributeAgreementResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "inspector" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "judgment" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "measuredAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttributeAgreementResult_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CapabilityProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AttributeQualityResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "subgroupNo" TEXT NOT NULL,
    "inspectedCount" INTEGER NOT NULL,
    "defectCount" INTEGER NOT NULL,
    "defectUnit" REAL NOT NULL DEFAULT 1,
    "measuredAt" DATETIME NOT NULL,
    "measurer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttributeQualityResult_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CapabilityProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "BoardEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT '관리자',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "CalibrationAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recordId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalibrationAttachment_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "CalibrationRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CalibrationProcedure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instrumentCategory" TEXT NOT NULL,
    "calibrationRoute" TEXT NOT NULL DEFAULT '자체 검교정',
    "targetInstruments" TEXT NOT NULL,
    "standardReference" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "acceptanceCriteria" TEXT NOT NULL,
    "uncertainty" TEXT NOT NULL,
    "safety" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "revision" TEXT NOT NULL DEFAULT 'Rev.0',
    "status" TEXT NOT NULL DEFAULT '검토 중',
    "effectiveDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "CalibrationProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "accreditationNumber" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "certificateExpiry" DATETIME,
    "status" TEXT NOT NULL DEFAULT '확인 필요',
    "sourceUrl" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "CalibrationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentId" TEXT NOT NULL,
    "providerId" TEXT,
    "procedureId" TEXT,
    "performedAt" DATETIME NOT NULL,
    "nextDueDate" DATETIME NOT NULL,
    "result" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "certificatePath" TEXT,
    "cost" REAL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalibrationRecord_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CalibrationRecord_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "CalibrationProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CalibrationRecord_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "CalibrationProcedure" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "CalibrationTargetType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "measurementUnit" TEXT NOT NULL,
    "calibrationRoute" TEXT NOT NULL DEFAULT '검토 필요',
    "defaultIntervalMonths" INTEGER,
    "selfCalibrationEligible" BOOLEAN NOT NULL DEFAULT false,
    "guidance" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "CapabilityAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CapabilityAuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CapabilityProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CapabilityMeasurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "subgroupId" TEXT,
    "sequence" INTEGER NOT NULL,
    "value" REAL NOT NULL,
    "measuredAt" DATETIME NOT NULL,
    "measurer" TEXT NOT NULL,
    "originalValue" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CapabilityMeasurement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CapabilityProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CapabilityMeasurement_subgroupId_fkey" FOREIGN KEY ("subgroupId") REFERENCES "CapabilitySubgroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "CapabilityProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "processName" TEXT NOT NULL,
    "equipmentNo" TEXT NOT NULL,
    "characteristic" TEXT NOT NULL,
    "measurementUnit" TEXT NOT NULL,
    "lsl" REAL NOT NULL,
    "usl" REAL NOT NULL,
    "targetValue" REAL,
    "analysisStart" DATETIME NOT NULL,
    "analysisEnd" DATETIME NOT NULL,
    "inspector" TEXT NOT NULL,
    "analyst" TEXT NOT NULL,
    "customerCriteria" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "analysisType" TEXT NOT NULL DEFAULT '계량치',
    "attributeType" TEXT NOT NULL DEFAULT '불량률',
    "sampleVersion" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" DATETIME,
    "createdBy" TEXT NOT NULL DEFAULT '관리자',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "CapabilityReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "resultJson" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "CapabilityReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CapabilityProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CapabilityResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "resultJson" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "dataVersion" INTEGER NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CapabilityResult_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CapabilityProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CapabilitySetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "CapabilitySubgroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "subgroupNo" TEXT NOT NULL,
    "sampleSize" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CapabilitySubgroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CapabilityProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CorrelationDataPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "xValue" REAL NOT NULL,
    "yValue" REAL NOT NULL,
    "measuredAt" DATETIME NOT NULL,
    CONSTRAINT "CorrelationDataPoint_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "CorrelationStudy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CorrelationStudy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectId" TEXT,
    "xName" TEXT NOT NULL,
    "xUnit" TEXT NOT NULL DEFAULT '',
    "yName" TEXT NOT NULL,
    "yUnit" TEXT NOT NULL DEFAULT '',
    "measuredBy" TEXT NOT NULL,
    "measuredAt" DATETIME NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "resultJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CorrelationStudy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CapabilityProject" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "DisposalRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentId" TEXT NOT NULL,
    "disposalNumber" TEXT NOT NULL,
    "disposedAt" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "bookValue" REAL,
    "salvageValue" REAL,
    "disposalCost" REAL,
    "department" TEXT NOT NULL DEFAULT '',
    "certificatePath" TEXT,
    "status" TEXT NOT NULL DEFAULT '신청',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DisposalRecord_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "GageRRPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "plannedDate" DATETIME NOT NULL,
    "department" TEXT NOT NULL,
    "instrumentId" TEXT,
    "instrumentName" TEXT NOT NULL,
    "studyType" TEXT NOT NULL DEFAULT '계량치',
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '계획',
    "actualStudyId" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "GageRRStudy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "studyType" TEXT NOT NULL DEFAULT '계량치',
    "measurementUnit" TEXT NOT NULL DEFAULT 'mm',
    "measurementError" REAL,
    "department" TEXT NOT NULL DEFAULT '',
    "studyDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criteriaRRPercent" REAL NOT NULL DEFAULT 10,
    "criteriaPTPercent" REAL NOT NULL DEFAULT 10,
    "criteriaNdc" INTEGER NOT NULL DEFAULT 5,
    "criteriaKappa" REAL NOT NULL DEFAULT 0.75,
    "criteriaAgreementPercent" REAL NOT NULL DEFAULT 90,
    "instrumentId" TEXT,
    "instrumentName" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "lowerSpec" REAL,
    "upperSpec" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GageRRStudy_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Instrument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetCode" TEXT NOT NULL,
    "barcodeNumber" TEXT,
    "qrPayload" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "purchaseSource" TEXT NOT NULL DEFAULT '',
    "purchaseDate" DATETIME,
    "purchaseCost" REAL,
    "usagePurpose" TEXT NOT NULL DEFAULT '',
    "measurementRange" TEXT NOT NULL DEFAULT '',
    "measurementUnit" TEXT NOT NULL DEFAULT 'mm',
    "resolution" TEXT NOT NULL DEFAULT '',
    "accuracy" TEXT NOT NULL DEFAULT '',
    "specification" TEXT NOT NULL DEFAULT '',
    "calibrationIntervalMonths" INTEGER NOT NULL DEFAULT 12,
    "photoPath" TEXT,
    "photoPath2" TEXT,
    "photoPath3" TEXT,
    "representativePhoto" INTEGER NOT NULL DEFAULT 1,
    "storageCondition" TEXT NOT NULL DEFAULT '',
    "maintenanceDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT '정상',
    "lastCalibrated" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "preferredCalibrationProviderId" TEXT,
    CONSTRAINT "Instrument_preferredCalibrationProviderId_fkey" FOREIGN KEY ("preferredCalibrationProviderId") REFERENCES "CalibrationProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "InstrumentDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "revision" TEXT NOT NULL DEFAULT 'Rev.0',
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "contentHtml" TEXT,
    CONSTRAINT "InstrumentDocument_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "IssueTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionNo" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "issuedTo" TEXT NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL,
    "dueBackAt" DATETIME,
    "returnDepartment" TEXT NOT NULL DEFAULT '',
    "returnResponsible" TEXT NOT NULL DEFAULT '',
    "returnedAt" DATETIME,
    "purpose" TEXT NOT NULL,
    "locationOut" TEXT NOT NULL,
    "conditionOut" TEXT NOT NULL,
    "conditionIn" TEXT,
    "status" TEXT NOT NULL DEFAULT '불출 중',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IssueTransaction_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "OperatorAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerName" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "targetScore" REAL NOT NULL DEFAULT 100,
    "assessedAt" DATETIME NOT NULL,
    "evaluator" TEXT NOT NULL,
    "nextReview" DATETIME,
    "evidence" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ProcessQualification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "qualificationNo" TEXT NOT NULL,
    "processName" TEXT NOT NULL,
    "productionItem" TEXT NOT NULL DEFAULT '',
    "operatorName" TEXT NOT NULL DEFAULT '',
    "operatorName2" TEXT NOT NULL DEFAULT '',
    "operatorName3" TEXT NOT NULL DEFAULT '',
    "operatorName4" TEXT NOT NULL DEFAULT '',
    "operatorName5" TEXT NOT NULL DEFAULT '',
    "operatorExperienceYears" INTEGER,
    "operatorExperienceYears2" INTEGER,
    "operatorExperienceYears3" INTEGER,
    "operatorExperienceYears4" INTEGER,
    "operatorExperienceYears5" INTEGER,
    "department" TEXT NOT NULL,
    "specialCharacteristic" TEXT NOT NULL,
    "characteristicType" TEXT NOT NULL DEFAULT '치수',
    "assessmentDate" DATETIME NOT NULL,
    "validUntil" DATETIME,
    "requirement" TEXT NOT NULL,
    "acceptanceCriteria" TEXT NOT NULL,
    "detectionMethod" TEXT NOT NULL DEFAULT '',
    "detectionSampleCount" INTEGER NOT NULL DEFAULT 0,
    "detectionDefects" INTEGER NOT NULL DEFAULT 0,
    "detectionCorrect" INTEGER NOT NULL DEFAULT 0,
    "detectionMissed" INTEGER NOT NULL DEFAULT 0,
    "detectionFalseAlarm" INTEGER NOT NULL DEFAULT 0,
    "detectionSheetData" TEXT NOT NULL DEFAULT '',
    "method" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '검토 중',
    "grrStudyId" TEXT,
    "instrumentId" TEXT,
    "evidence" TEXT NOT NULL DEFAULT '',
    "certificatePath" TEXT,
    "certificateFileName" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProcessQualification_grrStudyId_fkey" FOREIGN KEY ("grrStudyId") REFERENCES "GageRRStudy" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProcessQualification_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ProcessStudy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT '',
    "productName" TEXT NOT NULL DEFAULT '',
    "modelName" TEXT NOT NULL DEFAULT '',
    "partNumber" TEXT NOT NULL DEFAULT '',
    "partName" TEXT NOT NULL DEFAULT '',
    "processName" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT '',
    "writtenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "measurementDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "equipmentName" TEXT NOT NULL DEFAULT '',
    "instrumentId" TEXT,
    "measurementRange" TEXT NOT NULL DEFAULT '',
    "measurementUnit" TEXT NOT NULL DEFAULT 'mm',
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "dataType" TEXT NOT NULL,
    "chartType" TEXT NOT NULL,
    "lowerSpec" REAL,
    "upperSpec" REAL,
    "targetValue" REAL,
    "subgroupSize" INTEGER NOT NULL DEFAULT 1,
    "measurements" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProcessStudy_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNumber" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "requestedBy" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "estimatedCost" REAL,
    "approvedCost" REAL,
    "actualCost" REAL,
    "status" TEXT NOT NULL DEFAULT '작성 중',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" DATETIME,
    "instrumentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseRequest_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "StorageLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationType" TEXT NOT NULL,
    "parent" TEXT,
    "custodian" TEXT NOT NULL,
    "conditions" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "TrainingCourse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organizerDepartment" TEXT NOT NULL DEFAULT '',
    "educationManager" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL,
    "trainingReport" TEXT NOT NULL DEFAULT '',
    "audience" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "durationHours" REAL NOT NULL,
    "trainingDate" DATETIME NOT NULL,
    "validityMonths" INTEGER NOT NULL DEFAULT 12,
    "materialPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "TrainingMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialNo" TEXT NOT NULL DEFAULT 'TM-LEGACY',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "educationPurpose" TEXT NOT NULL DEFAULT '',
    "learningContent" TEXT NOT NULL DEFAULT '',
    "contentSummary" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '기타',
    "sourceName" TEXT NOT NULL DEFAULT '',
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "videoUrl" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "TrainingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "score" REAL,
    "completedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME,
    "evidencePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingRecord_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "googleSubject" TEXT,
    "profileComplete" BOOLEAN NOT NULL DEFAULT true,
    "displayName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "employeeNo" TEXT,
    "phone" TEXT NOT NULL DEFAULT '',
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT '관리자',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "AnnualBudget_year_department_category_key" ON "AnnualBudget"("year", "department", "category");

CREATE INDEX "AnnualBudget_year_department_idx" ON "AnnualBudget"("year", "department");

CREATE UNIQUE INDEX "ApprovalDocument_documentNo_key" ON "ApprovalDocument"("documentNo");

CREATE INDEX "ApprovalHistory_documentId_occurredAt_idx" ON "ApprovalHistory"("documentId", "occurredAt");

CREATE UNIQUE INDEX "ApprovalHistory_documentId_sequence_key" ON "ApprovalHistory"("documentId", "sequence");

CREATE INDEX "ApprovalStep_actorName_status_idx" ON "ApprovalStep"("actorName", "status");

CREATE UNIQUE INDEX "ApprovalStep_documentId_cycle_sequence_key" ON "ApprovalStep"("documentId", "cycle", "sequence");

CREATE INDEX "AttributeAgreementResult_projectId_sampleId_inspector_idx" ON "AttributeAgreementResult"("projectId", "sampleId", "inspector");

CREATE INDEX "AttributeQualityResult_projectId_measuredAt_idx" ON "AttributeQualityResult"("projectId", "measuredAt");

CREATE INDEX "BoardEntry_boardKey_updatedAt_idx" ON "BoardEntry"("boardKey", "updatedAt");

CREATE INDEX "CalibrationAttachment_recordId_uploadedAt_idx" ON "CalibrationAttachment"("recordId", "uploadedAt");

CREATE UNIQUE INDEX "CalibrationProcedure_documentNumber_key" ON "CalibrationProcedure"("documentNumber");

CREATE INDEX "CalibrationProcedure_instrumentCategory_status_idx" ON "CalibrationProcedure"("instrumentCategory", "status");

CREATE UNIQUE INDEX "CalibrationProvider_name_key" ON "CalibrationProvider"("name");

CREATE INDEX "CalibrationProvider_status_certificateExpiry_idx" ON "CalibrationProvider"("status", "certificateExpiry");

CREATE INDEX "CalibrationRecord_instrumentId_performedAt_idx" ON "CalibrationRecord"("instrumentId", "performedAt");

CREATE UNIQUE INDEX "CalibrationTargetType_code_key" ON "CalibrationTargetType"("code");

CREATE INDEX "CapabilityAuditLog_projectId_changedAt_idx" ON "CapabilityAuditLog"("projectId", "changedAt");

CREATE INDEX "CapabilityMeasurement_projectId_measuredAt_idx" ON "CapabilityMeasurement"("projectId", "measuredAt");

CREATE INDEX "CapabilityMeasurement_projectId_sequence_idx" ON "CapabilityMeasurement"("projectId", "sequence");

CREATE INDEX "CapabilityProject_analysisType_updatedAt_idx" ON "CapabilityProject"("analysisType", "updatedAt");

CREATE INDEX "CapabilityProject_partNumber_processName_analysisStart_idx" ON "CapabilityProject"("partNumber", "processName", "analysisStart");

CREATE UNIQUE INDEX "CapabilityProject_projectNo_key" ON "CapabilityProject"("projectNo");

CREATE INDEX "CapabilityReport_projectId_generatedAt_idx" ON "CapabilityReport"("projectId", "generatedAt");

CREATE UNIQUE INDEX "CapabilityReport_reportNumber_key" ON "CapabilityReport"("reportNumber");

CREATE INDEX "CapabilityResult_projectId_calculatedAt_idx" ON "CapabilityResult"("projectId", "calculatedAt");

CREATE UNIQUE INDEX "CapabilitySubgroup_projectId_subgroupNo_key" ON "CapabilitySubgroup"("projectId", "subgroupNo");

CREATE UNIQUE INDEX "CorrelationDataPoint_studyId_sequence_key" ON "CorrelationDataPoint"("studyId", "sequence");

CREATE INDEX "CorrelationStudy_projectId_measuredAt_idx" ON "CorrelationStudy"("projectId", "measuredAt");

CREATE UNIQUE INDEX "CorrelationStudy_studyNumber_key" ON "CorrelationStudy"("studyNumber");

CREATE UNIQUE INDEX "DisposalRecord_disposalNumber_key" ON "DisposalRecord"("disposalNumber");

CREATE UNIQUE INDEX "DisposalRecord_instrumentId_key" ON "DisposalRecord"("instrumentId");

CREATE INDEX "GageRRPlan_year_plannedDate_department_idx" ON "GageRRPlan"("year", "plannedDate", "department");

CREATE UNIQUE INDEX "GageRRStudy_studyNumber_key" ON "GageRRStudy"("studyNumber");

CREATE INDEX "InstrumentDocument_instrumentId_documentType_idx" ON "InstrumentDocument"("instrumentId", "documentType");

CREATE UNIQUE INDEX "Instrument_assetCode_key" ON "Instrument"("assetCode");

CREATE UNIQUE INDEX "Instrument_barcodeNumber_key" ON "Instrument"("barcodeNumber");

CREATE INDEX "Instrument_department_status_idx" ON "Instrument"("department", "status");

CREATE INDEX "Instrument_dueDate_idx" ON "Instrument"("dueDate");

CREATE UNIQUE INDEX "Instrument_qrPayload_key" ON "Instrument"("qrPayload");

CREATE INDEX "IssueTransaction_instrumentId_status_idx" ON "IssueTransaction"("instrumentId", "status");

CREATE UNIQUE INDEX "IssueTransaction_transactionNo_key" ON "IssueTransaction"("transactionNo");

CREATE INDEX "OperatorAssessment_workerName_assessedAt_idx" ON "OperatorAssessment"("workerName", "assessedAt");

CREATE INDEX "ProcessQualification_department_status_validUntil_idx" ON "ProcessQualification"("department", "status", "validUntil");

CREATE UNIQUE INDEX "ProcessQualification_qualificationNo_key" ON "ProcessQualification"("qualificationNo");

CREATE UNIQUE INDEX "ProcessStudy_studyNumber_key" ON "ProcessStudy"("studyNumber");

CREATE UNIQUE INDEX "PurchaseRequest_instrumentId_key" ON "PurchaseRequest"("instrumentId");

CREATE UNIQUE INDEX "PurchaseRequest_requestNumber_key" ON "PurchaseRequest"("requestNumber");

CREATE UNIQUE INDEX "StorageLocation_code_key" ON "StorageLocation"("code");

CREATE UNIQUE INDEX "TrainingCourse_courseCode_key" ON "TrainingCourse"("courseCode");

CREATE UNIQUE INDEX "TrainingMaterial_filePath_key" ON "TrainingMaterial"("filePath");

CREATE UNIQUE INDEX "TrainingMaterial_materialNo_key" ON "TrainingMaterial"("materialNo");

CREATE INDEX "TrainingRecord_employeeName_completedAt_idx" ON "TrainingRecord"("employeeName", "completedAt");

CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");

CREATE UNIQUE INDEX "UserAccount_employeeNo_key" ON "UserAccount"("employeeNo");

CREATE UNIQUE INDEX "UserAccount_googleSubject_key" ON "UserAccount"("googleSubject");

CREATE UNIQUE INDEX "UserAccount_username_key" ON "UserAccount"("username");
