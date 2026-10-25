import type { PluralMessages } from '@/i18n/types/plural';

export type ProfileMessages = {
	title: string;
	settings: string;
	nicknameMissing: string;
	editAccount: string;
	parrots: string;
	addParrot: string;
	editParrot: string;
	ageMonths: string;
	nickname: string;
	nicknameHint: string;
	nicknameInvalid: string;
	photoUploading: string;
	photoUploadFailed: string;
} & PluralMessages<'ageYears'>;
