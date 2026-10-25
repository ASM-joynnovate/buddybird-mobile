export type PluralMessages<Key extends string> = {
	[Form in `${Key}_${'one' | 'few' | 'many' | 'other'}`]: string;
};
