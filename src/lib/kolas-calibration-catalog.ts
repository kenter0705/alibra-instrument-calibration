/**
 * Common production instruments from KOLAS-G-008:2024 Annex 1.
 * The listed months are the "precision instrument" reference intervals.
 * They are defaults, not a universal mandatory interval; company policy and
 * instrument history may justify a documented adjustment.
 */
export const kolasCalibrationCatalog = [
  { code: "10601", group: "길이 및 관련량 · 기타 길이 관련량", label: "캘리퍼·캘리퍼 게이지", months: 12 },
  { code: "10603", group: "길이 및 관련량 · 기타 길이 관련량", label: "실린더·보어 게이지", months: 12 },
  { code: "10604", group: "길이 및 관련량 · 기타 길이 관련량", label: "깊이 게이지·깊이 마이크로미터", months: 12 },
  { code: "10605", group: "길이 및 관련량 · 기타 길이 관련량", label: "다이얼·디지털 게이지", months: 12 },
  { code: "10612", group: "길이 및 관련량 · 기타 길이 관련량", label: "내측 마이크로미터", months: 12 },
  { code: "10613", group: "길이 및 관련량 · 기타 길이 관련량", label: "외측 마이크로미터", months: 12 },
  { code: "10234", group: "길이 및 관련량 · 선형치수", label: "초음파식 두께 측정기", months: 12 },
  { code: "20303", group: "질량 및 관련량 · 토크", label: "토크 렌치·토크 드라이버", months: 6 },
  { code: "20406", group: "질량 및 관련량 · 압력", label: "절대압계", months: 12 },
  { code: "20408", group: "질량 및 관련량 · 압력", label: "연성 압력계", months: 12 },
  { code: "20409", group: "질량 및 관련량 · 압력", label: "차압계", months: 12 },
  { code: "20411", group: "질량 및 관련량 · 압력", label: "게이지압 압력계", months: 12 },
  { code: "20412", group: "질량 및 관련량 · 압력", label: "압력 변환기·전송기", months: 12 },
] as const;

export function kolasItemForInstrument(category: string, name = "") {
  const normalized = `${category} ${name}`.toLocaleLowerCase();
  return kolasCalibrationCatalog.find((item) =>
    normalized.includes(item.code.toLocaleLowerCase()) ||
    normalized.includes(item.label.toLocaleLowerCase()),
  );
}
