import type { ParrotProfile, ProfileDraft } from './profile-types';

export const SPECIES_KO: Record<string, string> = {
  'african-grey': '회색앵무',
  cockatoo: '코카투',
  budgie: '사랑앵무',
  parakeet: '잉꼬',
  lovebird: '모란앵무',
  conure: '코뉴어',
};

export function speciesLabel(species: string): string {
  const trimmed = species.trim();
  if (!trimmed) return '';
  return SPECIES_KO[trimmed] ?? trimmed;
}

export function formatAge(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}개월`;
  if (m === 0) return `${y}년`;
  return `${y}년 ${m}개월`;
}

export function formatMinutes(seconds: number): { value: string; unit: string } {
  if (seconds < 3600) return { value: String(Math.floor(seconds / 60)), unit: '분' };
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (mins === 0) return { value: String(hours), unit: '시간' };
  return { value: `${hours}h ${mins}`, unit: '분' };
}

export function getDateKicker(): string {
  const now = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const day = days[now.getDay()];
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const period = h < 12 ? '오전' : '오후';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${day} · ${period} ${h12}:${m}`;
}

export function toDraft(profile: ParrotProfile): ProfileDraft {
  return {
    ageMonths: profile.ageMonths,
    name: profile.name,
    photoUri: profile.photoUri,
    species: profile.species,
  };
}
