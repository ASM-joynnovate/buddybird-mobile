// birthDate(YYYY-MM-DD)를 정본으로 삼는 나이 도메인 로직

export interface BirthDateParts {
  year: number;
  month: number;
  day: number;
}

export function parseBirthDate(birthDate: string): BirthDateParts {
  const [year, month, day] = birthDate.split('-').map(Number);
  return { year, month, day };
}

export function formatBirthDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// month는 1-based. new Date(year, month, 0) 은 해당 월의 마지막 날을 가리킨다.
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// birthDate 로부터 오늘까지 경과한 만 개월 수 (생일 안 지났으면 한 달 뺌). null(모름)이면 null.
export function ageMonthsFromBirthDate(birthDate: string | null, nowMs: number = Date.now()): number | null {
  if (birthDate === null) {
    return null;
  }
  const { year, month, day } = parseBirthDate(birthDate);
  const now = new Date(nowMs);
  let months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  if (now.getDate() < day) {
    months -= 1;
  }
  return Math.max(0, months);
}

// 레거시 마이그레이션: createdAt 시점에 ageMonths였으므로 그만큼 앞선 달의 1일을 생일로 역산한다.
export function birthDateFromAgeMonths(createdAtIso: string, ageMonths: number): string {
  const created = new Date(createdAtIso);
  const target = new Date(created.getFullYear(), created.getMonth() - ageMonths, 1);
  return formatBirthDate(target.getFullYear(), target.getMonth() + 1, 1);
}
